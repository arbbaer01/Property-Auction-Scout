import { pgTable, serial, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const excessProceedsTable = pgTable("excess_proceeds", {
  id: serial("id").primaryKey(),
  parcelNumber: text("parcel_number").notNull(),
  state: text("state").notNull(),
  county: text("county").notNull(),
  ownerName: text("owner_name"),
  propertyAddress: text("property_address"),
  salePrice: numeric("sale_price", { precision: 15, scale: 2 }).notNull(),
  taxBillAmount: numeric("tax_bill_amount", { precision: 15, scale: 2 }).notNull(),
  excessAmount: numeric("excess_amount", { precision: 15, scale: 2 }).notNull(),
  auctionDate: text("auction_date"), // YYYY-MM-DD
  claimDeadline: text("claim_deadline"), // YYYY-MM-DD
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  promotedToCrm: boolean("promoted_to_crm").notNull().default(false),
  promotedAt: timestamp("promoted_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExcessProceedsSchema = createInsertSchema(excessProceedsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExcessProceeds = z.infer<typeof insertExcessProceedsSchema>;
export type ExcessProceeds = typeof excessProceedsTable.$inferSelect;
