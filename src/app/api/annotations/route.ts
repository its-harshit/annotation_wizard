import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const data = await req.json();
  if (!data || !data.conversationId || !data.userId || !data.projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  let projectObjectId, conversationObjectId;
  try {
    projectObjectId = new ObjectId(data.projectId);
    conversationObjectId = new ObjectId(data.conversationId);
  } catch {
    return NextResponse.json({ error: 'Invalid projectId or conversationId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const status = data.status || 'in_progress';
  const updateDoc = {
    $set: {
      conversationId: conversationObjectId,
      projectId: projectObjectId,
      userId: data.userId,
      conversationRatings: data.conversationRatings,
      conversationComment: data.conversationComment,
      turnRatings: data.turnRatings,
      turnComments: data.turnComments,
      turnSkipped: data.turnSkipped,
      conversationSkipped: data.conversationSkipped,
      status,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  };
  const result = await db.collection('annotations').updateOne(
    {
      conversationId: conversationObjectId,
      projectId: projectObjectId,
      userId: data.userId,
    },
    updateDoc,
    { upsert: true }
  );
  return NextResponse.json({ upserted: result.upsertedId, matchedCount: result.matchedCount });
} 