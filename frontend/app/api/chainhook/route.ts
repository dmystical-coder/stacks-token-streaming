import { NextRequest, NextResponse } from 'next/server';
import { ChainhookPayload } from '@/types/chainhook';

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
        // Process successful transactions
        processTransaction(tx);
      }
    }
  }
  
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

function processTransaction(tx: any) {
  // Placeholder for processing logic
}
