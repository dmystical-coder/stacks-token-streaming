'use client';

import { useEffect, useState } from 'react';
import { ConnectWallet } from '@/components/ConnectWallet';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { splitStx } from '@/lib/stream';
import { getContractUrl } from '@/lib/network';
import {
  ArrowDownLeft,
  Banknote,
  CalendarClock,
  Download,
  FileText,
  Plus,
  Repeat,
  ScrollText,
  ShieldCheck,
  Waves,
} from 'lucide-react';

/**
 * Honest hero media: the product's own live-flow counter running on a looping
 * synthetic stream. Not a screenshot — it's the real UI motion.
 */
function LiveStreamDemo() {
  const [now, setNow] = useState(() => Date.now());
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const interval = reducedMotion ? 1000 : 60;
    const tick = (t: number) => {
      if (t - last >= interval) {
        setNow(Date.now());
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const TOTAL_STX = 1240;
  const CYCLE_MS = 45_000;
  const frac = (now % CYCLE_MS) / CYCLE_MS;
  const available = splitStx(TOTAL_STX * frac * 1_000_000);

  return (
    <div className="w-full rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">#1042</span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-mono text-xs text-muted-foreground">
            from SP2J3W…E9KQ
          </span>
        </div>
        <span
          className="inline-flex shrink-0 items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
          style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          active
        </span>
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Available</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-live-pulse" />
          streaming
        </span>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="tabular font-mono text-3xl font-semibold leading-none tracking-tight text-foreground">
          {available.int}
          <span className="text-muted-foreground">.{available.frac}</span>
        </span>
        <span className="text-sm text-muted-foreground">STX</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
        <span className="tabular">41.33 STX/day</span>
        <span className="text-border">·</span>
        <span className="tabular">1,240 STX total</span>
      </div>

      <div className="mb-3.5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular font-mono">{(frac * 100).toFixed(1)}%</span>
          <span>streaming live</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="relative h-full overflow-hidden rounded-full bg-primary"
            style={{ width: `${frac * 100}%` }}
          >
            <span className="absolute inset-y-0 left-0 w-1/4 -translate-x-full animate-[flow-sheen_1.6s_linear_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
          </div>
        </div>
      </div>

      <div className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground">
        <Download className="h-3 w-3" />
        Withdraw
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Plus,
    title: 'Open a stream',
    body: 'Pick a recipient, an amount, and a duration. Sign once.',
  },
  {
    icon: Waves,
    title: 'It flows every second',
    body: 'Tokens vest continuously and update live — no scheduled payouts.',
  },
  {
    icon: Download,
    title: 'Withdraw anytime',
    body: 'Recipients claim whatever has vested. Senders can pause or cancel.',
  },
];

const USE_CASES = [
  { icon: Banknote, title: 'Payroll', body: 'Pay contributors continuously instead of monthly.' },
  { icon: CalendarClock, title: 'Vesting', body: 'Token grants that unlock by the second.' },
  { icon: Repeat, title: 'Subscriptions', body: 'Recurring payments without recurring transactions.' },
  { icon: FileText, title: 'Grants', body: 'Milestone funding you can pause if needed.' },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Non-custodial',
    body: 'Funds sit in the contract, not with us. Only the parties move them.',
  },
  {
    icon: ScrollText,
    title: 'Clarity 4 contract',
    body: 'Explicit allowances and post-conditions guard every transfer.',
  },
  {
    icon: Repeat,
    title: 'Fair cancellation',
    body: 'On cancel, vested tokens go to the recipient and the rest is refunded.',
  },
];

export function Landing() {
  return (
    <div className="space-y-20 py-8 sm:py-12">
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden
          className="blueprint-grid pointer-events-none absolute inset-x-0 -top-8 h-72"
        />
        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Token streaming on Stacks
            </span>
            <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              Stream STX by the second.
            </h1>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
              Send money that flows continuously — for payroll, vesting, and
              subscriptions. Recipients withdraw whatever has vested, anytime.
              Non-custodial, settled on-chain.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ConnectWallet />
              <a
                href="#how"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                How it works →
              </a>
            </div>
          </div>
          <div className="md:pl-4">
            <LiveStreamDemo />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="bg-card p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="tabular font-mono text-xs text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-medium text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section>
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          Built for continuous payments
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-5">
              <Icon className="h-5 w-5 text-foreground" />
              <h3 className="mt-3 font-medium text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section>
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          Your funds, your rules
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA — inverted band, inverts per theme */}
      <section className="rounded-2xl bg-foreground px-6 py-12 text-center sm:px-12">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-background sm:text-3xl">
          Start streaming in seconds
        </h2>
        <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-background/70">
          Connect a Stacks wallet to open your first stream. No account, no
          custody.
        </p>
        <div className="mt-7 flex justify-center">
          <ConnectWallet />
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary">
            <Waves className="h-3 w-3 text-primary-foreground" />
          </span>
          <span>StreamSTX · built on Stacks</span>
        </div>
        <a
          href={getContractUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          View contract on explorer →
        </a>
      </footer>
    </div>
  );
}
