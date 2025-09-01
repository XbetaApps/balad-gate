/* ============================================================
   GET  /api/support/threads
   POST /api/support/threads
   ============================================================ */

   export const runtime = 'nodejs';
   export const dynamic = 'force-dynamic';
   
   import { NextResponse } from 'next/server';
   import { PrismaClient } from '@prisma/client';
   
   /* ---------- Prisma ---------- */
   const prisma = (() => {
     // Create a new Prisma client instance
     const client = new PrismaClient({
       log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
       datasources: {
         db: {
           url: process.env.DATABASE_URL
         }
       }
     });
     
     // Test connection on first use
     let isConnected = false;
     
     // Return a proxy to handle connection testing
     return new Proxy(client, {
       get(target, prop) {
         // Skip connection test for $connect and $disconnect
         if (['$connect', '$disconnect', '$on'].includes(prop)) {
           return target[prop].bind(target);
         }
         
         // Test connection if not already connected
         if (!isConnected) {
           return async function(...args) {
             try {
               await target.$connect();
               isConnected = true;
               console.log('Prisma client connected successfully');
               return target[prop](...args);
             } catch (error) {
               console.error('Prisma connection error:', error);
               throw new Error('Database connection failed');
             }
           };
         }
         
         // Return the method bound to the target
         const value = target[prop];
         return typeof value === 'function' ? value.bind(target) : value;
       }
     });
   })();
   
   // Clean up on process exit
   process.on('beforeExit', async () => {
     try {
       await prisma.$disconnect();
       console.log('Prisma client disconnected');
     } catch (error) {
       console.error('Error disconnecting Prisma client:', error);
     }
   });
   
   /* ---------- الجلسة ---------- */
   async function getSession(req) {
     try {
       const base = new URL(req.url).origin;
       const res  = await fetch(`${base}/api/test-session`, {
         headers: {
           cookie: req.headers.get('cookie') ?? '',
           authorization: req.headers.get('authorization') ?? '',
           accept: 'application/json',
         },
         cache: 'no-store',
       });
       if (!res.ok) return null;
       return res.json().catch(() => null);
     } catch (err) {
       console.error('getSession error:', err);
       return null;
     }
   }
   
   /* ============================================================
      GET: لائحة المحادثات
      ============================================================ */
   export async function GET(req) {
     try {
       const session = await getSession(req);
       if (!session?.authenticated)
         return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
   
       const userId   = session.rawPayload?.userId ?? session.user?.id;
       const userRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
       const url = new URL(req.url);
       const targetUserId = url.searchParams.get('userId');
   
       /* ـــ الإدمن يبحث عن محادثات مستخدم معين ـــ */
       if (userRole === 4 && targetUserId) {
         const threads = await prisma.$queryRaw`
           SELECT
             t.id::text,
             t.last_message_at,
             COALESCE(m.content, '') AS last_message,
             'user' AS participant_type,
             u.name AS participant_name
           FROM support_threads t
           JOIN users u ON u.id = t.user_id
           LEFT JOIN support_messages m ON m.id = t.last_message_id
           WHERE t.user_id::text = ${targetUserId}::text
           ORDER BY t.last_message_at DESC
           LIMIT 1
         `;
         return NextResponse.json(threads, { status: 200 });
       }
       
       /* ـــ الإدمن يرى كل المحادثات ـــ */
       if (userRole === 4) {
         const rows = await prisma.$queryRaw`
           SELECT
             t.id::text,
             t.last_message_at,
             COALESCE(m.content, '') AS last_message,
             'user' AS participant_type,
             u.name AS participant_name
           FROM support_threads t
           JOIN users u ON u.id = t.user_id
           LEFT JOIN support_messages m ON m.id = t.last_message_id
           ORDER BY t.last_message_at DESC NULLS LAST
         `;
         return NextResponse.json(rows, { status: 200 });
       }
   
       /* ـــ المستخدم يرى ثريده الوحيد ـــ */
       let [thread] = await prisma.$queryRaw`
         SELECT *
         FROM support_threads
         WHERE user_id::text = ${userId}::text          -- التحويل إلى نص
         LIMIT 1
       `;
   
       if (!thread) {
         [thread] = await prisma.$queryRaw`
           INSERT INTO support_threads (user_id, status, created_at, updated_at)
           VALUES (${userId}::bigint, 'open', NOW(), NOW())  -- النوع الصحيح
           RETURNING *
         `;
       }
   
       const [lastMsg] = await prisma.$queryRaw`
         SELECT content
         FROM support_messages
         WHERE thread_id = ${thread.id}::bigint
         ORDER BY created_at DESC
         LIMIT 1
       `;
   
       return NextResponse.json(
         [
           {
             id:               String(thread.id),
             last_message_at:  thread.last_message_at,
             last_message:     lastMsg?.content ?? '',
             participant_type: 'admin',
             participant_name: 'الدعم',
           },
         ],
         { status: 200 },
       );
     } catch (err) {
       console.error('GET /threads error:', err);
       return NextResponse.json({ error: 'خطأ أثناء الجلب' }, { status: 500 });
     }
   }
   
   /* ============================================================
     POST: Create or get a support thread
     ============================================================ */
  export async function POST(req) {
    console.log('=== Starting POST /api/support/threads ===');
    
    // Verify Prisma client
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Move variables to function scope
    let callerId, callerRole, targetUserId, firstMessage, isAdmin, body;
    
    try {
      // Get session and validate
      const session = await getSession(req);
      if (!session?.authenticated) {
        console.error('Unauthorized request - no valid session');
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      // Get request data
      try {
        body = await req.json();
      } catch (error) {
        console.error('Error parsing request body:', error);
        return NextResponse.json(
          { error: 'Invalid request body' }, 
          { status: 400 }
        );
      }

      callerId = session.rawPayload?.userId ?? session.user?.id;
      callerRole = Number(session.rawPayload?.role_id ?? session.user?.role_id);
      targetUserId = body.targetUserId || callerId;
      firstMessage = body.firstMessage || 'مرحباً، كيف يمكنني مساعدتك اليوم؟';
      isAdmin = callerRole === 4;

      // Log request details
      console.log('Request details:', {
        callerId,
        callerRole,
        targetUserId,
        isAdmin,
        hasFirstMessage: !!firstMessage,
        requestBody: body
      });
      
      // Validate input
      if (!callerId) {
        throw new Error('Missing callerId in session');
      }
      if (!targetUserId) {
        throw new Error('Missing targetUserId');
      }
      if (!firstMessage) {
        throw new Error('Missing firstMessage');
      }

      // Start transaction with error handling
      try {
        // Test database connection first
        try {
          await prisma.$queryRaw`SELECT 1`;
          console.log('Database connection test successful');
        } catch (dbError) {
          console.error('Database connection test failed:', dbError);
          throw new Error('Database connection failed: ' + dbError.message);
        }
        
        const result = await prisma.$transaction(async (tx) => {
          console.log('=== Starting transaction ===');
          console.log('Session user ID:', callerId);
          console.log('Target user ID:', targetUserId);
          console.log('Is admin:', isAdmin);
          
          // Add error handler for transaction
          process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Rejection in transaction:', reason);
          });
          
          console.log('Checking database connection...');
          await tx.$queryRaw`SELECT 1`; // Test connection
          console.log('Database connection OK');
          
          // 1. Check if user exists
          console.log('Checking if user exists:', targetUserId);
          const user = await tx.user.findUnique({
            where: { id: targetUserId },
            select: { id: true }
          });
          
          console.log('User lookup result:', user);
          
          if (!user) {
            console.error('User not found:', targetUserId);
            throw new Error('User not found');
          }
          
          // 2. Check for existing thread for this user
          console.log('Checking for existing thread for user:', targetUserId);
          const existingThread = await tx.support_threads.findFirst({
            where: {
              user_id: targetUserId,
              status: 'open'
            },
            orderBy: { created_at: 'desc' },
            select: { id: true }
          });
          
          if (existingThread) {
            console.log('Found existing thread:', existingThread.id);
            return { 
              id: existingThread.id,
              message: 'Using existing thread' 
            };
          }

          // 3. No existing thread, create a new one
          console.log('Creating new thread...');
          const now = new Date();
          
          // Create the thread first
          const thread = await tx.support_threads.create({
            data: {
              user_id: targetUserId,
              assigned_admin_id: isAdmin ? callerId : null,
              status: 'open',
              created_at: now,
              updated_at: now,
              // Initialize with null last message, we'll update it after creating the message
              last_message_id: null,
              last_message_at: null
            }
          });
          
          console.log('Thread created:', thread.id);
          
          console.log('Creating message with data:', {
            thread_id: thread.id,
            sender_id: isAdmin ? session.user.id : targetUserId,
            sender_type: isAdmin ? 'admin' : 'user',
            content: firstMessage,
            is_read_by_user: isAdmin,
            is_read_by_admin: !isAdmin,
            created_at: now
          });
          
          // Create the message using raw SQL to avoid Prisma field name mapping issues
          const [message] = await tx.$queryRaw`
            INSERT INTO support_messages (
              thread_id, 
              sender_id, 
              sender_type, 
              content, 
              is_read_by_user, 
              is_read_by_admin, 
              created_at
            ) VALUES (
              ${thread.id}::bigint,
              ${isAdmin ? session.user.id : targetUserId}::uuid,
              ${isAdmin ? 'admin' : 'user'}::support_sender_type,
              ${firstMessage},
              ${isAdmin},
              ${!isAdmin},
              ${now}
            )
            RETURNING *
          `;
          
          console.log('Message created successfully:', message);
          
          // Update thread with last message info
          console.log('Updating thread with last message:', message.id);
          await tx.$executeRaw`
            UPDATE support_threads
            SET 
              last_message_id = ${message.id}::bigint,
              last_message_at = ${now},
              updated_at = ${now}
            WHERE id = ${thread.id}::bigint
          `;
          
          // Fetch the complete thread with relations for response
          const fullThread = await tx.$queryRaw`
            SELECT 
              st.*,
              COALESCE(
                (
                  SELECT json_agg(msg_obj) 
                  FROM (
                    SELECT DISTINCT ON (sm.id) jsonb_build_object(
                      'id', sm.id,
                      'content', sm.content,
                      'created_at', sm.created_at,
                      'sender_type', sm.sender_type,
                      'user', jsonb_build_object(
                        'id', u.id,
                        'name', u.name
                      )
                    ) as msg_obj
                    FROM support_messages sm
                    LEFT JOIN users u ON u.id = sm.sender_id
                    WHERE sm.thread_id = st.id
                    ORDER BY sm.id, sm.created_at
                  ) distinct_msgs
                ),
                '[]'::json
              ) as messages,
              json_build_object(
                'id', u1.id,
                'name', u1.name
              ) as user,
              json_build_object(
                'id', u2.id,
                'name', u2.name
              ) as assigned_admin
            FROM support_threads st
            LEFT JOIN support_messages sm ON sm.thread_id = st.id
            LEFT JOIN users u ON u.id = sm.sender_id
            LEFT JOIN users u1 ON u1.id = st.user_id
            LEFT JOIN users u2 ON u2.id = st.assigned_admin_id
            WHERE st.id = ${thread.id}::bigint
            GROUP BY st.id, u1.id, u2.id
          `;
          
          if (!fullThread || fullThread.length === 0) {
            console.error('Thread not found after creation:', thread.id);
            throw new Error('Failed to retrieve created thread');
          }
          
          const result = fullThread[0];
          console.log('Thread created successfully:', result);
          return result;
        }); // End of transaction

        // Return the result from the transaction
        return NextResponse.json(result);
      } catch (error) {
        console.error('Error in transaction:', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        throw error; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error in POST /api/support/threads:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        ...(error.meta && { meta: error.meta })
      });

      const errorResponse = {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'حدث خطأ في الخادم',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            name: error.name,
            code: error.code,
            stack: error.stack,
            ...(error.meta && { meta: error.meta })
          }
        })
      };

      return NextResponse.json(errorResponse, { 
        status: 500 
      });
    }
  }