import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';


export async function GET(req: Request) {
  const url = new URL(req.url!);
  const userId = url.searchParams.get('userId');
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  const projects = await db.collection('projects').find().toArray();
  const users = await db.collection('users').find().toArray();

  // If userId is provided, return progress for that user (existing behavior)
  if (userId) {
    const progress = [];
    for (const project of projects) {
      const projectObjectId = project._id;
      const totalConversations = await db.collection('conversations').countDocuments({ projectId: projectObjectId });
      const annotatedCount = await db.collection('annotations').countDocuments({ userId: userId, projectId: projectObjectId });
      progress.push({
        projectId: projectObjectId,
        name: project.name,
        totalConversations,
        annotatedCount,
      });
    }
    return NextResponse.json(progress);
  }

  // If no userId, return progress for all users in all projects
  const allProgress: Array<Record<string, unknown>> = [];
  for (const user of users) {
    for (const project of projects) {
      if (!project.members?.includes(user.email)) continue;
      const projectObjectId = project._id;
      const totalConversations = await db.collection('conversations').countDocuments({ projectId: projectObjectId });
      const annotatedCount = await db.collection('annotations').countDocuments({ userId: user.email, projectId: projectObjectId });
      allProgress.push({
        userId: user.email,
        projectId: projectObjectId,
        projectName: project.name,
        totalConversations,
        annotatedCount,
      });
    }
  }
  return NextResponse.json(allProgress);
} 