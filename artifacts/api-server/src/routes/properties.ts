import { Router } from "express";
import { db, propertiesTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, count, desc } from "drizzle-orm";
import { ListPropertiesQueryParams, GetPropertyParams } from "@workspace/api-zod";

const router = Router();

router.get("/properties", async (req, res): Promise<void> => {
  const parsed = ListPropertiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const p = parsed.data;
  const limit = p.limit ?? 50;
  const offset = p.offset ?? 0;

  const conditions = [];
  if (p.state) conditions.push(eq(propertiesTable.state, p.state));
  if (p.county) conditions.push(eq(propertiesTable.county, p.county));
  if (p.parcel_number) conditions.push(ilike(propertiesTable.parcelNumber, `%${p.parcel_number}%`));
  if (p.spreadsheet_type && p.spreadsheet_type !== "all") conditions.push(eq(propertiesTable.spreadsheetType, p.spreadsheet_type));
  if (p.min_excess_proceeds !== undefined) conditions.push(gte(propertiesTable.excessProceeds, String(p.min_excess_proceeds)));
  if (p.max_excess_proceeds !== undefined) conditions.push(lte(propertiesTable.excessProceeds, String(p.max_excess_proceeds)));
  if (p.year !== undefined) {
    // filter by auction_date year prefix YYYY
    // use string comparison since we store date as text YYYY-MM-DD
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [properties, [{ total }]] = await Promise.all([
    db.select().from(propertiesTable).where(where).orderBy(desc(propertiesTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(propertiesTable).where(where),
  ]);

  res.json({ properties: properties.map(serializeProperty), total, limit, offset });
});

router.get("/properties/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetPropertyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, parsed.data.id)).limit(1);
  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  res.json(serializeProperty(property));
});

function serializeProperty(p: typeof propertiesTable.$inferSelect) {
  return {
    ...p,
    taxBillAmount: p.taxBillAmount != null ? parseFloat(p.taxBillAmount) : null,
    minimumBid: p.minimumBid != null ? parseFloat(p.minimumBid) : null,
    salePrice: p.salePrice != null ? parseFloat(p.salePrice) : null,
    excessProceeds: p.excessProceeds != null ? parseFloat(p.excessProceeds) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}

export default router;
