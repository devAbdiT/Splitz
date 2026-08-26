import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { expenses, expenseSplits, tripMembers, users, settlements } from '@/src/db/schema';
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
    // Verify membership
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Get all members in the trip to ensure we include those with 0 balance
    const members = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId));

    // Initialize balances
    const balanceMap: Record<number, { user: any; netBalance: number; totalPaid: number; totalOwed: number }> = {};
    for (const m of members) {
      balanceMap[m.id] = { user: m, netBalance: 0, totalPaid: 0, totalOwed: 0 };
    }

    // 2. Fetch all expenses
    const tripExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.tripId, tripId));

    // 3. Fetch all splits
    // We only want splits for expenses that belong to this trip
    // Easiest is to join expenseSplits with expenses
    const tripSplits = await db
      .select({ userId: expenseSplits.userId, amount: expenseSplits.amount })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(eq(expenses.tripId, tripId));

    // 4. Fetch all settled settlements
    const tripSettlements = await db
      .select()
      .from(settlements)
      .where(and(eq(settlements.tripId, tripId), eq(settlements.status, 'settled')));

    // Calculate Paid
    for (const ex of tripExpenses) {
      if (balanceMap[ex.paidById]) {
        balanceMap[ex.paidById].totalPaid += ex.amount;
        balanceMap[ex.paidById].netBalance += ex.amount;
      }
    }

    // Calculate Owed
    for (const split of tripSplits) {
      if (balanceMap[split.userId]) {
        balanceMap[split.userId].totalOwed += split.amount;
        balanceMap[split.userId].netBalance -= split.amount;
      }
    }

    // Adjust for Settlements
    for (const st of tripSettlements) {
      if (balanceMap[st.fromUserId]) {
        balanceMap[st.fromUserId].netBalance += st.amount; // From user paid a debt, their net balance increases (less negative)
      }
      if (balanceMap[st.toUserId]) {
        balanceMap[st.toUserId].netBalance -= st.amount; // To user received debt payment, their net balance decreases
      }
    }

    // Prepare Debt matching (simplification algorithm)
    const debtors: { id: number; amount: number }[] = [];
    const creditors: { id: number; amount: number }[] = [];

    Object.values(balanceMap).forEach(b => {
      // Fix floating point errors (e.g. 0.000000001)
      const roundedBalance = Math.round(b.netBalance * 100) / 100;
      b.netBalance = roundedBalance;
      
      if (roundedBalance < 0) {
        debtors.push({ id: b.user.id, amount: Math.abs(roundedBalance) });
      } else if (roundedBalance > 0) {
        creditors.push({ id: b.user.id, amount: roundedBalance });
      }
    });

    // Sort by largest amount first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const proposedSettlements = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.amount, creditor.amount);

      proposedSettlements.push({
        fromUser: balanceMap[debtor.id].user,
        toUser: balanceMap[creditor.id].user,
        amount: Math.round(amount * 100) / 100
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return NextResponse.json({
      balances: Object.values(balanceMap),
      proposedSettlements
    });

  } catch (error) {
    console.error('Error fetching balances:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
