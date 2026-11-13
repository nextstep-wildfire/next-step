// Cloudflare Pages Function: POST /api/chat
// All logic is in lib/core.js so it can also be tested locally.
import SOURCES from '../../public/sources.json';
import { handle } from '../../lib/core.js';

export async function onRequest(context) {
  return handle(context.request, context.env, SOURCES);
}
