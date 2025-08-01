import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  try {
    const { conversationId, projectId, userId } = await request.json();

    if (!conversationId || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, projectId, userId' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    // Check if user is admin
    const user = await db.collection('users').findOne({ email: userId });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Verify the conversation belongs to the project
    let conversation;
    let projectObjectId;
    let conversationObjectId;
    try {
      projectObjectId = new ObjectId(projectId);
      conversationObjectId = new ObjectId(conversationId);
      
      conversation = await db.collection('conversations').findOne({
        _id: conversationObjectId,
        projectId: projectObjectId
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid conversation ID or project ID format' },
        { status: 400 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Delete the conversation
    const deleteResult = await db.collection('conversations').deleteOne({
      _id: conversationObjectId
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    // Also delete any annotations associated with this conversation
    await db.collection('annotations').deleteMany({
      conversationId: conversationId
    });

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 