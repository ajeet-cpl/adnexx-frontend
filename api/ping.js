// Vercel serverless function — checks connectivity from Vercel's network to the backend.
// Access it at: https://<your-vercel-domain>/api/ping
// Optionally override the backend URL via Vercel dashboard → Settings → Environment Variables:
//   BACKEND_URL — defaults to the same EC2 host configured in vercel.json rewrites
// NOTE: VITE_* vars are build-time only and are not available in serverless functions at runtime.
// const BACKEND_DEFAULT = 'https://aodbapi.corepeelers.com';
const BACKEND_DEFAULT = 'http://ec2-13-60-234-74.eu-north-1.compute.amazonaws.com:8080';


export default async function handler(req, res) {
  const target = process.env.BACKEND_URL || BACKEND_DEFAULT;
  const healthPath = '/api/v1/actuator/health';
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
