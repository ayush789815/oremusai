import axios from 'axios';

// Oremus AI query service. Lives on its own origin (separate from the /api
// backend), so it uses a dedicated axios call rather than the shared client.
// Override the base via NEXT_PUBLIC_AI_API_URL in production if the host changes.
const AI_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'https://oremuscorp.ai';

// POST /query { platform, question } → AI answer.
export async function askAI({ platform, question }) {
  const { data } = await axios.post(
    `${AI_BASE}/query`,
    { platform, question },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
  );
  return data;
}

// The /query response shape isn't strictly fixed — pull the human-readable
// answer from the most likely fields, falling back to the raw payload.
export function extractAnswer(data) {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  const answer = data.answer ?? data.response ?? data.message ?? data.result ?? data.text;
  if (answer != null) return typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2);
  return JSON.stringify(data, null, 2);
}
