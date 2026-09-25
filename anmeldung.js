// Kurswechsel: Anmeldungen an Supabase schicken.
// Der Schlüssel hier ist ÖFFENTLICH gedacht. Die Datenbank erlaubt damit nur das Hinzufügen
// von Anmeldungen (siehe supabase/anmeldungen.sql). Einen geheimen Schlüssel hier nie eintragen.
import { pruefeAnmeldung, baueAnmeldung } from './content.js';

export const SUPABASE_URL = 'https://cqvajrlbtfqymncnedok.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_4iSP-UNgXfPMDgjl_D2W1w_r8H3sGAg';

// Schickt eine fertige Anmeldung an Supabase. Wirft nie, sondern liefert { ok } zurück.
// fetchFn ist austauschbar, damit die Tests ohne Internet laufen.
export async function sendeAnmeldung(daten, fetchFn = (...a) => globalThis.fetch(...a), zeitlimitMs = 15000) {
  try {
    const antwort = await fetchFn(`${SUPABASE_URL}/rest/v1/anmeldungen`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(daten),
      // Hängt Supabase (z. B. pausiertes Projekt), soll niemand ewig warten.
      signal: AbortSignal.timeout(zeitlimitMs),
    });
    return antwort.ok ? { ok: true } : { ok: false, grund: `HTTP ${antwort.status}` };
  } catch {
    return { ok: false, grund: 'netz' };
  }
}

// Der ganze Ablauf für einen Klick auf „Anmelden“: Spam-Falle, Prüfen, Senden.
export async function meldeAn(eintrag, eingaben, fetchFn) {
  // Das unsichtbare Feld „webseite“ füllen nur Spam-Programme aus.
  if (String(eingaben.webseite ?? '').trim()) return { ok: true };
  const fehler = pruefeAnmeldung(eingaben);
  if (Object.keys(fehler).length > 0) return { ok: false, fehler };
  return sendeAnmeldung(baueAnmeldung(eintrag, eingaben), fetchFn);
}
