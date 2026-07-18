import { Router } from "express";
import { loginToBid4Assets, logout, getAuthState } from "../lib/auth";
import { LoginBody } from "@workspace/api-zod";

const router = Router();

router.get("/auth/status", async (req, res): Promise<void> => {
  const s = getAuthState();
  res.json({ loggedIn: s.loggedIn, username: s.username ?? null, lastLoginAt: s.lastLoginAt ?? null });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  const result = await loginToBid4Assets(username, password);
  if (!result.success) {
    res.status(401).json({ error: result.error ?? "Login failed" });
    return;
  }
  const s = getAuthState();
  res.json({ loggedIn: s.loggedIn, username: s.username ?? null, lastLoginAt: s.lastLoginAt ?? null });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  logout();
  res.json({ loggedIn: false, username: null, lastLoginAt: null });
});

export default router;
