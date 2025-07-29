import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const conversationId = url.searchParams.get('conversationId');
  const projectId = url.searchParams.get('projectId');
  const userId = url.searchParams.get('userId');
  if (!conversationId || !projectId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  let conversationObjectId, projectObjectId;
  try {
    conversationObjectId = new ObjectId(conversationId);
    projectObjectId = new ObjectId(projectId);
  } catch {
    return NextResponse.json({ error: 'Invalid conversationId or projectId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const annotation = await db.collection('annotations').findOne({
    conversationId: conversationObjectId,
    projectId: projectObjectId,
    userId,
  });
  if (!annotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(annotation);
} 