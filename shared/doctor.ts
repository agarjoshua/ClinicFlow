import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  name: varchar("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;
