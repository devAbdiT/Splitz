import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { settlements, tripMembers } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify membership
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { fromUserId, toUserId, amount } = body;

    if (!fromUserId || !toUserId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [insertedSettlement] = await db
      .insert(settlements)
      .values({
        tripId,
        fromUserId: parseInt(fromUserId, 10),
        toUserId: parseInt(toUserId, 10),
        amount: parseFloat(amount),
        status: 'settled',
        settledAt: new Date(),
      })
      .returning();

    return NextResponse.json({ settlement: insertedSettlement }, { status: 201 });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
