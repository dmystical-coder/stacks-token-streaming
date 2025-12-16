import { NextRequest, NextResponse } from 'next/server';
import { ChainhookPayload, TransactionEvent } from '@/types/chainhook';
import { 
  parseStreamCreatedEvent, 
  parseWithdrawalEvent, 
  parseStreamCancelledEvent, 
  parseStreamPausedEvent, 
  parseStreamResumedEvent 
} from '@/lib/chainhooks';

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
        processTransaction(tx);
      }
    }
  }
  
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

function processTransaction(tx: TransactionEvent) {
  if (tx.metadata.receipt.events) {
    for (const event of tx.metadata.receipt.events) {
      if (event.type === 'smart_contract_log') {
        handleContractLog(event.data?.value);
      }
    }
  }
}

function handleContractLog(data: any) {
  if (!data) return;

  const streamCreated = parseStreamCreatedEvent(data);
  if (streamCreated) {
    console.log('Stream Created:', streamCreated);
    return;
  }

  const withdrawal = parseWithdrawalEvent(data);
  if (withdrawal) {
    console.log('Withdrawal:', withdrawal);
    return;
  }
}
