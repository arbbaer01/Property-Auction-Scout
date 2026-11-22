import { pgTable, serial, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  title: text("title").notNull(),
  description: text("description"),
  state: text("state").notNull(),
  county: text("county").notNull(),
  parcelNumber: text("parcel_number"),
  address: text("address"),
  propertyType: text("property_type").notNull().default("unknown"), // land | improved | unknown
  auctionType: text("auction_type").notNull().default("pre_auction"), // pre_auction | live | ended
  startingBid: numeric("starting_bid", { precision: 15, scale: 2 }).notNull().default("0"),
  currentBid: numeric("current_bid", { precision: 15, scale: 2 }).notNull().default("0"),
  reserveAmount: numeric("reserve_amount", { precision: 15, scale: 2 }),
  hasReserve: boolean("has_reserve").notNull().default(false),
  reserveMet: boolean("reserve_met"),
  auctionStartAt: timestamp("auction_start_at", { withTimezone: true }),
  auctionEndAt: timestamp("auction_end_at", { withTimezone: true }),
  daysLeft: integer("days_left"),
  hoursLeft: integer("hours_left"),
  bidCount: integer("bid_count").default(0),
  detailUrl: text("detail_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAuctionSchema = createInsertSchema(auctionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctionsTable.$inferSelect;
