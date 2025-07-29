import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  // (Optional) Add admin check here if you have access to session/token
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const users = await db.collection('users').find({}, { projection: { email: 1, role: 1 } }).toArray();
  return NextResponse.json(users);
} 