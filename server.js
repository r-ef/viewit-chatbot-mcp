const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());

const database_path = path.resolve('transactions.db');
const db = new sqlite3.Database(database_path);

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

app.post('/mcp', async (req, res) => {
  try {
    const started = process.hrtime.bigint();
    const { method, args } = req.body || {};
    if (!method) return res.status(400).json({ error: 'method is required' });

    if (method === 'last_sold_property') {
      const area = (args && args.area) || '';
      const rows = await runQuery(
        `SELECT * FROM transactions
         WHERE AREA_EN LIKE ?
         ORDER BY datetime(INSTANCE_DATE) DESC
         LIMIT 1`,
        [`%${area}%`]
      );
      const speed = Number(process.hrtime.bigint() - started) / 1e6;
      return res.json({ ok: true, data: rows[0] || null, speed });
    }

    if (method === 'average_price_per_area') {
      const area = (args && args.area) || '';
      const timeframe = (args && args.timeframe) || 'all';
      let where = '1=1';
      const params = [];
      if (area) {
        where += ' AND AREA_EN LIKE ?';
        params.push(`%${area}%`);
      }
      if (/^\d+d$/.test(timeframe)) {
        const days = parseInt(timeframe, 10);
        where += ' AND datetime(INSTANCE_DATE) >= datetime("now", ?)';
        params.push(`-${days} days`);
      }
      const rows = await runQuery(
        `SELECT AREA_EN as area, AVG(TRANS_VALUE) as average_price, COUNT(*) as count
         FROM transactions
         WHERE ${where}
         GROUP BY AREA_EN
         ORDER BY count DESC
         LIMIT 1`,
        params
      );
      const speed = Number(process.hrtime.bigint() - started) / 1e6;
      return res.json({ ok: true, data: rows[0] || null, speed });
    }

    if (method === 'methods') {
      const speed = Number(process.hrtime.bigint() - started) / 1e6;
      return res.json({ ok: true, data: [
        { name: 'last_sold_property', args: { area: 'string' } },
        { name: 'average_price_per_area', args: { area: 'string', timeframe: 'e.g. 30d|all' } }
      ], speed });
    }

    const speed = Number(process.hrtime.bigint() - started) / 1e6;
    return res.status(404).json({ error: `unknown method ${method}`, speed });
  } catch (err) {
    const speed = 0;
    return res.status(500).json({ error: err.message, speed });
  }
});

const PORT = 1337;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});