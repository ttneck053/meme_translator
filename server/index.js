import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_KEY = process.env.OPENAI_API_KEY;
const LOG_DIR = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'inputs.ndjson');

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

app.post('/api/log', (req, res) => {
  try {
    const { text = '' } = req.body || {};
    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ ok: false, error: 'empty_text' });
    }
    ensureLogDir();
    const record = {
      ts: new Date().toISOString(),
      text
    };
    fs.appendFile(LOG_FILE, JSON.stringify(record) + '\n', (err) => {
      if (err) return res.status(500).json({ ok: false });
      res.json({ ok: true });
    });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text = '', direction = 'toPangyo', vibe = true } = req.body || {};
    const system = `You are a Korean copywriter who translates between Standard Korean and "Pangyo corporate lingo" (판교체).
- When direction is toPangyo: convert to Pangyo-ese. If vibe is true, lightly add corporate flair while preserving content.
- When direction is toStandard: convert back to clear Standard Korean.
- Output only the converted text.`;
    const user = `direction=${direction} vibe=${vibe}\n\n${text}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.4
      })
    });

    if (!resp.ok) return res.status(502).json({ error: 'upstream_error' });
    const data = await resp.json();
    const textOut = data.choices?.[0]?.message?.content?.trim() ?? '';
    res.json({ text: textOut });
  } catch {
    res.status(500).json({ error: 'LLM translation failed' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Server on http://localhost:${port}`));
