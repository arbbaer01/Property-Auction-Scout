import { pgTable, serial, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priorOwnerLeadsTable = pgTable("prior_owner_leads", {
  id: serial("id").primaryKey(),
  excessProceedsId: integer("excess_proceeds_id"),
  parcelNumber: text("parcel_number").notNull(),
  state: text("state").notNull(),
  county: text("county").notNull(),
  priorOwnerName: text("prior_owner_name"),
  propertyAddress: text("property_address"),
  excessAmount: numeric("excess_amount", { precision: 15, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 15, scale: 2 }),
  auctionDate: text("auction_date"), // YYYY-MM-DD
  claimDeadline: text("claim_deadline"), // YYYY-MM-DD
  daysRemaining: integer("days_remaining"),
  escheatmentUrgency: text("escheatment_urgency").notNull().default("normal"), // critical | urgent | normal | expired

  // CRM Pipeline & Skip-Tracing Details
  leadStatus: text("lead_status").notNull().default("new_lead"), 
  // new_lead | skip_traced | outreach_sent | under_contract | claim_filed | paid | dead_lead

  skipTraceStatus: text("skip_trace_status").notNull().default("unsearched"), 
  // unsearched | in_progress | located | deceased | heirs_found | not_found

  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  mailingAddress: text("mailing_address"),
  heirInformation: text("heir_information"),
  skipTraceNotes: text("skip_trace_notes"),

  // Recovery Claim Management
  claimFilingDate: text("claim_filing_date"),
  claimReferenceNumber: text("claim_reference_number"),
  feePercentage: numeric("fee_percentage", { precision: 5, scale: 2 }).default("25.00"), // e.g. 25% contingency fee
  estimatedRecoveryFee: numeric("estimated_recovery_fee", { precision: 15, scale: 2 }),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPriorOwnerLeadSchema = createInsertSchema(priorOwnerLeadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPriorOwnerLead = z.infer<typeof insertPriorOwnerLeadSchema>;
export type PriorOwnerLead = typeof priorOwnerLeadsTable.$inferSelect;
