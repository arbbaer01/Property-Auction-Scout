import { Router } from "express";
import { db, auctionsTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc, count } from "drizzle-orm";
import { ListAuctionsQueryParams, GetAuctionParams } from "@workspace/api-zod";

const router = Router();

router.get("/auctions/summary", async (req, res): Promise<void> => {
  const allAuctions = await db.select({
    auctionType: auctionsTable.auctionType,
    state: auctionsTable.state,
    startingBid: auctionsTable.startingBid,
  }).from(auctionsTable);

  const byType = { pre_auction: 0, live: 0, ended: 0 };
  const byStateMap: Record<string, number> = {};
  const tiers = { tier1: 0, tier2: 0, tier3: 0 };

  for (const a of allAuctions) {
    if (a.auctionType === "pre_auction") byType.pre_auction++;
    else if (a.auctionType === "live") byType.live++;
    else byType.ended++;

    byStateMap[a.state] = (byStateMap[a.state] ?? 0) + 1;

    const bid = parseFloat(a.startingBid ?? "0");
    if (bid >= 1000 && bid <= 5000) tiers.tier1++;
    else if (bid >= 400000 && bid <= 1400000) tiers.tier2++;
    else if (bid >= 1500000) tiers.tier3++;
  }

  const byState = Object.entries(byStateMap).map(([state, count]) => ({ state, count }));

  res.json({
    totalAuctions: allAuctions.length,
    liveCount: byType.live,
    preAuctionCount: byType.pre_auction,
    endedCount: byType.ended,
    byState,
    priceTiers: tiers,
  });
});

router.get("/auctions", async (req, res): Promise<void> => {
  const parsed = ListAuctionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const p = parsed.data;
  const limit = p.limit ?? 50;
  const offset = p.offset ?? 0;

  const conditions = [];
  if (p.state) conditions.push(eq(auctionsTable.state, p.state));
  if (p.county) conditions.push(eq(auctionsTable.county, p.county));
  if (p.auction_type) conditions.push(eq(auctionsTable.auctionType, p.auction_type));
  if (p.property_type && p.property_type !== "all") conditions.push(eq(auctionsTable.propertyType, p.property_type));
  if (p.min_bid !== undefined) conditions.push(gte(auctionsTable.startingBid, String(p.min_bid)));
  if (p.max_bid !== undefined) conditions.push(lte(auctionsTable.startingBid, String(p.max_bid)));
  if (p.has_reserve !== undefined) conditions.push(eq(auctionsTable.hasReserve, p.has_reserve));
  if (p.days_left_max !== undefined) conditions.push(lte(auctionsTable.daysLeft, p.days_left_max));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [auctions, [{ total }]] = await Promise.all([
    db.select().from(auctionsTable).where(where).orderBy(desc(auctionsTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(auctionsTable).where(where),
  ]);

  res.json({ auctions: auctions.map(serializeAuction), total, limit, offset });
});

router.get("/auctions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetAuctionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, parsed.data.id)).limit(1);
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  res.json(serializeAuction(auction));
});

function serializeAuction(a: typeof auctionsTable.$inferSelect) {
  return {
    ...a,
    startingBid: parseFloat(a.startingBid ?? "0"),
    currentBid: parseFloat(a.currentBid ?? "0"),
    reserveAmount: a.reserveAmount != null ? parseFloat(a.reserveAmount) : null,
    auctionStartAt: a.auctionStartAt?.toISOString() ?? null,
    auctionEndAt: a.auctionEndAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt?.toISOString() ?? null,
  };
}

export default router;
