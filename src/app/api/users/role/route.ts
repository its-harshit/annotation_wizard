import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  // TODO: Check if requester is admin
  const { email, role } = await req.json();
  if (!email || !role) {
    return NextResponse.json({ error: 'Missing email or role' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const result = await db.collection('users').updateOne({ email }, { $set: { role } });
  if (result.modifiedCount === 1) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: 'User not found or role unchanged' }, { status: 404 });
  }
} 