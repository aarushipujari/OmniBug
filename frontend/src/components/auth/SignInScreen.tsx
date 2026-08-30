import React, { useEffect, useState } from 'react';
import { Bug, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { api, DemoAccount } from '../../services/api.js';
import { User } from '../../types/index.js';

interface SignInScreenProps {
  onSignedIn: (user: User) => void;
}

/**
 * Sign-in.
 *
 * The server verifies a password and issues a signed, expiring token; the
 * client cannot assert an identity any more. To keep evaluation frictionless
 * the seeded accounts and their shared password are listed here and fill the
 * form in one click — the credential is still checked server-side, so the role
 * boundaries being demonstrated are real rather than simulated.
 */
export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignedIn }) => {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [demoPassword, setDemoPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getDemoAccounts()
      .then(res => {
        if (cancelled) return;
        setAccounts(res.accounts);
        setDemoPassword(res.password);
        if (res.accounts[0]) setEmail(res.accounts[0].email);
        setPassword(res.password);
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the API. Is the backend running?');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user } = await api.login(email, password);
      onSignedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 font-sans">
      <div className="w-full max-w-md">
        <header className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white shadow-xs">
            <Bug className="w-6 h-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">OmniBug</h1>
            <p className="text-sm text-slate-500">Issue lifecycle management</p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs"
          aria-labelledby="signin-heading"
        >
          <h2 id="signin-heading" className="text-base font-bold text-slate-900">
            Sign in
          </h2>

          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="signin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-xs"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-xs transition-colors font-mono"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {accounts.length > 0 && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs" aria-labelledby="demo-heading">
            <h2 id="demo-heading" className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
              <ShieldCheck className="w-4 h-4 text-slate-700" aria-hidden="true" />
              Evaluation accounts
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Each role sees different permissions. Password for all:{' '}
              <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-slate-900 font-mono font-bold">
                {demoPassword}
              </code>
            </p>
            <ul className="space-y-1.5">
              {accounts.map(account => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(demoPassword);
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
                  >
                    <span className="truncate font-medium">{account.name}</span>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600">
                      {account.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
