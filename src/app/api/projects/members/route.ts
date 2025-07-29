import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const data = await req.json();
  const { projectId, email } = data;
  if (!projectId || !email) {
    return NextResponse.json({ error: 'Missing projectId or email' }, { status: 400 });
  }
  let projectObjectId;
  try {
    projectObjectId = new ObjectId(projectId);
  } catch {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  await db.collection('projects').updateOne(
    { _id: projectObjectId },
    { $addToSet: { members: email } }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  // TODO: Check if requester is admin
  const { projectId, email } = await req.json();
  if (!projectId || !email) {
    return NextResponse.json({ error: 'Missing projectId or email' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const result = await db.collection('projects').updateOne(
    { _id: typeof projectId === 'string' ? new (await import('mongodb')).ObjectId(projectId) : projectId },
    { $pull: { members: email } }
  );
  if (result.modifiedCount === 1) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: 'Project not found or member not removed' }, { status: 404 });
  }
} 