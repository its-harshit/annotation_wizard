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
  // Get all completed annotations for this project
  const annotations = await db.collection('annotations').find({ projectId: projectObjectId, status: 'completed' }).toArray();
  // Get all conversations for this project
  const conversations = await db.collection('conversations').find({ projectId: projectObjectId }).toArray();
  const conversationMap = new Map(conversations.map(c => [c._id.toString(), c]));
  const exportObjects: Array<Record<string, unknown>> = [];
  for (const ann of annotations) {
    const conv = conversationMap.get(ann.conversationId.toString());
    if (!conv) continue;
    // Export full conversation object
    const { _id, projectId: convProjectId, createdAt: convCreatedAt, updatedAt: convUpdatedAt, conversation: convTurns, ...convMeta } = conv;
    exportObjects.push({
      type: 'conversation',
      fullConversationId: conv._id.toString(),
      combinedId: ann._id.toString(),
      conversation: conv.conversation,
      conversationRatings: ann.conversationRatings,
      conversationComment: ann.conversationComment,
      userId: ann.userId,
      projectId: ann.projectId.toString(),
      annotationId: ann._id.toString(),
      createdAt: ann.createdAt,
      updatedAt: ann.updatedAt,
      ...convMeta,
    });
    // Export each turn as a separate object
    if (Array.isArray(conv.conversation)) {
      // Pair user/assistant as in getTurnPairs
      for (let i = 0, turnIdx = 0; i < conv.conversation.length - 1; i += 2, turnIdx++) {
        const userTurn = conv.conversation[i];
        const assistantTurn = conv.conversation[i + 1];
        if (userTurn?.role === 'user' && assistantTurn?.role === 'assistant') {
          exportObjects.push({
            type: 'turn',
            turnIdUser: userTurn.turnId || null,
            turnIdAssistant: assistantTurn.turnId || null,
            fullConversationId: conv._id.toString(),
            combinedId: ann._id.toString(),
            userId: ann.userId,
            projectId: ann.projectId.toString(),
            annotationId: ann._id.toString(),
            turnRatings: ann.turnRatings?.[turnIdx] || {},
            turnComments: ann.turnComments?.[turnIdx] || '',
            turnSkipped: ann.turnSkipped?.[turnIdx] || false,
            userTurn,
            assistantTurn,
            createdAt: ann.createdAt,
            updatedAt: ann.updatedAt,
            ...convMeta,
          });
        }
      }
    }
  }
  return NextResponse.json(exportObjects);
} 