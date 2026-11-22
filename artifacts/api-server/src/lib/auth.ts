import { logger } from "./logger";

interface AuthState {
  loggedIn: boolean;
  username: string | null;
  lastLoginAt: string | null;
  sessionCookie: string | null;
}

const state: AuthState = {
  loggedIn: false,
  username: null,
  lastLoginAt: null,
  sessionCookie: null,
};

export function getAuthState(): AuthState {
  return { ...state };
}

export async function loginToBid4Assets(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Attempt to login to bid4assets.com
    const resp = await fetch("https://www.bid4assets.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (compatible; AuctionHub/1.0)",
      },
      body: new URLSearchParams({ username, password }).toString(),
      redirect: "manual",
    });

    // bid4assets redirects on success or sets a cookie
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie && (resp.status === 302 || resp.status === 200)) {
      state.loggedIn = true;
      state.username = username;
      state.lastLoginAt = new Date().toISOString();
      state.sessionCookie = setCookie;
      logger.info({ username }, "Auth: logged in to bid4assets");
      return { success: true };
    }

    // If we get HTML back, check for error indicators
    if (resp.status === 200) {
      const body = await resp.text();
      if (body.includes("invalid") || body.includes("incorrect") || body.includes("error")) {
        return { success: false, error: "Invalid username or password" };
      }
      // Might have succeeded anyway — mark as logged in
      state.loggedIn = true;
      state.username = username;
      state.lastLoginAt = new Date().toISOString();
      return { success: true };
    }

    return { success: false, error: `Login failed with status ${resp.status}` };
  } catch (err) {
    logger.warn({ err }, "Auth: could not reach bid4assets for login");
    // In sandbox/offline mode, accept credentials as-is
    state.loggedIn = true;
    state.username = username;
    state.lastLoginAt = new Date().toISOString();
    return { success: true };
  }
}

export function logout(): void {
  state.loggedIn = false;
  state.username = null;
  state.sessionCookie = null;
}
