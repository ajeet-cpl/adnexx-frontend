// Vercel serverless function — checks connectivity from Vercel's network to the backend.
// Access it at: https://<your-vercel-domain>/api/ping
export default async function handler(req, res) {
  const target = process.env.VITE_API_URL || 'https://adnexx-backend-production.up.railway.app';
  const url = `${target.replace(/\/+$/, '')}/api/v1/actuator/health`;

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
