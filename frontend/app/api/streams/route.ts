import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const role = searchParams.get('role'); // 'sender' | 'recipient' | 'both'

  try {
    let where = {};

    if (address) {
      if (role === 'sender') {
        where = { sender: address };
      } else if (role === 'recipient') {
        where = { recipient: address };
      } else {
        where = {
          OR: [
            { sender: address },
            { recipient: address }
          ]
        };
      }
    }

    const streams = await prisma.stream.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(streams, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
