'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useStreamContract } from '@/hooks/useStreamContract';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletData } from '@/hooks/useWalletData';
import { formatRatePerDay } from '@/lib/stream';
import { formatDuration } from '@/lib/stacks';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm text-foreground transition-shadow placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

const DURATION_PRESETS: { label: string; d: number; h: number; m: number }[] = [
  { label: '1h', d: 0, h: 1, m: 0 },
  { label: '1d', d: 1, h: 0, m: 0 },
  { label: '7d', d: 7, h: 0, m: 0 },
  { label: '30d', d: 30, h: 0, m: 0 },
  { label: '1y', d: 365, h: 0, m: 0 },
];

// Stacks c32 addresses: SP/ST (or SM/SN for contracts) + ~39 base32 chars.
const STX_ADDRESS = /^S[TPMN][0-9A-Z]{38,40}$/;

export function CreateStreamModal({ isOpen, onClose, onSuccess }: CreateStreamModalProps) {
  const { userAddress } = useAuth();
  const { balance } = useWalletData(isOpen ? userAddress : null);
  const { createStream } = useStreamContract();

  const [step, setStep] = useState<'form' | 'review'>('form');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('0');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmedRecipient = recipient.trim();
  const amountNum = parseFloat(amount);
  const durationSec =
    (parseInt(days) || 0) * 86400 + (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;

  const balanceStx = balance ? Number(balance.balance) / 1_000_000 : null;
  const recipientValid = STX_ADDRESS.test(trimmedRecipient);
  const isSelf = trimmedRecipient.length > 0 && trimmedRecipient === userAddress;
  const amountValid = !isNaN(amountNum) && amountNum > 0;
  const overBalance = balanceStx != null && amountValid && amountNum > balanceStx;
  const durationValid = durationSec >= 60;

  const errors = {
    recipient: recipient && !recipientValid
      ? 'Enter a valid Stacks address.'
      : isSelf
        ? "You can't stream to yourself."
        : '',
    amount: amount && !amountValid
      ? 'Enter an amount greater than 0.'
      : overBalance
        ? 'Amount exceeds your balance.'
        : '',
    duration:
      (days !== '0' || hours !== '0' || minutes !== '0') && !durationValid
        ? 'Minimum duration is 1 minute.'
        : '',
  };

  const canContinue =
    recipientValid && !isSelf && amountValid && !overBalance && durationValid;

  const ratePerDayMicroPreview =
    amountValid && durationValid ? ((amountNum * 1_000_000) / durationSec) * 86400 : 0;
  const endDate = new Date(Date.now() + durationSec * 1000);

  const reset = () => {
    setStep('form');
    setRecipient('');
    setAmount('');
    setDays('0');
    setHours('1');
    setMinutes('0');
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createStream(
        trimmedRecipient,
        amountNum,
        parseInt(days) || 0,
        parseInt(hours) || 0,
        parseInt(minutes) || 0
      );
      onSuccess();
      onClose();
      reset();
    } catch {
      // Failure is surfaced via the toast in useStreamContract.
    } finally {
      setLoading(false);
    }
  };

  const setMax = () => {
    if (balanceStx != null) setAmount(balanceStx.toFixed(6));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-[overlay-in_0.15s_ease-out] sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create stream"
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl animate-[dialog-in_0.2s_ease-out] sm:max-w-md sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {step === 'form' ? 'New stream' : 'Review stream'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === 'form'
                ? 'Stream STX continuously to a recipient'
                : 'Confirm the details before signing'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {step === 'form' ? (
            <div className="space-y-4">
              <Field label="Recipient address" error={errors.recipient}>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="SP3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCPGZGM"
                  className={inputClass}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
              </Field>

              <Field
                label="Amount (STX)"
                error={errors.amount}
                aside={
                  balanceStx != null ? (
                    <button
                      type="button"
                      onClick={setMax}
                      className="tabular text-xs font-medium text-primary hover:underline"
                    >
                      Max {balanceStx.toLocaleString('en', { maximumFractionDigits: 4 })}
                    </button>
                  ) : null
                }
              >
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  step="0.000001"
                  min="0.000001"
                  className={inputClass}
                />
              </Field>

              <Field label="Duration" error={errors.duration}>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setDays(String(p.d));
                        setHours(String(p.h));
                        setMinutes(String(p.m));
                      }}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: days, setter: setDays, label: 'Days', max: undefined },
                    { value: hours, setter: setHours, label: 'Hours', max: 23 },
                    { value: minutes, setter: setMinutes, label: 'Mins', max: 59 },
                  ].map(({ value, setter, label, max }) => (
                    <div key={label}>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        min="0"
                        max={max}
                        className={inputClass}
                      />
                      <span className="mt-1 block text-center text-[11px] text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </Field>

              {ratePerDayMicroPreview > 0 && (
                <div className="rounded-lg border border-border bg-muted/50 px-3.5 py-3 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Flow rate</span>
                    <span className="tabular font-mono font-medium text-foreground">
                      ≈ {formatRatePerDay(ratePerDayMicroPreview)} STX/day
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="tabular font-mono text-muted-foreground">
                      {format(endDate, 'PP p')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <ReviewRow label="Recipient">
                <span className="break-all text-right font-mono text-xs text-foreground">
                  {trimmedRecipient}
                </span>
              </ReviewRow>
              <ReviewRow label="Amount">
                <span className="tabular font-mono font-medium text-foreground">
                  {amountNum.toLocaleString('en', { maximumFractionDigits: 6 })} STX
                </span>
              </ReviewRow>
              <ReviewRow label="Flow rate">
                <span className="tabular font-mono text-foreground">
                  {formatRatePerDay(ratePerDayMicroPreview)} STX/day
                </span>
              </ReviewRow>
              <ReviewRow label="Duration">
                <span className="font-mono text-foreground">{formatDuration(durationSec)}</span>
              </ReviewRow>
              <ReviewRow label="Ends">
                <span className="tabular font-mono text-foreground">
                  {format(endDate, 'PP p')}
                </span>
              </ReviewRow>
              {balanceStx != null && (
                <ReviewRow label="Balance after">
                  <span className="tabular font-mono text-muted-foreground">
                    ≈ {(balanceStx - amountNum).toLocaleString('en', { maximumFractionDigits: 4 })} STX
                  </span>
                </ReviewRow>
              )}
            </dl>
          )}
        </div>

        <div className="flex gap-2 border-t border-border px-6 py-4">
          {step === 'form' ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!canContinue}
                className="flex-1 gap-1.5"
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={loading}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 gap-1.5">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Confirming…' : 'Create stream'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  aside,
  children,
}: {
  label: string;
  error?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {aside}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
