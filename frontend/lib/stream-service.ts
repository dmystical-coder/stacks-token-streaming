import prisma from './db';
import { StreamCreatedEvent, WithdrawalEvent, StreamCancelledEvent, StreamPausedEvent, StreamResumedEvent } from '@/types/chainhook';

export async function upsertStream(event: StreamCreatedEvent, blockHeight: number, timestamp: number) {
  return prisma.stream.upsert({
    where: { id: event['stream-id'] },
    update: {
      sender: event.sender,
      recipient: event.recipient,
      tokenAmount: event.amount,
      startTime: timestamp,
      endTime: timestamp + event.duration,
      tokenType: event['token-type'],
      createdAtBlock: blockHeight,
    },
    create: {
      id: event['stream-id'],
      sender: event.sender,
      recipient: event.recipient,
      tokenAmount: event.amount,
      startTime: timestamp,
      endTime: timestamp + event.duration,
      tokenType: event['token-type'],
      createdAtBlock: blockHeight,
    }
  });
}

export async function processWithdrawal(event: WithdrawalEvent) {
  return prisma.stream.update({
    where: { id: event['stream-id'] },
    data: {
      withdrawnAmount: { increment: event.amount }
    }
  });
}

export async function processCancellation(event: StreamCancelledEvent) {
  return prisma.stream.update({
    where: { id: event['stream-id'] },
    data: {
      isCancelled: true
    }
  });
}
