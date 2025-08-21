import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API_KEY = process.env.OPENAI_API_KEY;

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
