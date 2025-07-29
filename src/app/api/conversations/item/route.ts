import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const conversationId = url.searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
  }
  let conversationObjectId;
  try {
    conversationObjectId = new ObjectId(conversationId);
  } catch {
    return NextResponse.json({ error: 'Invalid conversationId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const conversation = await db.collection('conversations').findOne({ _id: conversationObjectId });
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  return NextResponse.json(conversation);
} 