import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }
  const hashed = await hash(password, 10);
  await db.collection('users').insertOne({ email, password: hashed, role: 'annotator' });
  return NextResponse.json({ ok: true });
} 