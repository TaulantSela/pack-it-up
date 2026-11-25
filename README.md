# 🧳 Pack It Up

A packing-list generator for travelers. Tell it where you live, where you're
going, your dates, how you're getting there and what you'll do, and it builds
a checklist around the actual weather for those dates.

**▶ [Try it live →](https://packitup.vercel.app)** — no account needed to
preview a list.

Generic packing lists don't know that it will rain on four of your six days,
that you're flying carry-on only, or that you need a plug adapter for the
country you're visiting. Pack It Up looks up the weather for your trip and
asks Google Gemini for a list written for it. If the AI is unavailable, a
rule-based list takes over, so you always get one.

## Features

| | |
|---|---|
| **Real weather** | The [Open-Meteo](https://open-meteo.com/) forecast when the whole trip falls within the next 16 days, otherwise the typical weather for the same dates over the last three years |
| **AI lists** | Gemini, through the Vercel AI SDK, returns a structured list (checked with Zod): category, quantity, essential flag and a one-line tip per item |
| **Rule-based fallback** | A busy model hands off to a backup Gemini model first. No API key, or every model failing (timeout, error or thin answer), falls back to a built-in list that covers weather, transport, activities, accommodation, children and your notes. The page tells you when this happens |
| **Home vs destination** | Crossing a border adds passport, visa or entry-authorization reminders, a plug adapter and local currency; a domestic trip gets an ID card instead |
| **Luggage-aware** | Carry-on only means 100 ml liquids and fewer clothes; car and train/bus trips get what the journey itself needs |
| **Place suggestions** | Home city and destination suggest towns, islands and countries as you type |
| **Checklist** | Tick items off with a progress bar, show essentials only, or uncheck everything |
| **Edit the list** | Add items or your own categories, change quantities, remove items |
| **History** | Your last 50 lists, with checked items synced across devices |
| **Export** | Download as a text file, or print it with a print stylesheet |
| **Guest mode** | Generate and tick off a list without an account. Sign in and it moves to your account, checked items included |
| **Dark mode** | Follows your system setting, with a toggle |

Editing the list and history need an account; guests can generate and check
off a list in the current browser tab.

## Use

Open [packitup.vercel.app](https://packitup.vercel.app) and fill in the form:

- **Home city**: where you live. Decides passport and visa reminders, plug
  adapters and currency.
- **Destination**: picked from the suggestions or typed freely.
- **Dates**: start and end, up to two years ahead. Trip length, the season
  (flipped for the southern hemisphere) and the weather come from these.
- **Getting there**: flight with carry-on only, flight with a checked bag,
  car, or train/bus.
- **Group size**, **accommodation** (hotel, hostel, camping, Airbnb, other)
  and whether **children** are coming.
- **Activities**: hiking, beach, skiing, business, camping, sightseeing,
  shopping, dining, nightlife, sports, photography, relaxation.
- **Anything else** (optional): a wedding on day 2, gluten-free, a work
  laptop.

## How it works

1. The form posts the trip to `POST /api/trips`, which validates it with Zod
   (`lib/validation.ts`).
2. `lib/trip-context.ts` works out the trip length and season from the dates
   and finds the destination with Open-Meteo geocoding: the place you picked,
   or the best match for what you typed.
3. `lib/weather.ts` fetches the forecast, or the same dates from the
   Open-Meteo archive for the last three years, and summarizes highs, lows,
   rainy and snowy days. Weather is best effort; the list still works
   without it.
4. `lib/ai.ts` sends the trip and weather to Gemini with the AI SDK's
   `generateText` and a Zod output schema, then clamps quantities, merges
   duplicates and caps the list at 60 items. Fewer than 10 items or an error
   (Gemini answers 503 for a busy model at peak hours) hands the trip to the
   next model in `BACKUP_MODELS`. When every model fails, or there is no API
   key, the rule-based fallback in the same file takes over.
5. Signed-in users (Clerk) get the trip, items and progress saved to
   PostgreSQL through Prisma. Guests get the list back unsaved; it lives in
   `sessionStorage` until they sign in, when it is copied to their account.

**Stack:** Next.js 15 (App Router) with React 19 and TypeScript, Tailwind
CSS 4, the Vercel AI SDK with `@ai-sdk/google`, Zod, Clerk, Prisma with
PostgreSQL (Neon), Open-Meteo, Lucide icons. Deployed on Vercel.

```
app/
  api/trips/            Trip, item and progress endpoints
  page.tsx              The whole UI: form, trip summary, list
components/
  trip-form.tsx         Trip details form
  packing-list.tsx      Checklist, editing, export and print
  packing-history.tsx   Saved lists
  ui/PlaceInput.tsx     Place suggestions as you type
lib/
  ai.ts                 Gemini prompt and rule-based fallback
  weather.ts            Open-Meteo geocoding, forecast and typical weather
  trip-context.ts       Duration, season and weather from the dates
  trip-options.ts       Activities, transport, categories and limits
  validation.ts         Zod schemas for API input
  rate-limit.ts         Guest rate limiting
  session-storage.ts    The guest list in sessionStorage
prisma/schema.prisma    Database schema
```

## Run locally

Needs Node.js 22+ and a PostgreSQL database.

```bash
git clone https://github.com/TaulantSela/pack-it-up.git
cd pack-it-up
npm install
cp .env.example .env    # then fill it in
npx prisma db push      # create the tables
npm run dev             # http://localhost:3000
```

| Variable | |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Free key from [Google AI Studio](https://aistudio.google.com/apikey). Without it, every list comes from the fallback |
| `AI_MODEL` | Optional. Another Gemini model ID; the default is set in `lib/ai.ts` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From your Clerk application |
| `CLERK_SECRET_KEY` | From your Clerk application |

Other scripts: `npm run build`, `npm start`, `npm run lint`.

### Making changes

- **New activity:** add it to `ACTIVITIES` in `lib/trip-options.ts`, then give
  it fallback items in `generateFallbackSuggestions` in `lib/ai.ts`.
- **Another model:** set `AI_MODEL`, or change `DEFAULT_MODEL` or `BACKUP_MODELS` in `lib/ai.ts`.
- **Schema changes:** the database is managed with `prisma db push`, so run
  `npx prisma db push` after editing `prisma/schema.prisma`.

## Known limitations

- Guests are limited to 10 lists an hour per IP, counted in memory on each
  server instance, so it's a speed bump rather than a hard quota. Signed-in
  users get 20 an hour, counted in the database.
- Visa and entry advice is a reminder, not a rule: requirements depend on
  your passport, and the list tells you to confirm with official sources.
- Weather comes from Open-Meteo, which is free for non-commercial use.
