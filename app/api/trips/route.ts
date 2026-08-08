import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { trips, tripMembers } from '@/src/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userTrips = await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        coverImageUrl: trips.coverImageUrl,
        baseCurrency: trips.baseCurrency,
        createdAt: trips.createdAt,
        role: tripMembers.role,
      })
      .from(trips)
      .innerJoin(tripMembers, eq(trips.id, tripMembers.tripId))
      .where(
        and(
          eq(tripMembers.userId, user.id),
          isNull(trips.archivedAt)
        )
      )
      .orderBy(desc(trips.createdAt));

    return NextResponse.json({ trips: userTrips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, description, baseCurrency } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Insert trip and trip_member in a transaction
    const newTrip = await db.transaction(async (tx) => {
      const [insertedTrip] = await tx
        .insert(trips)
        .values({
          name,
          description: description || null,
          baseCurrency: baseCurrency || 'USD',
        })
        .returning();

      await tx.insert(tripMembers).values({
        tripId: insertedTrip.id,
        userId: user.id,
        role: 'admin', // Creator is admin
      });

      return insertedTrip;
    });

    return NextResponse.json({ trip: newTrip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
