'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import type { PublicWalletUser } from '@/lib/server-store';

interface PhoneAuthScreenProps {
  onAuthenticated: (token: string, user: PublicWalletUser) => void;
}

type AuthMode = 'register' | 'login';

const DEVICE_REGISTERED_KEY = 'nottpay_device_registered';

export default function PhoneAuthScreen({
  onAuthenticated,
}: PhoneAuthScreenProps) {
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [mode, setMode] = useState<AuthMode>('register');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const detectDeviceLock = async () => {
      let lockedLocally = false;
      try {
        lockedLocally =
          window.localStorage.getItem(DEVICE_REGISTERED_KEY) === '1';
      } catch {
        lockedLocally = false;
      }

      if (lockedLocally && !cancelled) {
        setDeviceLocked(true);
        setMode('login');
      }

      try {
        const res = await fetch('/api/auth/device', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { deviceRegistered?: boolean };
        if (!cancelled && data.deviceRegistered) {
          setDeviceLocked(true);
          setMode('login');
          try {
            window.localStorage.setItem(DEVICE_REGISTERED_KEY, '1');
          } catch {
            // Ignore storage errors
          }
        }
      } catch {
        // Ignore network errors on initial check
      }
    };

    void detectDeviceLock();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === 'register' && deviceLocked) return;
    setMode(nextMode);
    setErrorMsg(null);
    setPin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim()) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setErrorMsg('PIN must be 4 to 6 numeric digits.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload =
        mode === 'login'
          ? { phone: phone.trim(), pin }
          : { phone: phone.trim(), name: name.trim(), pin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = (await res.json()) as {
        token?: string;
        user?: PublicWalletUser;
        error?: string;
      };

      if (!res.ok || !data.token || !data.user) {
        if (res.status === 403 && mode === 'register') {
          setDeviceLocked(true);
          setMode('login');
          try {
            window.localStorage.setItem(DEVICE_REGISTERED_KEY, '1');
          } catch {
            // Ignore storage errors
          }
        }
        setErrorMsg(data.error || 'Authentication failed. Please try again.');
        return;
      }

      if (mode === 'register') {
        try {
          window.localStorage.setItem(DEVICE_REGISTERED_KEY, '1');
        } catch {
          // Ignore storage errors
        }
      }

      onAuthenticated(data.token, data.user);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5fb] px-4 py-8 sm:px-6 lg:flex lg:items-center lg:py-12">
      <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-8">
        {/* Left Brand Panel */}
        <section className="mb-6 flex flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br from-[#32165f] via-[#6d28d9] to-[#bd3fba] p-6 text-white shadow-[0_18px_36px_rgba(109,40,217,0.24)] sm:p-8 lg:col-span-6 lg:mb-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">
                NOTTPAY
              </span>
            </div>

            <p className="mt-6 text-xs font-bold tracking-wide text-[#e9ddff]">
              Digital Wallet · Mobile Number &amp; PIN
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Your money. Your way.
            </h1>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#e9ddff]">
              Create one wallet on your device or sign in with your mobile number and PIN from any device to access your balance and transaction history.
            </p>
          </div>

          <div className="mt-8 hidden items-center justify-between gap-4 border-t border-white/15 pt-5 lg:flex">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">
                  Synced across devices
                </p>
                <p className="text-[11px] text-[#e9ddff]">
                  One registration per device · Sign in anywhere with your number &amp; PIN
                </p>
              </div>
            </div>
            <Wallet className="h-8 w-8 text-white/60" aria-hidden="true" />
          </div>
        </section>

        {/* Right Auth Card */}
        <section className="rounded-[26px] bg-white p-6 shadow-[0_12px_32px_rgba(51,32,91,0.08)] sm:p-8 lg:col-span-6 lg:flex lg:flex-col lg:justify-center">
          {!deviceLocked ? (
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 gap-1 rounded-xl bg-[#f4f0fa] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={`min-h-[42px] whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
                  mode === 'register'
                    ? 'bg-white text-[#6d28d9] shadow-sm'
                    : 'text-[#6e6580] hover:text-[#201735]'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`min-h-[42px] whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/40 ${
                  mode === 'login'
                    ? 'bg-white text-[#6d28d9] shadow-sm'
                    : 'text-[#6e6580] hover:text-[#201735]'
                }`}
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-[#f4f0fa] px-3.5 py-2.5 text-xs font-semibold text-[#5c536f]">
              Account already created on this device. Sign in with your mobile number and PIN to access your wallet.
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-xl font-extrabold tracking-tight text-[#201735]">
              {mode === 'login'
                ? 'Sign in with mobile & PIN'
                : 'Create your NOTTPAY account'}
            </h2>
            <p className="mt-1 text-xs text-[#6e6580]">
              {mode === 'login'
                ? 'Enter your mobile number and 4–6 digit PIN to load your wallet data.'
                : 'First-time setup on this device. New wallets start with ৳5,000.00.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="auth-phone"
                className="mb-1.5 block text-xs font-bold text-[#5c536f]"
              >
                Mobile number
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8499]"
                  aria-hidden="true"
                />
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="017XXXXXXXX or +88017XXXXXXXX"
                  required
                  className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] pl-10 pr-3.5 font-mono text-sm text-[#201735] outline-none transition-colors placeholder:font-sans placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                />
              </div>
            </div>

            {mode === 'register' && !deviceLocked && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-xs font-bold text-[#5c536f]"
                >
                  Full name
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8499]"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    maxLength={40}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter your name"
                    required
                    className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] pl-10 pr-3.5 text-sm text-[#201735] outline-none transition-colors placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-pin"
                className="mb-1.5 block text-xs font-bold text-[#5c536f]"
              >
                {mode === 'login' ? 'Wallet PIN' : 'Create 4–6 digit PIN'}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8499]"
                  aria-hidden="true"
                />
                <input
                  id="auth-pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={pin}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setPin(digitsOnly);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter 4–6 digit PIN"
                  required
                  className="h-12 w-full rounded-xl border border-[#e9e3f1] bg-[#fcfbfe] pl-10 pr-12 font-mono text-sm tracking-widest text-[#201735] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-[#9890a8] focus:border-[#8b5cf6] focus:ring-3 focus:ring-[#8b5cf6]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#6e6580] transition-colors hover:bg-[#f4f0fa] hover:text-[#201735]"
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-[#fff0f5] px-3.5 py-2.5 text-xs font-semibold text-[#be264c]"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] w-full whitespace-nowrap rounded-xl bg-gradient-to-r from-[#7134d5] to-[#a044c8] px-4 py-3 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(113,52,213,0.24)] transition-opacity hover:opacity-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/50"
            >
              {submitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>

            {!deviceLocked && (
              <p className="text-center text-[11px] leading-relaxed text-[#6e6580]">
                {mode === 'register' ? (
                  <>
                    Already created an account on another phone?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#6d28d9] hover:underline"
                    >
                      Sign in with number &amp; PIN
                    </button>
                  </>
                ) : (
                  <>
                    First time here on this device?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#6d28d9] hover:underline"
                    >
                      Create your account
                    </button>
                  </>
                )}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
