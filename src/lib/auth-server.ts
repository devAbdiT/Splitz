import { NextRequest } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const dbUsers = await db.select().from(users).where(eq(users.uid, decoded.uid));
    if (dbUsers.length > 0) return dbUsers[0];
    return null;
  } catch (e) {
    console.error('Error verifying auth token:', e);
    return null;
  }
}
