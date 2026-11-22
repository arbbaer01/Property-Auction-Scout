import { pgTable, serial, integer, boolean, timestamp, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitoringSessionsTable = pgTable("monitoring_sessions", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  active: boolean("active").notNull().default(true),
  currentBid: numeric("current_bid", { precision: 15, scale: 2 }),
  bidCount: integer("bid_count").default(0),
  outbid: boolean("outbid").default(false),
  reserveMet: boolean("reserve_met").default(false),
  timeRemainingSeconds: integer("time_remaining_seconds"),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
});

export const bidEventsTable = pgTable("bid_events", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  bidder: text("bidder"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMonitoringSessionSchema = createInsertSchema(monitoringSessionsTable).omit({ id: true });
export type InsertMonitoringSession = z.infer<typeof insertMonitoringSessionSchema>;
export type MonitoringSession = typeof monitoringSessionsTable.$inferSelect;

export const insertBidEventSchema = createInsertSchema(bidEventsTable).omit({ id: true });
export type InsertBidEvent = z.infer<typeof insertBidEventSchema>;
export type BidEvent = typeof bidEventsTable.$inferSelect;
