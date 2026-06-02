const SESSION_KEY = 'oremus_zoho_modal_skipped';

/** Returns true if the user already dismissed the Zoho popup in this browser session */
export function wasSkippedThisSession() {
  try { return !!sessionStorage.getItem(SESSION_KEY); } catch { return false; }
}

/** Mark popup as skipped for the remainder of this browser session */
export function markSkippedThisSession() {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
}
