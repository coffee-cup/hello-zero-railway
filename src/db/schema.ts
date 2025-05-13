import { relations } from "drizzle-orm";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  partner: boolean().notNull(),
});

export const mediums = pgTable("medium", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
});

export const messages = pgTable("message", {
  id: varchar().primaryKey(),
  senderId: varchar().references(() => users.id),
  mediumId: varchar().references(() => mediums.id),
  body: varchar().notNull(),
  timestamp: timestamp().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),

  medium: one(mediums, {
    fields: [messages.mediumId],
    references: [mediums.id],
  }),
}));
