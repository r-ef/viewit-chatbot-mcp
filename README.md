integrating an MCP between a DeepSeek LLM and the Viewit chatbot

public transaction data from 14/10/2025 to 15/10/2025:
https://dubailand.gov.ae/en/open-data/real-estate-data/#/

insert.py:
grab the csv data and insert it into an sqlite database


server.js:
the actual mcp server with 2 functions

last_sold_property: returns the last sold property based on the location argument passed in the request
average_price_per_area: returns the average property price based on the area argument passed in the request

realistically, plugging this into an LLM would drastically reduce your token usage as you're only searching for what you need,
instead of prompting the LLM with all the properties which takes a long time & lots of resources for it to process

i also included the speed field into the JSON response which shows how fast the property was found

viewit chatbot response:
{
    "status": true,
    "result": {
        "messages": {
            "role": "assistant",
            "content": "..."
        },
        "model": "openai - gpt-3.5-turbo",
        "temperature": 0.1,
        "total_tokens": 11166,
        "total_cost_usd": 0.00335512
    }
}

took around 10-12 seconds


MCP server takes around 1 MS.

response example from MCP server:


k@fedora:~/dev/viewit$ curl -s -X POST http://localhost:1337/mcp -H 'Content-Type: application/json' -d '{"method":"get_last_sold_property","args":{"area":"Meydan"}}' | jq
{
  "ok": true,
  "data": {
    "TRANSACTION_NUMBER": "13-29896-2025",
    "INSTANCE_DATE": "2025-10-15 14:51:39",
    "GROUP_EN": "Mortgage",
    "PROCEDURE_EN": "Mortgage Registration",
    "IS_OFFPLAN_EN": "Ready",
    "IS_FREE_HOLD_EN": "Free Hold",
    "USAGE_EN": "Residential",
    "AREA_EN": "MEYDAN ONE",
    "PROP_TYPE_EN": "Unit",
    "PROP_SB_TYPE_EN": "Flat",
    "TRANS_VALUE": 548000,
    "PROCEDURE_AREA": 34.68,
    "ACTUAL_AREA": 34.68,
    "ROOMS_EN": "Studio",
    "PARKING": "B2-38",
    "NEAREST_METRO_EN": "Buj Khalifa Dubai Mall Metro Station",
    "NEAREST_MALL_EN": "Dubai Mall",
    "NEAREST_LANDMARK_EN": "Downtown Dubai",
    "TOTAL_BUYER": {
      "type": "Buffer",
      "data": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    "TOTAL_SELLER": {
      "type": "Buffer",
      "data": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    "MASTER_PROJECT_EN": null,
    "PROJECT_EN": "Azizi Riviera 4"
  },
  "speed": 0.833993
}