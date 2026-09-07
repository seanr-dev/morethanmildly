import { useEffect, useState } from 'react';
import {
  login,
  logout,
  handleAuthCallback,
  acceptInvite,
  updateUser,
  requestPasswordRecovery,
} from '@netlify/identity';
import Icon from '../Icon';
export default function Login({
  forbidden = false,
  publicOrigin,
}: {
  forbidden?: boolean;
  publicOrigin: string;
}) {
  const [mode, setMode] = useState<
    'login' | 'recovery' | 'password' | 'invite'
  >('login');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    void handleAuthCallback()
      .then((result) => {
        if (result?.type === 'recovery') setMode('password');
        else if (result?.type === 'invite') {
          setToken(result.token || '');
          setMode('invite');
        } else if (result?.user) location.href = '/admin';
      })
      .catch((e) =>
        setError(e.message || 'This sign-in link could not be verified.'),
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    try {
      if (mode === 'recovery') {
        await requestPasswordRecovery(email);
        setMessage('If this account exists, you’ll receive a recovery email.');
      } else if (mode === 'invite') {
        await acceptInvite(token, password);
        location.href = '/admin';
      } else if (mode === 'password') {
        await updateUser({ password });
        location.href = '/admin';
      } else {
        await login(email, password);
        location.href = '/admin';
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to sign in. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (forbidden)
    return (
      <section className="admin-login">
        <span className="eyebrow">EDITORIAL ADMINISTRATION</span>
        <h1>Access is restricted.</h1>
        <p>
          Your account is signed in, but an administrator needs to assign it the
          admin role before you can access the portal.
        </p>
        <button
          className="button secondary"
          onClick={async () => {
            await logout();
            location.reload();
          }}
        >
          Sign out
        </button>
      </section>
    );
  return (
    <section className="admin-login">
      <span className="eyebrow">MORE THAN MILDLY · ADMIN</span>
      <h1>
        {mode === 'login'
          ? 'Welcome back.'
          : mode === 'recovery'
            ? 'Let’s get you back in.'
            : 'Make it yours.'}
      </h1>
      <p>
        {mode === 'login'
          ? 'Sign in to your editorial workspace.'
          : mode === 'recovery'
            ? 'Enter your account email to request a password reset.'
            : 'Choose a password to secure your account.'}
      </p>
      <form onSubmit={submit}>
        {(mode === 'login' || mode === 'recovery') && (
          <label>
            Email address
            <input type="email" name="email" autoComplete="username" required />
          </label>
        )}
        {mode !== 'recovery' && (
          <label>
            {mode === 'login' ? 'Password' : 'New password'}
            <input
              type="password"
              name="password"
              required
              minLength={mode === 'login' ? 1 : 12}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </label>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button className="button" disabled={busy}>
          {busy
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : mode === 'recovery'
                ? 'Send recovery link'
                : 'Save password'}
          <Icon name="arrow" size={18} />
        </button>
      </form>
      <div className="login-links">
        <button
          className="text-button"
          onClick={() => {
            setMode(mode === 'login' ? 'recovery' : 'login');
            setError('');
            setMessage('');
          }}
        >
          {mode === 'login' ? 'Forgot your password?' : 'Back to sign in'}
        </button>
        <a href={publicOrigin}>Back to the journal</a>
      </div>
      <p className="form-privacy" style={{ marginTop: 30 }}>
        This portal is for authorised administrators. Public registration is not
        offered.
      </p>
      <noscript>
        <p>JavaScript is required to sign in.</p>
      </noscript>
    </section>
  );
}
