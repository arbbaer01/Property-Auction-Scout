import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const spreadsheetsTable = pgTable("spreadsheets", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // pre_auction | post_auction
  state: text("state").notNull(),
  county: text("county").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  sourceUrl: text("source_url"),
  localPath: text("local_path"),
  status: text("status").notNull().default("pending"), // pending | downloading | imported | failed
  propertyCount: integer("property_count"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSpreadsheetSchema = createInsertSchema(spreadsheetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSpreadsheet = z.infer<typeof insertSpreadsheetSchema>;
export type Spreadsheet = typeof spreadsheetsTable.$inferSelect;
