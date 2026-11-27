// Cloudflare Pages Function: POST /api/count (cookie-free counts). Logic in lib/events.js.
import { handleCount } from '../../lib/events.js';

export async function onRequest(context) {
  return handleCount(context.request, context.env);
}
