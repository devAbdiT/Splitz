import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { trips, tripMembers, invites } from '@/src/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const inviteData = await db
      .select({
        tripName: trips.name,
        tripDescription: trips.description,
        tripId: trips.id,
      })
      .from(invites)
      .innerJoin(trips, eq(invites.tripId, trips.id))
      .where(and(eq(invites.token, token), gt(invites.expiresAt, new Date())));

    if (inviteData.length === 0) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ trip: inviteData[0] });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const inviteData = await db
      .select()
      .from(invites)
      .where(and(eq(invites.token, token), gt(invites.expiresAt, new Date())));

    if (inviteData.length === 0) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    const tripId = inviteData[0].tripId;

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (existingMember.length === 0) {
      // Add user as a member
      await db.insert(tripMembers).values({
        tripId,
        userId: user.id,
        role: 'member',
      });
    }

    return NextResponse.json({ success: true, tripId });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
