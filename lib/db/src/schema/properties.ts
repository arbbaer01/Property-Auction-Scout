import { pgTable, serial, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelNumber: text("parcel_number").notNull(),
  state: text("state").notNull(),
  county: text("county").notNull(),
  ownerName: text("owner_name"),
  propertyAddress: text("property_address"),
  propertyDescription: text("property_description"),
  taxBillAmount: numeric("tax_bill_amount", { precision: 15, scale: 2 }),
  minimumBid: numeric("minimum_bid", { precision: 15, scale: 2 }),
  salePrice: numeric("sale_price", { precision: 15, scale: 2 }),
  excessProceeds: numeric("excess_proceeds", { precision: 15, scale: 2 }),
  auctionDate: text("auction_date"), // YYYY-MM-DD
  spreadsheetType: text("spreadsheet_type").notNull(), // pre_auction | post_auction
  spreadsheetId: integer("spreadsheet_id"),
  claimDeadline: text("claim_deadline"), // YYYY-MM-DD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
