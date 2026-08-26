import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  defaultCurrency: text('default_currency').default('USD'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('Travel').notNull(),
  coverImageUrl: text('cover_image_url'),
  baseCurrency: text('base_currency').default('USD'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tripMembers = pgTable('trip_members', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: text('role').notNull().default('member'), // admin, member
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const invites = pgTable('invites', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  token: text('token').notNull().unique(),
  qrCodeUrl: text('qr_code_url'),
  expiresAt: timestamp('expires_at').notNull(),
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(), // using double precision for money (in cents ideally or decimal, but float for simplicity, actually integer cents is better)
  currency: text('currency').notNull().default('USD'),
  exchangeRate: doublePrecision('exchange_rate').default(1.0),
  date: text('date').notNull(),
  category: text('category'),
  paidById: integer('paid_by_id').references(() => users.id).notNull(),
  splitType: text('split_type').notNull().default('equal'), // equal, custom, percentage
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseSplits = pgTable('expense_splits', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').references(() => expenses.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: doublePrecision('amount').notNull(),
  percentage: doublePrecision('percentage'),
});

export const expenseAudits = pgTable('expense_audits', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').references(() => expenses.id).notNull(),
  changedById: integer('changed_by_id').references(() => users.id).notNull(),
  changeType: text('change_type').notNull(), // create, update, delete
  beforeData: json('before_data'),
  afterData: json('after_data'),
  at: timestamp('at').defaultNow(),
});

export const settlements = pgTable('settlements', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').references(() => trips.id).notNull(),
  fromUserId: integer('from_user_id').references(() => users.id).notNull(),
  toUserId: integer('to_user_id').references(() => users.id).notNull(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('pending'), // pending, settled
  settledAt: timestamp('settled_at'),
  note: text('note'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tripMembers: many(tripMembers),
  expensesPaid: many(expenses),
  expenseSplits: many(expenseSplits),
  settlementsFrom: many(settlements, { relationName: 'settlementsFrom' }),
  settlementsTo: many(settlements, { relationName: 'settlementsTo' }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  expenses: many(expenses),
  settlements: many(settlements),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripMembers.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
  paidBy: one(users, {
    fields: [expenses.paidById],
    references: [users.id],
  }),
  splits: many(expenseSplits),
  audits: many(expenseAudits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.userId],
    references: [users.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  trip: one(trips, {
    fields: [settlements.tripId],
    references: [trips.id],
  }),
  fromUser: one(users, {
    fields: [settlements.fromUserId],
    references: [users.id],
    relationName: 'settlementsFrom'
  }),
  toUser: one(users, {
    fields: [settlements.toUserId],
    references: [users.id],
    relationName: 'settlementsTo'
  }),
}));
