import { Router } from "express";
import { startSpider, stopSpider, getSpiderState } from "../lib/spider";
import { StartSpiderBody } from "@workspace/api-zod";

const router = Router();

router.get("/spider/status", async (req, res): Promise<void> => {
  res.json(getSpiderState());
});

router.post("/spider/start", async (req, res): Promise<void> => {
  const parsed = StartSpiderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = getSpiderState();
  if (current.running) {
    res.status(409).json({ error: "Spider is already running" });
    return;
  }
  await startSpider({
    mode: parsed.data.mode,
    states: parsed.data.states ?? [],
    minBid: parsed.data.minBid ?? null,
    maxBid: parsed.data.maxBid ?? null,
    propertyTypes: parsed.data.propertyTypes ?? [],
  });
  res.status(202).json(getSpiderState());
});

router.post("/spider/stop", async (req, res): Promise<void> => {
  stopSpider();
  res.json(getSpiderState());
});

export default router;
