'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useStreamContract } from '@/hooks/useStreamContract';
import { X } from 'lucide-react';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-shadow font-mono';

export function CreateStreamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStreamModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('0');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [loading, setLoading] = useState(false);

  const { createStream } = useStreamContract();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createStream(
        recipient,
        parseFloat(amount),
        parseInt(days),
        parseInt(hours),
        parseInt(minutes)
      );
      onSuccess();
      onClose();
      setRecipient('');
      setAmount('');
      setDays('0');
      setHours('1');
      setMinutes('0');
    } catch (err) {
      console.error('Error creating stream:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              New Stream
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stream STX continuously to a recipient
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Recipient address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="SP3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCPGZGM"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Amount (STX)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              step="0.000001"
              min="0.000001"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Duration
            </label>
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
                  <span className="block text-center text-[11px] text-slate-400 mt-1">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5"
            >
              {loading ? 'Creating…' : 'Create Stream'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
