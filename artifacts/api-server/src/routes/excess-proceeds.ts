import { Router } from "express";
import { db, excessProceedsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, count, sum, desc } from "drizzle-orm";
import { ListExcessProceedsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/excess-proceeds/summary", async (req, res): Promise<void> => {
  const all = await db.select({
    state: excessProceedsTable.state,
    excessAmount: excessProceedsTable.excessAmount,
    claimed: excessProceedsTable.claimed,
  }).from(excessProceedsTable);

  let totalAmount = 0;
  let unclaimedAmount = 0;
  let unclaimedCount = 0;
  const byStateMap: Record<string, number> = {};

  for (const r of all) {
    const amount = parseFloat(r.excessAmount ?? "0");
    totalAmount += amount;
    if (!r.claimed) {
      unclaimedAmount += amount;
      unclaimedCount++;
    }
    byStateMap[r.state] = (byStateMap[r.state] ?? 0) + 1;
  }

  res.json({
    totalRecords: all.length,
    totalAmount,
    unclaimedAmount,
    unclaimedCount,
    byState: Object.entries(byStateMap).map(([state, count]) => ({ state, count })),
  });
});

router.get("/excess-proceeds", async (req, res): Promise<void> => {
  const parsed = ListExcessProceedsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const p = parsed.data;
  const limit = p.limit ?? 50;
  const offset = p.offset ?? 0;

  const conditions = [];
  if (p.state) conditions.push(eq(excessProceedsTable.state, p.state));
  if (p.county) conditions.push(eq(excessProceedsTable.county, p.county));
  if (p.parcel_number) conditions.push(ilike(excessProceedsTable.parcelNumber, `%${p.parcel_number}%`));
  if (p.claimed !== undefined) conditions.push(eq(excessProceedsTable.claimed, p.claimed));
  if (p.min_amount !== undefined) conditions.push(gte(excessProceedsTable.excessAmount, String(p.min_amount)));
  if (p.max_amount !== undefined) conditions.push(lte(excessProceedsTable.excessAmount, String(p.max_amount)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, [{ total }]] = await Promise.all([
    db.select().from(excessProceedsTable).where(where).orderBy(desc(excessProceedsTable.excessAmount)).limit(limit).offset(offset),
    db.select({ total: count() }).from(excessProceedsTable).where(where),
  ]);

  res.json({
    records: records.map(serializeRecord),
    total,
    limit,
    offset,
  });
});

function serializeRecord(r: typeof excessProceedsTable.$inferSelect) {
  return {
    ...r,
    salePrice: parseFloat(r.salePrice ?? "0"),
    taxBillAmount: parseFloat(r.taxBillAmount ?? "0"),
    excessAmount: parseFloat(r.excessAmount ?? "0"),
    claimedAt: r.claimedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

export default router;
