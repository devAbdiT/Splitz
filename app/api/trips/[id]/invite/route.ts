import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth-server';
import { db } from '@/src/db';
import { trips, tripMembers, invites } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import QRCode from 'qrcode';

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
    // Verify admin role
    const membership = await db
      .select()
      .from(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

    if (membership.length === 0 || membership[0].role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to generate invites' }, { status: 403 });
    }

    // Generate token
    const token = crypto.randomBytes(16).toString('hex');
    
    // Construct the invite URL
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Generate QR code Data URI
    const qrCodeUrl = await QRCode.toDataURL(inviteUrl);

    // Set expiration (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert into DB
    const [newInvite] = await db
      .insert(invites)
      .values({
        tripId,
        token,
        qrCodeUrl,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ inviteUrl, qrCodeUrl: newInvite.qrCodeUrl, expiresAt: newInvite.expiresAt });
  } catch (error) {
    console.error('Error generating invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
