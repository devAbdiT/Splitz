import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user exists
    const existingUsers = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    
    if (existingUsers.length === 0) {
      // Create user in postgres
      await db.insert(users).values({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        avatarUrl: decodedToken.picture || '',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
