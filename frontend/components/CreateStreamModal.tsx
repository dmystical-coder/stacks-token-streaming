'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useStreamContract } from '@/hooks/useStreamContract';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStreamModal({ isOpen, onClose, onSuccess }: CreateStreamModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('0');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { createStream } = useStreamContract();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!recipient.startsWith('S')) newErrors.recipient = 'Invalid Stacks address';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (parseInt(days) === 0 && parseInt(hours) === 0 && parseInt(minutes) === 0) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      // Reset form
      setRecipient('');
      setAmount('');
      setDays('0');
      setHours('1');
      setMinutes('0');
      setErrors({});
    } catch (error) {
      console.error('Error creating stream:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Stream</DialogTitle>
          <DialogDescription>
            Set up a new token stream. The recipient will be able to withdraw tokens as they vest.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
              className={cn(
                "font-mono text-sm",
                errors.recipient ? "border-red-500 focus-visible:ring-red-500" : ""
              )}
            />
            {errors.recipient && (
              <span className="text-xs text-red-500 font-medium">{errors.recipient}</span>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (STX)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0.000001"
                className={cn(
                  "pr-12",
                  errors.amount ? "border-red-500 focus-visible:ring-red-500" : ""
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">
                STX
              </span>
            </div>
            {errors.amount && (
              <span className="text-xs text-red-500 font-medium">{errors.amount}</span>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Duration</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min="0"
                  className="text-center"
                />
                <span className="text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">Days</span>
              </div>
              <div className="grid gap-1.5">
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="0"
                  max="23"
                  className="text-center"
                />
                <span className="text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">Hours</span>
              </div>
              <div className="grid gap-1.5">
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  min="0"
                  max="59"
                  className="text-center"
                />
                <span className="text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">Mins</span>
              </div>
            </div>
            {errors.duration && (
              <span className="text-xs text-red-500 font-medium">{errors.duration}</span>
            )}
          </div>
          
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="w-full sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={cn(
                "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all",
                loading ? "opacity-90" : "hover:shadow-lg hover:-translate-y-0.5"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Stream
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
