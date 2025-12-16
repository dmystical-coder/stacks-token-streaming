import { StreamCreatedEvent, WithdrawalEvent, StreamCancelledEvent, StreamPausedEvent, StreamResumedEvent } from "@/types/chainhook";

export function parseStreamCreatedEvent(data: any): StreamCreatedEvent | null {
  if (data.event !== 'stream-created') return null;
  return {
    event: 'stream-created',
    'stream-id': Number(data['stream-id']),
    sender: data.sender,
    recipient: data.recipient,
    amount: Number(data.amount),
    duration: Number(data.duration),
    'token-type': data['token-type'],
    timestamp: Number(data.timestamp)
  };
}

export function parseWithdrawalEvent(data: any): WithdrawalEvent | null {
  if (data.event !== 'withdrawal') return null;
  return {
    event: 'withdrawal',
    'stream-id': Number(data['stream-id']),
    recipient: data.recipient,
    amount: Number(data.amount),
    timestamp: Number(data.timestamp)
  };
}
