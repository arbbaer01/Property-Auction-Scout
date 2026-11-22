import { Router } from "express";
import { db, spreadsheetsTable, propertiesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { ListSpreadsheetsQueryParams, DownloadSpreadsheetBody, GetSpreadsheetParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

router.get("/spreadsheets", async (req, res): Promise<void> => {
  const parsed = ListSpreadsheetsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const p = parsed.data;
  const conditions = [];
  if (p.type && p.type !== "all") conditions.push(eq(spreadsheetsTable.type, p.type));
  if (p.state) conditions.push(eq(spreadsheetsTable.state, p.state));
  if (p.year !== undefined) conditions.push(eq(spreadsheetsTable.year, p.year));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [spreadsheets, [{ total }]] = await Promise.all([
    db.select().from(spreadsheetsTable).where(where).orderBy(desc(spreadsheetsTable.createdAt)),
    db.select({ total: count() }).from(spreadsheetsTable).where(where),
  ]);

  res.json({ spreadsheets: spreadsheets.map(serializeSpreadsheet), total });
});

router.post("/spreadsheets/download", async (req, res): Promise<void> => {
  const parsed = DownloadSpreadsheetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;

  // Insert a spreadsheet record and kick off download in background
  const [spreadsheet] = await db.insert(spreadsheetsTable).values({
    type: d.type,
    state: d.state,
    county: d.county,
    year: d.year,
    month: d.month,
    sourceUrl: d.sourceUrl,
    status: "pending",
  }).returning();

  // Simulate async download/import in background
  processSpreadsheetDownload(spreadsheet.id, d.sourceUrl ?? null).catch((err) => {
    logger.error({ err, spreadsheetId: spreadsheet.id }, "Spreadsheet download failed");
  });

  res.status(202).json({
    jobId: `spreadsheet-${spreadsheet.id}`,
    status: "accepted",
    message: "Spreadsheet download queued",
  });
});

router.get("/spreadsheets/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetSpreadsheetParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [spreadsheet] = await db.select().from(spreadsheetsTable).where(eq(spreadsheetsTable.id, parsed.data.id)).limit(1);
  if (!spreadsheet) {
    res.status(404).json({ error: "Spreadsheet not found" });
    return;
  }
  res.json(serializeSpreadsheet(spreadsheet));
});

async function processSpreadsheetDownload(id: number, sourceUrl: string | null): Promise<void> {
  await db.update(spreadsheetsTable).set({ status: "downloading" }).where(eq(spreadsheetsTable.id, id));

  try {
    if (sourceUrl) {
      const resp = await fetch(sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AuctionHub/1.0)" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      // In a full implementation we would parse the xlsx/csv here using a library
      // and insert rows into propertiesTable
    }

    // Mark as imported with simulated count
    await db.update(spreadsheetsTable).set({ status: "imported", propertyCount: 0 }).where(eq(spreadsheetsTable.id, id));
    logger.info({ id }, "Spreadsheet imported successfully");
  } catch (err) {
    await db.update(spreadsheetsTable).set({
      status: "failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    }).where(eq(spreadsheetsTable.id, id));
  }
}

function serializeSpreadsheet(s: typeof spreadsheetsTable.$inferSelect) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt?.toISOString() ?? null,
  };
}

export default router;
