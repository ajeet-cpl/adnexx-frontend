// Vercel serverless function — checks connectivity from Vercel's network to the backend.
// Access it at: https://<your-vercel-domain>/api/ping
// Requires env var BACKEND_URL set in Vercel dashboard (Settings → Environment Variables)
// NOTE: VITE_* vars are build-time only and not available in serverless functions at runtime.
export default async function handler(req, res) {
  const target = process.env.BACKEND_URL || 'http://localhost:8080';
  const healthPath = process.env.HEALTH_PATH || '/api/v1/actuator/health';
  const url = `${target.replace(/\/+$/, '')}${healthPath}`;

  try {
    const start = Date.now();
    const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const ms = Date.now() - start;
    const text = await response.text();

    res.status(200).json({
      reachable: true,
      status: response.status,
      latencyMs: ms,
      target: url,
      body: text.slice(0, 300),
    });
  } catch (err) {
    res.status(200).json({
      reachable: false,
      target: url,
      error: err.message,
    });
  }
}
