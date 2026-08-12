# Butlery (vormals Tablely) — Projekt-Kontext

## Was ist Butlery
KI-gestützte Restaurant-Reservierungssoftware (SaaS) für Österreich. Solo-Projekt von Michael Kleinlercher (Michael Kleinlercher e.U., Osttirol). Live unter tablely.at (Domain bleibt vorerst). Presse: ORF Tirol, Tiroler Tageszeitung, top.tirol (Juni 2026).

## Rebranding: Tablely → Butlery (VOLLZOGEN am 11.8.2026)
Das Produkt heißt öffentlich **Butlery**. Die frühere Geheimhaltung ist aufgehoben, die Umbenennung im Code durchgezogen (139 Textstellen + 34 Wortmarken in 36 Dateien).

**WICHTIG — was NICHT umbenannt wurde und auch nicht umbenannt werden darf:**
- `tablely.at` (54 Stellen): Domain, Links, `metadataBase`, `canonical`, `noreply@send.tablely.at`, `michael@tablely.at`, `info@tablely.at`. Die Domain läuft weiter, eine Umbenennung bricht Mailversand und alle Links
- `tablely_cookie_consent`, `tablely_pilot_popup_dismissed` (localStorage): Umbenennen würde die Einwilligung aller Bestandsnutzer zurücksetzen
- Blog-Slug `warum-ich-tablely-gebaut-habe`: URL ist indexiert und von der Landing verlinkt
- `tablely-voice` (Railway/VOICE_WS_URL): separates Repo, eigene Deploy-URL

Merkregel: **Großgeschriebenes „Butlery" = Marke. Kleingeschriebenes „tablely" = Technik, bleibt.** Bei Skripten `-creplace` statt `-replace` verwenden — PowerShells `-replace` ist case-insensitive und hat genau hier schon einmal 59 Domains und Keys zerschossen.

- Logos: `public/butlery-logo-dunkel.png` (dunkelblaue Wortmarke mit oranger Fliege, für helle Flächen — Nav, Footer, alle Unterseiten), `public/butlery-logo-hell.png` (weiße Variante — nur in der Rebranding-Bühne auf dunkler Fläche)
- Die aufgeteilte Text-Wortmarke `table<span>ly</span>` gibt es nicht mehr; überall steht jetzt das Logo-Bild. In HTML-Mailvorlagen bewusst als TEXT „Butlery" in Georgia, nicht als Bild — Mailclients blockieren Bilder
- Namenswechsel sitzt IM Hero (Komponente `RenameMark` in src/app/page.tsx), nicht als eigener Block über der Nav — ein Block darüber hat den Hero nach unten geschoben und sah schlecht aus. Die Zeile zeigt „tablely → Butlery-Wortmarke": der alte Name verblasst beim Laden von .82 auf .34 Deckkraft, Pfeil und neues Logo blenden nachgelaufen ein (620 ms Versatz). Nur opacity + transform, bei prefers-reduced-motion sofort der Endzustand. Der alte Name „Tablely" steht NUR noch hier (plus als aria-label) — nirgends sonst im sichtbaren Text
- Die Beruhigung zum Namenswechsel („Zugangsdaten bleiben, tablely.at leitet weiter") steht im Footer, bewusst nicht im Hero
- tablely.at bleibt ~12 Monate als Weiterleitung bestehen

## Stack
- Next.js 16 (App Router, Turbopack, TypeScript), deployed auf Vercel
- Supabase (Postgres + Auth via @supabase/ssr Cookie-Auth)
- Resend (Mails, from: noreply@send.tablely.at)
- Groq (LLM: llama-3.3-70b-versatile für WhatsApp, llama-3.1-8b-instant für Voice)
- Meta WhatsApp Business API
- Twilio ConversationRelay + ElevenLabs + Deepgram (Telefon-KI)
- Stripe (Abos)
- Voice-Server: SEPARATES Repo (tablely-voice) auf Railway, WebSocket-Server (express+ws)

## Architektur / wichtige Pfade
- src/app/page.tsx — Landing Page. HERO = "DIE NAHT": die Kante zwischen dunklem und hellem Block läuft mitten durch die H1. "Kein Anruf." / "Kein Buch." weiß auf #1A1A2E, dann die harte Kante, dann "Kein Chaos." orange auf Weiß. Dazu: Namenswechsel-Zeile, Angebots-Badge, Fließtext, CTAs, Preiszeile, Presse-Zeile. Danach #einblick (5 echte Screenshots), Pain, Statement, Funktionen, WhatsApp, Demo, Zahlen, Gründer, Warum, Pilot, CTA
- REGELN ZUR NAHT (sonst zerbricht der Hero): an der Kante KEIN Radius, KEINE Hairline, KEIN Schatten, KEIN Verlauf. Die Naht ist schlicht die Unterkante des dunklen Blocks und zielt auf nichts Berechnetes — "Buch." hat keine Unterlänge, "Kein Chaos." startet 0,196em darunter, dazwischen ~25px leerer Korridor. Headline-Text steht in der Konstante HERO_LINES: wer umformuliert, muss DREI kurze Zeilen behalten, die letzte die Pointe. Größe kommt aus --h1 (clamp(46px,6.6vw,92px)) — KEIN zweiter font-size-Override in einer Mediaquery, das war die eine Stelle, an der es kaputtgehen kann
- Hero-Auftritt läuft über useHeroStart/HeroIn, NICHT über Reveal — dessen filter:blur(8px) würde genau die Kante aufweichen. Gestaffelt 0/90/170/250/390/470/540/610/690 ms, nur opacity+transform, bei prefers-reduced-motion reine Deckkraft-Staffelung mit identischer Geometrie
- src/app/page.tsx #einblick — fünf echte Screenshots mit Erklärung: public/dashboard.png (Reservierungsliste inkl. Notiz "Bitte um 2 Kinderstühle"), tischkarte.png (Zeitachse), walk-in.png (Schnellanlage mit Tischvorschlag), manuell-res.png (Tischwahl + Kanal + Notizen), wetter.png (Regen-Vorwarnung, Puffer freiwillig). walk-in/manuell/wetter wurden auf ihre Karte zugeschnitten (Modal-Schleier bzw. Seitenhintergrund entfernt)
- ENTFERNT weil sie das ALTE Dashboard zeigten: dashboard-dunkel.png (Hero-Mockup), reservierung-hell.png, reservierung-dunkel.png, mac_iohon.png samt der Sektion "Vom Gast direkt ins Dashboard". Die Dateien liegen noch in public/, sind aber nirgends mehr referenziert. Die iPhone-Mockups (iphone_whatsapp/bookingpage/tel) sind BEWUSST geblieben — sie zeigen die Gastseite und sind vom Dashboard-Umbau nicht betroffen
- src/components/CookieConsent.tsx — Cookie-Einwilligung + Google Analytics, eingebunden im ROOT-LAYOUT (gilt für alle Seiten, vorher lag der Banner nur in page.tsx und fehlte bei Einstieg über Blog/Presse). GA wird erst NACH Zustimmung nachgeladen, vorher geht kein Request an Google. Beim Widerruf werden die _ga*-Cookies gelöscht. localStorage-Key `tablely_cookie_consent` mit den Werten accepted/declined bleibt wie er war (siehe Rebranding-Abschnitt). Braucht `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel; fehlt die Variable, lädt GA nicht und die Seite läuft normal weiter. Widerruf über `CookieSettingsLink` (Client-Wrapper für Server-Komponenten) im Landing-Footer, im PageShell-Footer und auf der Datenschutzseite — letzteres deckt die Seiten mit eigenem Footer (Impressum, AGB, Presse, Preise) ab
- ACHTUNG `<img>` mit width/height-Attributen: Wer die Attribute setzt (gegen Layout-Shift), MUSS `height:"auto"` in den Style schreiben. Sonst gewinnt das Attribut gegen eine relative CSS-Breite und zieht das Bild auf seine Dateihöhe. Genau das ist bei public/computer.jpg passiert (Querformat 1170×874, auf 62% Breite bei 874px Höhe gestreckt) und fiel lokal nicht auf
- src/app/blog/ + src/lib/blog.ts — Blog (statisches Artikel-Array, KEIN CMS)
- src/app/ki-transparenz/page.tsx — EU-AI-Act-Transparenzseite (im Footer verlinkt)
- public/Michael_Kleinlercher.jpg, public/computer.jpg — Gründer-Fotos
- src/app/api/whatsapp/route.ts — WhatsApp-KI (Slot-Filling, Alternativzeiten wenn voll, LARGE_GROUP ab 15 Personen → pending, CANCEL_RESERVATION → Storno). KI-KENNZEICHNUNG (EU AI Act Art. 50): jede ausgehende Nachricht läuft durch die lokale `reply()` in POST, NICHT direkt über `sendWhatsApp()`. Bei der ersten Interaktion stellt reply() „Hallo, ich bin der digitale Assistent von {Restaurant}." voran, sofern die Regex SELF_ID die Kennzeichnung nicht schon im Text findet. Grund: die Prompt-Regel allein reichte nicht, weil LARGE_GROUP, „kein Tisch frei", die Storno-Fallbacks und alle Fehlermeldungen fest verdrahtete Texte senden statt aiMessage. Wer hier einen neuen Antwortpfad einbaut, MUSS reply() nutzen. Die drei Pfade vor dem Restaurant-Load kennen den Namen noch nicht und tragen GENERIC_DISCLOSURE. Erste Interaktion = keine Historie ODER letzter Kontakt älter als RE_DISCLOSE_AFTER_HOURS (24h, hängt an whatsapp_conversations.updated_at, das jetzt auch beim Insert gesetzt wird). Die Historie speichert den reinen Modell-Output ohne Kennzeichnung, damit die Leerprüfungen der Marker-Pfade nicht den Hinweis für Inhalt halten
- src/app/api/voice/route.ts — TwiML für Twilio (verweist auf VOICE_WS_URL Railway; Begrüßung nennt "digitaler Telefonassistent")
- src/app/api/pilot-status/route.ts — zählt Restaurants ab PILOT_START, steuert Phasen: pilot (6 Monate) → flash (48h Countdown, 30 Tage) → normal (14 Tage)
- src/app/api/welcome-email/route.ts — Willkommens-Mail Pilotprogramm (ACHTUNG: Text sagt noch "3 Monate", Landing sagt 6 — bei nächster Änderung abgleichen)
- src/app/api/request-number/route.ts — WhatsApp-Nummer-Anfrage (Name+Tel → Mail an info@tablely.at)
- src/app/api/cron/route.ts — Erinnerungen 24h/2h vorher (braucht CRON_SECRET in Vercel!)
- src/app/(dashboard)/dashboard/settings/page.tsx — Einstellungen (Tische, Tisch-Gruppen, Öffnungszeiten). Tisch-Löschen: FK-Fehler 23503 (Tisch hat Reservierungen) wird abgefangen → Meldung statt Löschung. Tab "Tisch-Gruppen" hat zwei Unter-Tabs: "Bereiche" (areas: anlegen/umbenennen/löschen, Schalter Außenbereich, Tische zuordnen) und "Zusammenschieben" (combinable_with wie gehabt, zeigt den Bereich je Tisch). Restaurant-Tab: "Haustiere erlaubt" + Geocoding der Adresse beim Speichern
- src/app/(auth)/onboarding/page.tsx — 7 Schritte, WhatsApp-Step = Nummer-Anfrage-Formular. Gruppen-Schritt kennt den Außenbereich-Schalter (legt beim Abschluss den Bereich "Terrasse" an — bewusst als letzter Schritt, damit ein Fehler dort nichts anderes kostet), beim Abschluss wird die Adresse geokodiert
- src/app/api/weather/route.ts — Open-Meteo pro Restaurant (kein API-Key): current_weather + hourly (2 Tage) + daily (7 Tage), In-Memory-Cache 1h. LAZY-BACKFILL: fehlen latitude/longitude, wird hier serverseitig geokodiert und am Restaurant gespeichert. Antwortet immer 200 mit { available } + reason
- src/lib/geocode.ts — Adresse → Koordinaten über Open-Meteo Geocoding. Probiert die Adressteile von hinten nach vorne, wirft nie, gibt null zurück
- src/lib/weatherBuffer.ts — gemeinsame Logik für Wetter-Warnung und Schlechtwetter-Puffer (Regentag-Erkennung, freie Innentische, Blocker-Zeitfenster)
- src/components/WeatherPanel.tsx — Dashboard-Widget, IMMER sichtbar: Zeile 1 aktuelles Wetter, Zeile 2 Stundenverlauf bis Mitternacht mit blauen Regenbalken, Zeile 3 Empfehlung nur bei relevantem Regen. Ohne Standort: Hinweis "Standort nicht gefunden"
- src/components/WeatherIcons.tsx — farbige Wetter-SVGs (WMO-Code → Darstellung + deutscher Text). Farbe ist hier funktionale Datenvisualisierung; trotzdem keine Emojis und keine Icon-Library

## Supabase Schema (Kern)
- restaurants: id, name, email, slug, whatsapp_phone_id, stay_duration (default 150 min), large_group_threshold (15), trial_start, trial_days, plan, twilio_phone, fallback_phone, stripe_*, latitude, longitude (Geocoding der Adresse, für Wetter), allow_pets
- areas: id, restaurant_id, name, is_outdoor, created_at — BEREICHE (Terrasse, Garten, Wintergarten). Ein Tisch gehört zu genau einem Bereich
- tables: id, restaurant_id, name, capacity, combinable_with (text[]), area_id (FK auf areas, NULL = Innen), is_outdoor
- ZWEI GETRENNTE KONZEPTE, nicht vermischen: area_id = WO steht der Tisch (wetterrelevant), combinable_with = WELCHE Tische lassen sich zusammenschieben (Kapazität). Kombinationen über Bereichsgrenzen sind erlaubt (nur Hinweis in der UI)
- tables.is_outdoor ist ein von der APP synchron gehaltenes Spiegelfeld: bei jeder Bereichszuordnung/-änderung wird is_outdoor = area.is_outdoor gesetzt (false ohne Bereich). Wetter- und Puffer-Logik lesen NUR is_outdoor — wer area_id direkt in SQL ändert, muss is_outdoor mitziehen
- reservations: restaurant_id, table_id, table_ids (text[] für Kombinationen), guest_name, guest_phone, party_size, date, time, status (confirmed/pending/cancelled/completed), channel (online/whatsapp/phone/walkin/system), has_pet, reminder_24h_sent, reminder_2h_sent, feedback_*
- channel 'system' = Schlechtwetter-Puffer (guest_name 'Schlechtwetter-Puffer'). Blockt über die gesamte Öffnungszeit und wirkt dadurch in ALLEN Kanälen (Buchungsseite, WhatsApp, Voice-Repo) ohne Änderung an Verfügbarkeitslogiken. Im Dashboard NICHT als Gast-Reservierung anzeigen und aus allen Zählungen ausschließen
- migrations/wetter-haustiere.sql — Schemaänderungen für Wetter + Haustiere (idempotent, im SQL Editor ausführen)
- migrations/bereiche.sql — areas + tables.area_id + Backfill 'Terrasse' aus is_outdoor + RLS (idempotent). NACH wetter-haustiere.sql ausführen
- opening_hours: day_of_week (0=Sonntag!), open_time, close_time, is_closed
- waitlist, whatsapp_conversations, number_requests
- FK: reservations_table_id_fkey verhindert Tisch-Löschen wenn referenziert (gewollt!)
- RLS: aktiv auf allen Tabellen. tables hat 4 saubere Policies (USING true). ACHTUNG: waitlist, whatsapp_conversations, number_requests haben evtl. noch 0 Policies (blockiert)

## Env Vars (Vercel)
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, RESEND_API_KEY, GROQ_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, CRON_SECRET, VOICE_WS_URL (wss://tablely-voice-production.up.railway.app), NEXT_PUBLIC_GA_MEASUREMENT_ID (Google Analytics, Format G-XXXXXXXXXX — lokal bewusst leer lassen, sonst zählen eigene Dev-Aufrufe mit), Stripe Keys
Railway (tablely-voice): GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY

## Bekannte Stolperfallen (WICHTIG)
- Deutsche Anführungszeichen („") in JSX → Build-Fehler. Immer normale Quotes.
- Supabase .single() crasht bei 0 oder >1 Treffern → stattdessen .order().limit(1) und [0] nehmen
- Stripe/Supabase-Clients lazy INNERHALB der Handler initialisieren (nicht top-level)
- Es gibt Restaurant-DUPLIKATE mit gleicher E-Mail in der DB (Aufräumen ausstehend). Bei Queries auf email: IN statt = nutzen
- Slug "alpengasthof-" endet mit Bindestrich (Bug, kosmetisch)
- PREISE stehen an DREI Stellen und sind schon einmal auseinandergelaufen (Standard: 79 auf der Preisseite, 99 auf der Upgrade-Seite). Stand 11.8.2026 überall: Standard 90, Plus 129, Premium 249. Bei jeder Änderung ALLE drei anfassen: src/app/pricing/page.tsx (plans[].price), src/app/upgrade/page.tsx (PLANS[].price), src/app/page.tsx (Hero-Zeile unter dem CTA — nennt bewusst 129, weil die Landing WhatsApp-KI bewirbt und die erst in Plus enthalten ist). ACHTUNG: abgebucht wird keiner dieser Werte, sondern das Stripe-Price-Objekt hinter STRIPE_PRICE_STANDARD/_PLUS/_PREMIUM — bei Preisänderungen zwingend in Stripe gegenprüfen
- Plan-Umfang: Standard = Dashboard + Walk-in + Online. Plus = Standard + Wetter + eigene WhatsApp-Nummer + WhatsApp-KI. Premium = Plus + Telefon-KI
- KEINE erfundenen Belege mehr einbauen. Auf der Preisseite standen "27 Restaurants auf der Warteliste" mit vier generierten Avataren und "Noch 5 von 10 Plätzen" aus einem localStorage-Key, den nichts je geschrieben hat. Beides entfernt (UWG-Risiko). Zahlen nur aus der DB (/api/waitlist-count) und erst ab einer Schwelle anzeigen; Belege nur verlinkt (ORF, TT, top.tirol)
- opening_hours: day_of_week — der gesamte App-Code arbeitet mit 0 = MONTAG. Onboarding und Einstellungen schreiben den Index aus DAYS = [Montag..Sonntag], die Buchungsseite liest mit (getDay()+6)%7. Der frühere Eintrag "0 = Sonntag" hier war falsch. Bestehende DB-Zeilen bei Gelegenheit einmal gegenprüfen

## Design-System (Landing/Dashboard)
Orange #FF5C35 (hover #F04E28), Dark #1A1A2E, Paper #FFFFFF, Paper-Alt #F5F6F8, Border #E6E8EC, Muted #5F5F73, WhatsApp-Grün #25D366. Headlines: Playfair Display. Body: System-Stack via `var(--font-sans)` (in globals.css). Pill-Buttons (borderRadius 100px). KEINE Emojis auf der Landing Page.

### Regeln gegen "AI-Slop-Look" (Landing Page, geprüft von slop-detect.com)
Diese Punkte NICHT wieder einführen — sie waren der Grund für Score 33/100:
- Kein DM Sans / Inter / Geist / Space Grotesk. Body = System-Stack, Display = Playfair.
- Kein warmes Off-White (#FFFAF5 / #F5F0EB) als Fläche. Weiß + kühles #F5F6F8.
- Keine dekorativen Verläufe (radial-gradient-Glows). Aktuell: 0 auf der Seite.
- Kein backdrop-filter: blur() — opake Flächen + Hairline-Border stattdessen.
- Keine Raster aus ≥3 gleichen Karten mit Icon obendrauf. Stattdessen echte Screenshots aus /public.
- Keine Uppercase-Section-Labels mit letter-spacing. H2 trägt die Sektion.
- Keine "1 · 2 · 3"-Schritte mit generischen Verben.
- Kursive Serifen-Akzente (`fontStyle:"italic"` auf Playfair-Spans) sparsam bis gar nicht — Akzent läuft über Orange.
- Ebenfalls vermeiden (bisher sauber): Indigo/Violett-CTAs, Gradient-Text, farbige Card-Top-Borders, Aurora-Blobs, farbige Box-Shadow-Glows, Bento-Wall, FAQ-Akkordeon.
- Die Naht im Hero ist die einzige Stelle der Seite, an der JEDE Verschönerung den Entwurf sofort zerstört. Kante hart lassen.

### Textregeln Landing (Copy-Überarbeitung 11.8.2026)
Die Verkaufstexte wurden nach Conversion-Copy-Kriterien überarbeitet (Referenz: github.com/coreyhaines31/marketingskills, Skills copywriting / copy-editing / marketing-psychology). Diese Regeln beim Weiterschreiben einhalten:
- **Keine Gedankenstriche (—) in sichtbaren Texten.** Der Em-Dash ist der auffälligste KI-Tell. Stattdessen Punkt, Doppelpunkt oder Komma. Kurze Sätze klingen ohnehin mehr nach Gastro als nach Whitepaper. In Code-Kommentaren ist der Strich egal
- **Durchgehend „ich", nie „wir".** Butlery ist ein Ein-Mann-Betrieb; „wir" war an mehreren Stellen (Statement, WhatsApp-Sektion, Footer) unglaubwürdig und hat die stärkste Differenzierung verschenkt: dass der Gründer selbst einrichtet und ans Telefon geht
- **Keine Ausrufezeichen** außer in den nachgestellten Chat-Beispielen (dort ist es echte Sprache)
- **Konkret statt Kategorie:** „Freitag, halb acht" schlägt „in der Stoßzeit", „20 Anrufe zu drei Minuten" schlägt „bis zu 2 Stunden". Die alte Behauptung „Österreichische Restaurants verlieren täglich bis zu 2 Stunden" war eine Statistik ohne Quelle und ist durch eine Rechnung ersetzt, die der Leser selbst nachprüfen kann
- **KI Telefon ist überall als „bald" / „gerade in Arbeit" gekennzeichnet.** Die Feature-Karte hat die Funktion vorher als vorhanden dargestellt, während die iPhone-Karte darunter „In Entwicklung" sagte. Bei Änderungen konsistent halten, bis die Funktion live ist
- **Keine Absolut-Versprechen.** „No-Shows sinken auf fast null" ist raus. Zielgrößen bleiben mit dem Disclaimer unter der Zahlen-Sektion
- OFFEN ZU PRÜFEN: „Der einzige Anbieter in Österreich, der alle drei Kanäle vereint" steht an zwei Stellen (Statement-Badge, Warum-Sektion). Spitzenstellungsbehauptungen sind nach UWG nur zulässig, wenn belegbar. Sollte der Markt das nicht mehr hergeben, auf „einer der wenigen" abschwächen

## SEO (Stand 11.8.2026)
- **Zentrale Datei: src/lib/seo.ts.** Dort stehen SITE_URL, die Schema.org-Knoten (Organization, Person/Gründer, WebSite, SoftwareApplication) und der Helfer `pageMeta()`
- **DIE FALLE:** Next.js vererbt Metadata vom Root-Layout an jede Route, die das Feld nicht selbst setzt. Das Root-Layout beschreibt die STARTSEITE. Eine neue Seite ohne eigenes `alternates.canonical` und `openGraph` liefert also Canonical und og:url der Startseite aus. **Jede neue Route muss über `pageMeta()` laufen.** Client-Komponenten können kein `metadata` exportieren, dafür liegt daneben ein `layout.tsx` (siehe pricing, demo, presse, links, upgrade, admin, feedback, book, alle auth- und dashboard-Routen)
- Ebenfalls NICHT vererbt: das generierte Social-Bild aus `app/opengraph-image.tsx`. `pageMeta()` setzt es deshalb auf jeder Seite explizit auf `https://tablely.at/opengraph-image`
- Social-Karte: `src/lib/ogCard.tsx` erzeugt 1200x630 aus `public/butlery-logo-hell.png` (dunkler Grund, weiße Wortmarke). Wird beim Build erzeugt (`force-static`), kein Laufzeit-Dateizugriff. Die frühere Metadata zeigte auf `/og-image.png`, eine Datei, die es nie gab
- `src/app/robots.ts` und `src/app/sitemap.ts` sind generiert, nicht statisch. **Regel: was ein `noindex` trägt, wird in robots.txt NICHT gesperrt** (sonst liest Google das noindex nie) und steht **nicht** in der Sitemap. Gesperrt ist nur `/api/` und `/ferienwohnung/` (Fremdprojekt in public/, drei fast identische Varianten = Duplicate Content)
- noindex tragen: impressum, datenschutz, agb, links, upgrade, admin, feedback, alle auth- und dashboard-Routen. **Immer mit `follow` und mit Selbst-Canonical** — ein noindex auf einer Seite, die auf die Startseite kanonisiert, kann das noindex auf die Startseite ziehen
- `/book/[slug]`: `layout.tsx` holt den Restaurantnamen serverseitig per Supabase-REST (1h Cache), baut daraus Titel und Restaurant-Schema. Unbekannter Slug → noindex. Der Restaurantname im Header ist die H1 der Seite
- **KEIN FAQ-Schema**, obwohl auf /pricing echte FAQ-Inhalte stehen: Google hat FAQ-Rich-Results am 7.5.2026 für alle Seiten abgeschaltet. Bringt keine SERP-Darstellung mehr
- Playfair kommt überall aus next/font (`var(--font-playfair)`, normal + italic). pricing, demo, presse und book haben ihren render-blockierenden `@import` von fonts.googleapis.com verloren. **Keine neuen Google-Fonts-@imports** in indexierbaren Seiten
- Bilder auf der Landing tragen `width`/`height` (gegen CLS) und unterhalb des Folds `loading="lazy"`. Bei neuen Screenshots die echten Maße mitgeben
- `public/llms.txt` beschreibt die Seite für KI-Suchen. Bei neuen Hauptseiten oder Preisänderungen mitziehen
- Google Search Console ist über `metadata.verification.google` verifiziert. Bing Webmaster Tools fehlt noch (kein Token vorhanden)

## Aktuelle Prioritäten
1. CRON_SECRET in Vercel setzen (Cron wirft 401 → Erinnerungen laufen nicht)
2. Registrierung soll trial_days phasenabhängig setzen (180/30/14 je nach pilot-status Phase)
3. RLS-Policies von USING(true) auf echte Owner-Checks umstellen (DSGVO, echte Kunden)
4. Restaurant-Duplikate bereinigen + Unique-Constraint auf email
5. KI-Kennzeichnung Rest: Gesprächs-Prompt in tablely-voice/server.js (SEPARATES Repo) um Selbstbezeichnung als digitaler Assistent ergänzen (Begrüßung + WhatsApp im Haupt-Repo sind erledigt)
6. migrations/wetter-haustiere.sql und danach migrations/bereiche.sql im Supabase SQL Editor ausführen (Wetter, Haustiere und Bereiche funktionieren erst danach)
7. SEO-Restposten: in Vercel prüfen, dass www.tablely.at per 301 auf tablely.at geht (Canonical und Sitemap nennen die Apex-Domain). Sitemap in der Search Console einreichen. Bing Webmaster Tools verifizieren

## Konventionen
- Antworte auf Deutsch
- src/app/page.tsx (Landing) ist im Design final — Layout/Stil nur auf ausdrückliche Anweisung ändern
- Jeder neue Supabase-Call: { error } prüfen + Nutzer-Feedback über useToast() (src/components/Toast.tsx)
- Vor jedem Push: Buchung, WhatsApp-Flow, Login, Tisch anlegen/löschen manuell testen
- Commits klein und beschreibend
- Nach größeren abgeschlossenen Aufgaben: diese CLAUDE.md aktualisieren