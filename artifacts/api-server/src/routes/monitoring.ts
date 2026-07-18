import { Router } from "express";
import { db, monitoringSessionsTable, bidEventsTable, auctionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { StartMonitoringParams, StopMonitoringParams, GetMonitoringStatusParams } from "@workspace/api-zod";

const router = Router();

router.get("/monitoring", async (req, res): Promise<void> => {
  const sessions = await db.select().from(monitoringSessionsTable).where(eq(monitoringSessionsTable.active, true));
  res.json({ sessions: sessions.map(serializeSession) });
});

router.post("/monitoring/:auctionId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.auctionId) ? req.params.auctionId[0] : req.params.auctionId;
  const parsed = StartMonitoringParams.safeParse({ auctionId: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid auctionId" });
    return;
  }

  const auctionId = parsed.data.auctionId;

  // Deactivate any existing session for this auction
  await db.update(monitoringSessionsTable)
    .set({ active: false, stoppedAt: new Date() })
    .where(eq(monitoringSessionsTable.auctionId, auctionId));

  const [session] = await db.insert(monitoringSessionsTable).values({
    auctionId,
    active: true,
    startedAt: new Date(),
  }).returning();

  res.json(serializeSession(session));
});

router.delete("/monitoring/:auctionId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.auctionId) ? req.params.auctionId[0] : req.params.auctionId;
  const parsed = StopMonitoringParams.safeParse({ auctionId: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid auctionId" });
    return;
  }

  const auctionId = parsed.data.auctionId;
  await db.update(monitoringSessionsTable)
    .set({ active: false, stoppedAt: new Date() })
    .where(eq(monitoringSessionsTable.auctionId, auctionId));

  res.json({ auctionId, active: false, startedAt: null, stoppedAt: new Date().toISOString() });
});

router.get("/monitoring/:auctionId/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.auctionId) ? req.params.auctionId[0] : req.params.auctionId;
  const parsed = GetMonitoringStatusParams.safeParse({ auctionId: parseInt(rawId, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid auctionId" });
    return;
  }

  const auctionId = parsed.data.auctionId;
  const [session] = await db.select().from(monitoringSessionsTable)
    .where(eq(monitoringSessionsTable.auctionId, auctionId))
    .orderBy(desc(monitoringSessionsTable.startedAt))
    .limit(1);

  if (!session || !session.active) {
    res.status(404).json({ error: "Auction is not being monitored" });
    return;
  }

  // Get recent bids
  const recentBids = await db.select().from(bidEventsTable)
    .where(eq(bidEventsTable.auctionId, auctionId))
    .orderBy(desc(bidEventsTable.timestamp))
    .limit(10);

  // Get current auction data to compute time remaining
  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId)).limit(1);
  let timeRemainingSeconds = session.timeRemainingSeconds ?? 0;
  if (auction?.auctionEndAt) {
    timeRemainingSeconds = Math.max(0, Math.floor((auction.auctionEndAt.getTime() - Date.now()) / 1000));
  }

  res.json({
    auctionId,
    currentBid: session.currentBid != null ? parseFloat(session.currentBid) : 0,
    bidCount: session.bidCount ?? 0,
    timeRemainingSeconds,
    outbid: session.outbid ?? false,
    reserveMet: session.reserveMet ?? false,
    lastUpdatedAt: session.lastUpdatedAt?.toISOString() ?? new Date().toISOString(),
    recentBids: recentBids.map((b) => ({
      amount: parseFloat(b.amount),
      timestamp: b.timestamp.toISOString(),
      bidder: b.bidder ?? null,
    })),
  });
});

function serializeSession(s: typeof monitoringSessionsTable.$inferSelect) {
  return {
    auctionId: s.auctionId,
    active: s.active,
    startedAt: s.startedAt?.toISOString() ?? null,
    stoppedAt: s.stoppedAt?.toISOString() ?? null,
  };
}

export default router;
