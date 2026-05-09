/**
 * JWT Supabase + postMessage igual ao Painel de Inteligência — abrir a partir do 2AS Hub.
 */
import { supabase } from "./lib/supabase.js";

const TRUSTED_HUB_ORIGINS = [
  "https://hub.2asfinancas.com",
  "https://app.2asfinancas.com",
  ...(import.meta.env.DEV ? ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"] : []),
];

export async function clearAuth() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function initHubSessionFromUrl() {
  if (typeof window === "undefined" || !supabase) return;

  const params = new URLSearchParams(window.location.search);
  const legacyAccess = params.get("sb_access_token");
  const legacyRefresh = params.get("sb_refresh_token");

  if (legacyAccess && legacyRefresh) {
    await supabase.auth.setSession({ access_token: legacyAccess, refresh_token: legacyRefresh });
    params.delete("sb_access_token");
    params.delete("sb_refresh_token");
    const clean = [window.location.pathname, params.toString()].filter(Boolean).join("?");
    window.history.replaceState({}, "", clean || window.location.pathname);
    return;
  }

  if (window.opener && !window.opener.closed) {
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 10_000);

      const handler = async (event) => {
        if (!TRUSTED_HUB_ORIGINS.includes(event.origin)) return;
        if (event.data?.type !== "painel:token") return;
        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        const { access_token, refresh_token } = event.data;
        if (access_token && refresh_token)
          await supabase.auth.setSession({ access_token, refresh_token });

        resolve();
      };

      window.addEventListener("message", handler);
      try {
        window.opener.postMessage({ type: "painel:ready" }, "*");
      } catch {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve();
      }
    });
  }
}
