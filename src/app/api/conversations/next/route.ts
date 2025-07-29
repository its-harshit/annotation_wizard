import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }
  let projectObjectId;
  try {
    projectObjectId = new ObjectId(projectId);
  } catch {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const count = await db.collection('conversations').countDocuments({ projectId: projectObjectId });
  if (count === 0) {
    return NextResponse.json({ error: 'No conversations found for this project' }, { status: 404 });
  }
  const random = Math.floor(Math.random() * count);
  const convo = await db.collection('conversations').find({ projectId: projectObjectId }).limit(1).skip(random).toArray();
  return NextResponse.json(convo[0]);
} 