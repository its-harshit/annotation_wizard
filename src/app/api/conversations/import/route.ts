import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const data = await req.json();
  const { projectId, conversations } = data;
  if (!projectId || !Array.isArray(conversations) || conversations.length === 0) {
    return NextResponse.json({ error: 'Missing projectId or conversations' }, { status: 400 });
  }
  let projectObjectId;
  try {
    projectObjectId = new ObjectId(projectId);
  } catch {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const docs = conversations.map((c: Record<string, unknown>) => ({
    ...c,
    conversation: (c.conversation as Array<Record<string, unknown>>).map((turn: Record<string, unknown>) => ({
      ...turn,
      turnId: turn.turnId || randomUUID(), // Preserve existing turnId if present
    })),
    projectId: projectObjectId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const result = await db.collection('conversations').insertMany(docs);
  return NextResponse.json({ insertedCount: result.insertedCount });
} 