import prisma from './db';
import { StreamCreatedEvent, WithdrawalEvent, StreamCancelledEvent, StreamPausedEvent, StreamResumedEvent } from '@/types/chainhook';

export async function upsertStream(event: StreamCreatedEvent) {
  return prisma.stream.upsert({
    where: { id: event['stream-id'] },
    update: {
      sender: event.sender,
      recipient: event.recipient,
      tokenAmount: event.amount,
      startTime: Date.now(), // Placeholder, needs actual block time logic
      endTime: Date.now() + (event.duration * 1000), // Placeholder
      tokenType: event['token-type'],
      createdAtBlock: 0, // Need to extract from tx metadata
    },
    create: {
      id: event['stream-id'],
      sender: event.sender,
      recipient: event.recipient,
      tokenAmount: event.amount,
      startTime: Date.now(),
      endTime: Date.now() + (event.duration * 1000),
      tokenType: event['token-type'],
      createdAtBlock: 0,
    }
  });
}

export async function processWithdrawal(event: WithdrawalEvent) {
  const stream = await prisma.stream.findUnique({ where: { id: event['stream-id'] } });
  if (!stream) return;

  return prisma.stream.update({
    where: { id: event['stream-id'] },
    data: {
      withdrawnAmount: { increment: event.amount }
    }
  });
}

