import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { expenses, tripMembers, users, expenseSplits } from '@/src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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
    // Verify membership
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch expenses with paidBy user info
    const tripExpenses = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        currency: expenses.currency,
        date: expenses.date,
        category: expenses.category,
        splitType: expenses.splitType,
        createdAt: expenses.createdAt,
        paidBy: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.tripId, tripId))
      .orderBy(desc(expenses.createdAt));

    return NextResponse.json({ expenses: tripExpenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const { description, amount, date, category, paidById, splitType } = body;

    if (!description || !amount || !date || !paidById) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newExpense = await db.transaction(async (tx) => {
      // 1. Create the expense
      const [insertedExpense] = await tx
        .insert(expenses)
        .values({
          tripId,
          description,
          amount: parseFloat(amount),
          date,
          category: category || 'General',
          paidById: parseInt(paidById, 10),
          splitType: splitType || 'equal',
        })
        .returning();

      // 2. We can automatically create splits here if we want to build the "Settle Up" logic
      // For now, let's keep it simple and just do 'equal' split logic by fetching all members
      if (insertedExpense.splitType === 'equal') {
         const allMembers = await tx
           .select({ userId: tripMembers.userId })
           .from(tripMembers)
           .where(eq(tripMembers.tripId, tripId));

         if (allMembers.length > 0) {
           const splitAmount = insertedExpense.amount / allMembers.length;
           const splitsToInsert = allMembers.map(m => ({
             expenseId: insertedExpense.id,
             userId: m.userId,
             amount: splitAmount
           }));
           await tx.insert(expenseSplits).values(splitsToInsert);
         }
      }

      return insertedExpense;
    });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
