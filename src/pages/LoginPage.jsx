import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { setSession, isAuthenticated } from '@/utils/auth';
import env from '@/config/env';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!usernameOrEmail.trim()) {
      setError('Username or email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${env.API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const data = await response.json();
          throw new Error(data.message || data.error || 'Login failed');
        } else {
          const text = await response.text();
          throw new Error(text || `Login failed with status ${response.status}`);
        }
      }

      const json = isJson ? await response.json() : null;
      const sessionData = json?.data || json;
      if (!sessionData || !(sessionData.accessToken || sessionData.token)) {
        throw new Error('Invalid response from server');
      }

      // Store session using shared session helper
      setSession(sessionData);

      // Redirect to original destination or admin dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Left branding panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo + product name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '64px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '10px',
            background: 'var(--blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--blue)', textTransform: 'uppercase', margin: 0 }}>ADNexx Platform</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>Airport Operations Database (AODB)</p>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-1)', margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>Airport</h1>
          <h1 style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.1, color: 'var(--blue)', margin: '0 0 4px', fontFamily: 'Syne, sans-serif' }}>Operations</h1>
          <h1 style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-1)', margin: '0 0 24px', fontFamily: 'Syne, sans-serif' }}>Control Platform</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '380px', lineHeight: 1.7, margin: 0 }}>
            Real-time management of gates, stands, terminals, and runways with intelligent automation and conflict resolution.
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { title: 'Smart Resource Allocation', desc: 'AI-powered gate, stand & belt assignment' },
            { title: 'Conflict Detection Engine', desc: 'Prevent overlaps with real-time validation' },
            { title: 'Operational Timeline View', desc: 'Gantt-based visualization for planning & monitoring' },
          ].map((f) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: 'var(--text-1)', fontWeight: 600 }}>{f.title}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div style={{
        width: '480px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        background: 'var(--surface-1)',
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px', fontFamily: 'Syne, sans-serif' }}>Sign in</h2>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username */}
          <div>
            <label className="field-label">Username / Email</label>
            <input
              className="field-input"
              type="text"
              placeholder="admin@airport.com"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.9rem', marginTop: '8px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: '48px', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
          ADNexx Platform · Airport Operations Database
        </p>
      </div>
    </div>
  );
}

