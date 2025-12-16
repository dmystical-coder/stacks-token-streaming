import { NextRequest, NextResponse } from 'next/server';
import { ChainhookPayload, TransactionEvent } from '@/types/chainhook';
import { 
  parseStreamCreatedEvent, 
  parseWithdrawalEvent, 
  parseStreamCancelledEvent, 
  parseStreamPausedEvent, 
  parseStreamResumedEvent 
} from '@/lib/chainhooks';
import { 
  upsertStream, 
  processWithdrawal, 
  processCancellation, 
  processPause, 
  processResume 
} from '@/lib/stream-service';

export async function POST(req: NextRequest) {
  const body: ChainhookPayload = await req.json();
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  // TODO: Verify signature

  for (const apply of body.apply) {
    for (const tx of apply.transactions) {
      if (tx.metadata.receipt.status === 'success') {
        await processTransaction(tx, apply.block_identifier.index, apply.timestamp);
      }
    }
  }
  
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

async function processTransaction(tx: TransactionEvent, blockHeight: number, timestamp: number) {
  if (tx.metadata.receipt.events) {
    for (const event of tx.metadata.receipt.events) {
      if (event.type === 'smart_contract_log') {
        await handleContractLog(event.data?.value, blockHeight, timestamp);
      }
    }
  }
}

async function handleContractLog(data: any, blockHeight: number, timestamp: number) {
  if (!data) return;

  const streamCreated = parseStreamCreatedEvent(data);
  if (streamCreated) {
    console.log('Stream Created:', streamCreated);
    await upsertStream(streamCreated, blockHeight, timestamp);
    return;
  }

  const withdrawal = parseWithdrawalEvent(data);
  if (withdrawal) {
    console.log('Withdrawal:', withdrawal);
    await processWithdrawal(withdrawal);
    return;
  }

  const cancelled = parseStreamCancelledEvent(data);
  if (cancelled) {
    console.log('Stream Cancelled:', cancelled);
    await processCancellation(cancelled);
    return;
  }

  const paused = parseStreamPausedEvent(data);
  if (paused) {
    console.log('Stream Paused:', paused);
    await processPause(paused);
    return;
  }

  const resumed = parseStreamResumedEvent(data);
  if (resumed) {
    console.log('Stream Resumed:', resumed);
    await processResume(resumed);
    return;
  }
}
