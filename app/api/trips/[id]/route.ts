import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { trips, tripMembers } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify membership and fetch trip
    const tripData = await db
      .select({
        trip: trips,
        role: tripMembers.role,
      })
      .from(trips)
      .innerJoin(tripMembers, eq(trips.id, tripMembers.tripId))
      .where(and(eq(trips.id, tripId), eq(tripMembers.userId, user.id)));

    if (tripData.length === 0) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ trip: tripData[0].trip, role: tripData[0].role });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify admin role
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to edit trip' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    const [updatedTrip] = await db
      .update(trips)
      .set({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      })
      .where(eq(trips.id, tripId))
      .returning();

    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify admin role
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to archive trip' }, { status: 403 });
    }

    // Archive trip (soft delete)
    await db
      .update(trips)
      .set({ archivedAt: new Date() })
      .where(eq(trips.id, tripId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
