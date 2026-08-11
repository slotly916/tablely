-- ============================================================================
-- Tablely — Migration: Wetterabhängige Bereiche + Haustiere
-- ----------------------------------------------------------------------------
-- Gefahrlos mehrfach ausführbar (IF NOT EXISTS überall).
-- Im Supabase SQL Editor ausführen.
-- ============================================================================

-- 1) AUSSENBEREICH ------------------------------------------------------------
-- Tisch-Gruppen sind in Tablely KEINE eigene Tabelle, sondern ergeben sich aus
-- tables.combinable_with (jeder Tisch kennt seine Gruppenpartner). Das Flag für
-- den Außenbereich gehört deshalb auf tables: alle Tische einer Gruppe werden
-- gemeinsam auf is_outdoor gesetzt. Ein Tisch ist Außentisch, wenn is_outdoor
-- true ist — also wenn er zu einer als Außenbereich markierten Gruppe gehört.
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS is_outdoor boolean NOT NULL DEFAULT false;

-- Findet die Außentische eines Restaurants schnell (Wetter-Warnung im Dashboard).
CREATE INDEX IF NOT EXISTS tables_restaurant_outdoor_idx
  ON tables (restaurant_id, is_outdoor);

-- 2) KOORDINATEN FÜR DIE WETTER-VORHERSAGE ------------------------------------
-- Restaurants haben nur eine Textadresse. Beim Speichern der Adresse (Settings /
-- Onboarding) wird einmalig über die Open-Meteo Geocoding-API geokodiert und das
-- Ergebnis hier abgelegt. Bleibt NULL, wenn die Adresse nicht gefunden wurde —
-- dann erscheint schlicht kein Wetter-Widget.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS latitude double precision;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- 3) HAUSTIERE ----------------------------------------------------------------
-- Pro Restaurant: erlaubt das Haus Haustiere? Steuert die Frage auf der
-- Buchungsseite und die Antwort der WhatsApp-KI.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS allow_pets boolean NOT NULL DEFAULT false;

-- Pro Reservierung: bringt der Gast ein Haustier mit?
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS has_pet boolean NOT NULL DEFAULT false;

-- 4) HINWEIS ZUM SCHLECHTWETTER-PUFFER ----------------------------------------
-- Der Puffer legt bewusst KEINE neue Tabelle an: er schreibt normale Zeilen in
-- reservations mit channel = 'system', status = 'confirmed' und
-- guest_name = 'Schlechtwetter-Puffer'. Dadurch greift er automatisch in allen
-- Buchungskanälen (Buchungsseite, WhatsApp-KI, Voice-Server im separaten Repo),
-- weil überall dieselbe Überlappungsprüfung auf reservations läuft.
-- Falls auf reservations.channel ein CHECK-Constraint liegt, muss 'system'
-- erlaubt werden. Ohne Constraint ist hier nichts zu tun.
-- Beispiel (nur ausführen, wenn ein solcher Constraint existiert):
--   ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_channel_check;
--   ALTER TABLE reservations ADD CONSTRAINT reservations_channel_check
--     CHECK (channel IN ('online','whatsapp','phone','walkin','system'));

-- Findet die Puffer-Blocker eines Tages schnell (Anzeigen / Aufheben).
CREATE INDEX IF NOT EXISTS reservations_restaurant_date_channel_idx
  ON reservations (restaurant_id, date, channel);
