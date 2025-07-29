import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const projectId = url.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json([], { status: 200 });
  }
  let projectObjectId;
  try {
    projectObjectId = new ObjectId(projectId);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const conversations = await db.collection('conversations').find({ projectId: projectObjectId }).toArray();
  return NextResponse.json(conversations);
} 