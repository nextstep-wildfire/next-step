// Cloudflare Pages Function: POST /api/feedback ("Something unclear? Tell us"). Logic in lib/events.js.
import { handleFeedback } from '../../lib/events.js';

export async function onRequest(context) {
  return handleFeedback(context.request, context.env);
}
