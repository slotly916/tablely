-- ============================================================================
-- Tablely — Migration: Bereiche (areas)
-- ----------------------------------------------------------------------------
-- Trennt die beiden bisher vermischten Konzepte:
--   1. BEREICHE       — wo steht der Tisch (Terrasse, Garten, Wintergarten)?
--                       Neue Tabelle areas, Zuordnung über tables.area_id.
--   2. ZUSAMMENSCHIEBEN — welche Tische lassen sich kombinieren?
--                       Bleibt unverändert auf tables.combinable_with.
--
-- tables.is_outdoor bleibt bestehen und wird von der App mit
-- areas.is_outdoor synchron gehalten. Dadurch laufen Wetter-Warnung und
-- Schlechtwetter-Puffer unverändert weiter.
--
-- Gefahrlos mehrfach ausführbar. Im Supabase SQL Editor ausführen.
-- Voraussetzung: migrations/wetter-haustiere.sql wurde bereits ausgeführt
-- (liefert tables.is_outdoor).
-- ============================================================================

-- 1) TABELLE ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  is_outdoor    boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS areas_restaurant_id_idx ON areas (restaurant_id);

-- 2) ZUORDNUNG ----------------------------------------------------------------
-- NULL = kein Bereich = Innenbereich. Wird ein Bereich gelöscht, fallen seine
-- Tische automatisch auf NULL zurück (die App setzt zusätzlich is_outdoor).
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS area_id uuid REFERENCES areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tables_area_id_idx ON tables (area_id);

-- 3) BACKFILL -----------------------------------------------------------------
-- Bisher lag der Außenbereich direkt auf den Tischen. Für jedes Restaurant mit
-- Außentischen wird ein Bereich 'Terrasse' angelegt und die Tische zugeordnet.
-- Beide Schritte sind idempotent: Der INSERT läuft nur, wenn es noch keine
-- 'Terrasse' gibt, das UPDATE nur für Tische ohne Bereich.
INSERT INTO areas (restaurant_id, name, is_outdoor)
SELECT DISTINCT t.restaurant_id, 'Terrasse', true
FROM tables t
WHERE t.is_outdoor = true
  AND NOT EXISTS (
    SELECT 1 FROM areas a
    WHERE a.restaurant_id = t.restaurant_id
      AND a.name = 'Terrasse'
  );

UPDATE tables t
SET area_id = a.id
FROM areas a
WHERE a.restaurant_id = t.restaurant_id
  AND a.name = 'Terrasse'
  AND a.is_outdoor = true
  AND t.is_outdoor = true
  AND t.area_id IS NULL;

-- 4) RLS ----------------------------------------------------------------------
-- Gleiche Struktur wie tables: vier Policies mit USING true.
-- ACHTUNG: Das ist bewusst dieselbe (offene) Struktur wie bei tables — die
-- Umstellung auf echte Owner-Checks steht für ALLE Tabellen gemeinsam an
-- (siehe Prioritäten in CLAUDE.md).
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY kennt kein IF NOT EXISTS — deshalb vorher droppen.
DROP POLICY IF EXISTS areas_select_policy ON areas;
CREATE POLICY areas_select_policy ON areas FOR SELECT USING (true);

DROP POLICY IF EXISTS areas_insert_policy ON areas;
CREATE POLICY areas_insert_policy ON areas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS areas_update_policy ON areas;
CREATE POLICY areas_update_policy ON areas FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS areas_delete_policy ON areas;
CREATE POLICY areas_delete_policy ON areas FOR DELETE USING (true);
