import { Router } from "express";
import { db, excessProceedsTable, priorOwnerLeadsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, desc, count, sql } from "drizzle-orm";

const router = Router();

// Calculate statutory escheatment deadline if not provided
function calculateEscheatmentDeadline(auctionDateStr: string | null | undefined, state: string): { deadline: string; daysRemaining: number; urgency: string } {
  const baseDate = auctionDateStr ? new Date(auctionDateStr) : new Date();
  
  // Statutory periods by state: CA: 1 yr (365d), FL: 2 yrs (730d), WA: 3 yrs (1095d), TX: 2 yrs (730d), default: 2 yrs
  let years = 2;
  const upperState = (state || "").toUpperCase();
  if (upperState === "CA") years = 1;
  else if (upperState === "WA") years = 3;
  else if (upperState === "NV" || upperState === "AZ" || upperState === "FL" || upperState === "TX") years = 2;

  const deadlineDate = new Date(baseDate.getTime());
  deadlineDate.setFullYear(deadlineDate.getFullYear() + years);
  
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let urgency = "normal";
  if (daysRemaining <= 0) {
    urgency = "expired";
  } else if (daysRemaining <= 90) {
    urgency = "critical";
  } else if (daysRemaining <= 180) {
    urgency = "urgent";
  }

  const deadline = deadlineDate.toISOString().split("T")[0];
  return { deadline, daysRemaining, urgency };
}

// CHECKPOINT: Promote / Isolate Excess Proceeds record into CRM Leads Database
router.post("/excess-proceeds/:id/promote", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record ID" });
    return;
  }

  const [record] = await db.select().from(excessProceedsTable).where(eq(excessProceedsTable.id, id));
  if (!record) {
    res.status(404).json({ error: "Excess proceeds record not found" });
    return;
  }

  // Calculate escheatment timing
  const { deadline, daysRemaining, urgency } = calculateEscheatmentDeadline(
    record.auctionDate,
    record.state
  );

  const finalDeadline = record.claimDeadline || deadline;
  const excessNum = parseFloat(record.excessAmount || "0");
  const feePct = 25.0; // Standard 25% contingency fee
  const estFee = (excessNum * (feePct / 100)).toFixed(2);

  // Insert into Database 2: Prior Owner Recovery CRM
  const [lead] = await db.insert(priorOwnerLeadsTable).values({
    excessProceedsId: record.id,
    parcelNumber: record.parcelNumber,
    state: record.state,
    county: record.county,
    priorOwnerName: record.ownerName || "Unknown Prior Owner",
    propertyAddress: record.propertyAddress || "",
    excessAmount: record.excessAmount,
    salePrice: record.salePrice,
    auctionDate: record.auctionDate,
    claimDeadline: finalDeadline,
    daysRemaining,
    escheatmentUrgency: urgency,
    leadStatus: "new_lead",
    skipTraceStatus: "unsearched",
    feePercentage: feePct.toFixed(2),
    estimatedRecoveryFee: estFee,
    notes: `Promoted from Staging Checkpoint. Net surplus: $${record.excessAmount}`,
  }).returning();

  // Mark staging record as promoted
  await db.update(excessProceedsTable)
    .set({ promotedToCrm: true, promotedAt: new Date() })
    .where(eq(excessProceedsTable.id, id));

  res.status(201).json({
    message: "Checkpoint passed: Property isolated into Recovery CRM",
    lead: {
      ...lead,
      excessAmount: parseFloat(lead.excessAmount ?? "0"),
      salePrice: parseFloat(lead.salePrice ?? "0"),
      estimatedRecoveryFee: parseFloat(lead.estimatedRecoveryFee ?? "0"),
      feePercentage: parseFloat(lead.feePercentage ?? "25"),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt?.toISOString() ?? null,
    }
  });
});

// GET CRM Leads with pipeline metrics and filtering
router.get("/crm/leads", async (req, res): Promise<void> => {
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 50);
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const status = req.query.status as string;
  const state = req.query.state as string;
  const county = req.query.county as string;
  const search = req.query.search as string;
  const minAmount = req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(priorOwnerLeadsTable.leadStatus, status));
  if (state && state !== "all") conditions.push(eq(priorOwnerLeadsTable.state, state));
  if (county) conditions.push(ilike(priorOwnerLeadsTable.county, `%${county}%`));
  if (minAmount !== undefined) conditions.push(gte(priorOwnerLeadsTable.excessAmount, String(minAmount)));
  if (search) {
    conditions.push(sql`(${priorOwnerLeadsTable.parcelNumber} ILIKE ${`%${search}%`} OR ${priorOwnerLeadsTable.priorOwnerName} ILIKE ${`%${search}%`} OR ${priorOwnerLeadsTable.propertyAddress} ILIKE ${`%${search}%`})`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [leads, [{ total }], allLeads] = await Promise.all([
    db.select().from(priorOwnerLeadsTable).where(where).orderBy(desc(priorOwnerLeadsTable.excessAmount)).limit(limit).offset(offset),
    db.select({ total: count() }).from(priorOwnerLeadsTable).where(where),
    db.select({
      leadStatus: priorOwnerLeadsTable.leadStatus,
      excessAmount: priorOwnerLeadsTable.excessAmount,
      estimatedRecoveryFee: priorOwnerLeadsTable.estimatedRecoveryFee,
      escheatmentUrgency: priorOwnerLeadsTable.escheatmentUrgency,
    }).from(priorOwnerLeadsTable),
  ]);

  let totalPipelineValue = 0;
  let totalPotentialFees = 0;
  let urgentCount = 0;
  const byStatus: Record<string, number> = {};

  for (const l of allLeads) {
    const val = parseFloat(l.excessAmount ?? "0");
    const fee = parseFloat(l.estimatedRecoveryFee ?? "0");
    totalPipelineValue += val;
    totalPotentialFees += fee;
    if (l.escheatmentUrgency === "critical" || l.escheatmentUrgency === "urgent") {
      urgentCount++;
    }
    byStatus[l.leadStatus] = (byStatus[l.leadStatus] ?? 0) + 1;
  }

  res.json({
    leads: leads.map(l => ({
      ...l,
      excessAmount: parseFloat(l.excessAmount ?? "0"),
      salePrice: parseFloat(l.salePrice ?? "0"),
      estimatedRecoveryFee: parseFloat(l.estimatedRecoveryFee ?? "0"),
      feePercentage: parseFloat(l.feePercentage ?? "25"),
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt?.toISOString() ?? null,
    })),
    total,
    limit,
    offset,
    summary: {
      totalLeads: allLeads.length,
      totalPipelineValue,
      totalPotentialFees,
      urgentCount,
      byStatus,
    }
  });
});

// GET single CRM lead
router.get("/crm/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [lead] = await db.select().from(priorOwnerLeadsTable).where(eq(priorOwnerLeadsTable.id, id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json({
    ...lead,
    excessAmount: parseFloat(lead.excessAmount ?? "0"),
    salePrice: parseFloat(lead.salePrice ?? "0"),
    estimatedRecoveryFee: parseFloat(lead.estimatedRecoveryFee ?? "0"),
    feePercentage: parseFloat(lead.feePercentage ?? "25"),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt?.toISOString() ?? null,
  });
});

// PATCH update CRM lead (Skip-trace notes, contact info, pipeline status)
router.patch("/crm/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const b = req.body;
  const updateData: Record<string, unknown> = {};

  if (b.priorOwnerName !== undefined) updateData.priorOwnerName = b.priorOwnerName;
  if (b.leadStatus !== undefined) updateData.leadStatus = b.leadStatus;
  if (b.skipTraceStatus !== undefined) updateData.skipTraceStatus = b.skipTraceStatus;
  if (b.contactPhone !== undefined) updateData.contactPhone = b.contactPhone;
  if (b.contactEmail !== undefined) updateData.contactEmail = b.contactEmail;
  if (b.mailingAddress !== undefined) updateData.mailingAddress = b.mailingAddress;
  if (b.heirInformation !== undefined) updateData.heirInformation = b.heirInformation;
  if (b.skipTraceNotes !== undefined) updateData.skipTraceNotes = b.skipTraceNotes;
  if (b.claimFilingDate !== undefined) updateData.claimFilingDate = b.claimFilingDate;
  if (b.claimReferenceNumber !== undefined) updateData.claimReferenceNumber = b.claimReferenceNumber;
  if (b.feePercentage !== undefined) {
    updateData.feePercentage = String(b.feePercentage);
    if (b.excessAmount !== undefined) {
      updateData.estimatedRecoveryFee = String((parseFloat(b.excessAmount) * (parseFloat(b.feePercentage) / 100)).toFixed(2));
    }
  }
  if (b.notes !== undefined) updateData.notes = b.notes;

  updateData.updatedAt = new Date();

  const [updated] = await db.update(priorOwnerLeadsTable)
    .set(updateData)
    .where(eq(priorOwnerLeadsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json({
    ...updated,
    excessAmount: parseFloat(updated.excessAmount ?? "0"),
    salePrice: parseFloat(updated.salePrice ?? "0"),
    estimatedRecoveryFee: parseFloat(updated.estimatedRecoveryFee ?? "0"),
    feePercentage: parseFloat(updated.feePercentage ?? "25"),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt?.toISOString() ?? null,
  });
});

// DELETE CRM lead
router.delete("/crm/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(priorOwnerLeadsTable).where(eq(priorOwnerLeadsTable.id, id));
  res.json({ success: true, message: "Lead removed from CRM" });
});

export default router;
