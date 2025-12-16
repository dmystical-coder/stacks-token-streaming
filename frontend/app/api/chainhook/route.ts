import { NextRequest, NextResponse } from 'next/server';
import { ChainhookPayload } from '@/types/chainhook';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  // TODO: Verify signature
  
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
