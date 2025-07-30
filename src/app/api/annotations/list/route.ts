import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const projectId = url.searchParams.get('projectId');
  const userId = url.searchParams.get('userId');
  const status = url.searchParams.get('status');
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
  const query: Record<string, unknown> = { projectId: projectObjectId };
  if (userId) query.userId = userId;
  if (status) query.status = status;
  const annotations = await db.collection('annotations').find(query).toArray();
  return NextResponse.json(annotations);
} 