import OpenAI from 'openai';
import fetch from 'node-fetch';

const llm = new OpenAI({
    apiKey: "",
    baseURL: 'https://openrouter.ai/api/v1',
});

const tools = [
    {
        type: 'function',
        function: {
            name: 'last_sold_property',
            description: 'return the most recent sale matching an area name or partial match.',
            parameters: {
                type: 'object',
                properties: {
                    area: { type: 'string', description: 'area name or partial match.' },
                },
                required: ['area'],
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'average_price_per_area',
            description: 'average price for an area. optionally within a timeframe like 30d or all.',
            parameters: {
                type: 'object',
                properties: {
                    area: { type: 'string', description: 'area name or partial match.' },
                    timeframe: { type: 'string', description: 'example 30d or all.', default: 'all' },
                },
                required: ['area'],
                additionalProperties: false,
            },
        },
    },
];

async function callMCP(method, args) {
    const res = await fetch('http://localhost:1337/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, args }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`MCP error ${res.status}: ${text}`);
    }
    return res.json();
}

async function main(userPrompt) {
    const messages = [
        { role: 'system', content: 'be concise. use tools when they help answer the question.' },
        { role: 'user', content: userPrompt },
    ];

    const first = await llm.chat.completions.create({
        model: "anthropic/claude-haiku-4.5",
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0,
    });

    const choice = first.choices?.[0];
    const toolCalls = choice?.message?.tool_calls || [];

    if (!toolCalls.length) {
        return choice?.message?.content || '';
    }

    const toolMessages = [];
    for (const call of toolCalls) {
        const name = call.function.name;
        const argStr = call.function.arguments || '{}';
        const args = typeof argStr === 'string' ? JSON.parse(argStr) : argStr;
        const result = await callMCP(name, args);
        toolMessages.push({
            tool_call_id: call.id,
            role: 'tool',
            name,
            content: JSON.stringify(result),
        });
    }

    const second = await llm.chat.completions.create({
        model: "anthropic/claude-haiku-4.5",
        messages: [
            ...messages,
            choice.message,
            ...toolMessages,
        ],
        temperature: 0,
    });

    const finalText = second.choices?.[0]?.message?.content || '';

    return finalText;
}

async function run() {
    const userPrompt = 'what was the last sold property in Meydan, and what is the 30d average price?';
    const answer = await main(userPrompt);
    console.log(answer);
}

run();