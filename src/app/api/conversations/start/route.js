import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

function getUserFromReq(req) {
  const h = req.headers.get('authorization') || '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : null;
  const cookie = req.headers.get('cookie') || '';
  const tokenCookie = cookie.split(';').find(c => c.trim().startsWith('token='));
  const tok = bearer || (tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : null);
  if (!tok) return null;
  try { return jwt.verify(tok, JWT_SECRET); } catch { return null; }
}

export async function POST(req) {
  try {
    const p = getUserFromReq(req);
    if (!p?.userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    
    const me = String(p.userId);
    const { participantId, message, postId } = await req.json();
    
    if (!participantId) {
      return NextResponse.json({ error: 'معرف المستلم مطلوب' }, { status: 400 });
    }
    
    if (me === participantId) {
      return NextResponse.json({ error: 'لا يمكنك بدء محادثة مع نفسك' }, { status: 400 });
    }
    
    // Check if conversation already exists between these users
    const existingConv = await prisma.$queryRaw`
      SELECT c.id 
      FROM "conversations" c
      JOIN "conversation_participants" cp1 ON cp1.conversation_id = c.id
      JOIN "conversation_participants" cp2 ON cp2.conversation_id = c.id
      WHERE cp1.actor_id = ${me}::uuid 
        AND cp2.actor_id = ${participantId}::uuid
        AND cp1.actor_type = 'user'
        AND cp2.actor_type = 'user'
      LIMIT 1;
    `;
    
    let conversationId;
    
    if (existingConv?.length > 0) {
      // Use existing conversation
      conversationId = existingConv[0].id.toString();
    } else {
      // Create new conversation using raw query to avoid model name issues
      const [conversation] = await prisma.$queryRaw`
        WITH new_conv AS (
          INSERT INTO "conversations" (created_at, updated_at)
          VALUES (NOW(), NOW())
          RETURNING id, created_at, updated_at
        ),
        part1 AS (
          INSERT INTO "conversation_participants" (
            conversation_id, 
            actor_id, 
            actor_type, 
            created_at
          )
          SELECT id, ${me}::uuid, 'user', NOW()
          FROM new_conv
          RETURNING conversation_id
        ),
        part2 AS (
          INSERT INTO "conversation_participants" (
            conversation_id, 
            actor_id, 
            actor_type, 
            created_at
          )
          SELECT id, ${participantId}::uuid, 'user', NOW()
          FROM new_conv
          RETURNING conversation_id
        )
        SELECT id FROM new_conv;
      `;
      
      if (!conversation) {
        throw new Error('فشل إنشاء المحادثة');
      }
      
      conversationId = conversation.id.toString();
    }
    
    // Add initial message using raw query
    if (message) {
      try {
        await prisma.$queryRaw`
          WITH new_msg AS (
            INSERT INTO "messages" (
              conversation_id,
              sender_id,
              sender_type,
              content,
              created_at,
              updated_at,
              is_read
            )
            VALUES (
              ${parseInt(conversationId)},
              ${me}::uuid,
              'user',
              ${message},
              NOW(),
              NOW(),
              false
            )
            RETURNING id, created_at
          )
          UPDATE "conversations"
          SET 
            updated_at = NOW(),
            last_message_at = (SELECT created_at FROM new_msg),
            last_message_id = (SELECT id FROM new_msg)
          WHERE id = ${parseInt(conversationId)};
        `;
      } catch (error) {
        console.error('Error adding message:', error);
        throw new Error('فشل في إرسال الرسالة الأولية');
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      conversationId,
      message: 'تم بدء المحادثة بنجاح'
    });
    
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء بدء المحادثة' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
