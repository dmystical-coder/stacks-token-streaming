import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const streams = await prisma.stream.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(streams, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

