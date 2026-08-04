# Tablely — Projekt-Kontext

## Was ist Tablely
KI-gestützte Restaurant-Reservierungssoftware (SaaS) für Österreich. Solo-Projekt von Michael Kleinlercher (Michael Kleinlercher e.U., Osttirol). Live unter tablely.at. Presse: ORF Tirol, Tiroler Tageszeitung, top.tirol (Juni 2026).

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
- src/app/page.tsx — Landing Page (Apple-Stil, 3-Phasen-Pilotsystem)
- src/app/api/whatsapp/route.ts — WhatsApp-KI (Slot-Filling, Alternativzeiten wenn voll, LARGE_GROUP ab 15 Personen → pending, CANCEL_RESERVATION → Storno)
- src/app/api/voice/route.ts — TwiML für Twilio (verweist auf VOICE_WS_URL Railway)
- src/app/api/pilot-status/route.ts — zählt Restaurants ab PILOT_START, steuert Phasen: pilot (6 Monate) → flash (48h Countdown, 30 Tage) → normal (14 Tage)
- src/app/api/welcome-email/route.ts — Willkommens-Mail (Pilotprogramm)
- src/app/api/request-number/route.ts — WhatsApp-Nummer-Anfrage (Name+Tel → Mail an info@tablely.at)
- src/app/api/cron/route.ts — Erinnerungen 24h/2h vorher (braucht CRON_SECRET in Vercel!)
- src/app/(dashboard)/dashboard/settings/page.tsx — Einstellungen (Tische, Gruppen, Öffnungszeiten). Tisch-Löschen blockiert wenn Reservierungen existieren → Popup
- src/app/(auth)/onboarding/page.tsx — 7 Schritte, WhatsApp-Step = Nummer-Anfrage-Formular

## Supabase Schema (Kern)
- restaurants: id, name, email, slug, whatsapp_phone_id, stay_duration (default 150 min), large_group_threshold (15), trial_start, trial_days, plan, twilio_phone, fallback_phone, stripe_*
- tables: id, restaurant_id, name, capacity, combinable_with (text[])
- reservations: restaurant_id, table_id, table_ids (text[] für Kombinationen), guest_name, guest_phone, party_size, date, time, status (confirmed/pending/cancelled/completed), channel (online/whatsapp/phone/walkin), reminder_24h_sent, reminder_2h_sent, feedback_*
- opening_hours: day_of_week (0=Sonntag!), open_time, close_time, is_closed
- waitlist, whatsapp_conversations, number_requests
- FK: reservations_table_id_fkey verhindert Tisch-Löschen wenn referenziert (gewollt!)
- RLS: aktiv auf allen Tabellen. tables hat 4 saubere Policies (USING true). ACHTUNG: waitlist, whatsapp_conversations, number_requests haben evtl. noch 0 Policies (blockiert)

## Env Vars (Vercel)
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, RESEND_API_KEY, GROQ_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, CRON_SECRET, VOICE_WS_URL (wss://tablely-voice-production.up.railway.app), Stripe Keys
Railway (tablely-voice): GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY

## Bekannte Stolperfallen (WICHTIG)
- Deutsche Anführungszeichen („") in JSX → Build-Fehler. Immer normale Quotes.
- Supabase .single() crasht bei 0 oder >1 Treffern → stattdessen .order().limit(1) und [0] nehmen
- Stripe/Supabase-Clients lazy INNERHALB der Handler initialisieren (nicht top-level)
- Es gibt Restaurant-DUPLIKATE mit gleicher E-Mail in der DB (Aufräumen ausstehend). Bei Queries auf email: IN statt = nutzen
- Slug "alpengasthof-" endet mit Bindestrich (Bug, kosmetisch)
- opening_hours: day_of_week 0 = Sonntag (JS getDay() Konvention)

## Design-System (Landing/Dashboard)
Orange #FF5C35 (hover #F04E28), Dark #1A1A2E, Cream #FFFAF5, BG #F5F0EB, Border #F0EBE3, Muted #6B6B80, WhatsApp-Grün #25D366. Headlines: Playfair Display. Body: DM Sans. Pill-Buttons (borderRadius 100px). KEINE Emojis auf der Landing Page.

## Aktuelle Prioritäten
1. Fehlerbehandlung überall: JEDER supabase-Call muss { error } prüfen + Nutzer-Feedback zeigen (viele Stellen schlucken Fehler still)
2. CRON_SECRET in Vercel setzen (Cron wirft 401 → Erinnerungen laufen nicht)
3. Registrierung soll trial_days phasenabhängig setzen (180/30/14 je nach pilot-status Phase)
4. RLS-Policies von USING(true) auf echte Owner-Checks umstellen (DSGVO, echte Kunden)
5. Restaurant-Duplikate bereinigen + Unique-Constraint auf email
6. KI-Kennzeichnungspflicht (EU AI Act Art. 50, seit 2.8.2026): WhatsApp-KI und Telefon-KI müssen sich als KI zu erkennen geben (erste Nachricht / Begrüßung)

## Konventionen
- Antworte auf Deutsch
- Vor jedem Push: Buchung, WhatsApp-Flow, Login, Tisch anlegen/löschen manuell testen
- Commits klein und beschreibend