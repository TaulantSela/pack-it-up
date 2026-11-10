# Pack It Up - Smart Packing List Generator

A modern, intelligent packing list app built with Next.js that generates personalized packing recommendations based on your trip details.

## Features

- **Smart Recommendations**: AI-powered packing suggestions (Google Gemini) based on where you live, your destination, climate, activities, and travel preferences, with a rule-based fallback when the AI is unavailable
- **Interactive Checklist**: Check off items as you pack with real-time progress tracking
- **Categorized Items**: Items organized by category (clothing, toiletries, electronics, etc.)
- **Essential Items Highlighting**: Important items are clearly marked
- **Export & Print**: Download your list as a text file or print it
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful, intuitive interface with smooth animations

## How It Works

1. **Enter Trip Details**: Fill out the form with your destination, duration, season, climate, and activities
2. **Add Special Requirements**: Include any special needs like medical conditions or dietary restrictions
3. **Generate List**: Get a personalized packing list tailored to your trip
4. **Track Progress**: Check off items as you pack and see your progress
5. **Export/Print**: Save or print your list for offline use

## Trip Information Collected

- **Home city**: Where you live, which decides passport and visa reminders, plug adapters, and currency
- **Destination**: Where you're traveling
- **Duration**: How many days you'll be away
- **Season**: Spring, Summer, Fall, or Winter
- **Climate**: Tropical, Temperate, Cold, or Desert
- **Activities**: Hiking, Beach, Skiing, Business, Camping, etc.
- **Accommodation**: Hotel, Hostel, Camping, Airbnb, or Other
- **Group Size**: Number of people traveling
- **Children**: Whether you're traveling with children
- **Special Needs**: Medical conditions, dietary restrictions, accessibility needs

## Smart Features

### Activity-Based Recommendations

- **Hiking**: Hiking boots, trail snacks, map/compass
- **Beach**: Swimsuit, beach towel, sunscreen
- **Skiing**: Ski gear, thermal underwear, goggles
- **Business**: Formal attire, laptop, business cards
- **Camping**: Tent, sleeping bag, camping stove

### Climate-Specific Items

- **Tropical**: Lightweight clothing, sunscreen, insect repellent
- **Cold**: Thermal underwear, winter hat, gloves
- **Desert**: Long-sleeved shirts, lip balm with SPF

### Duration-Based Quantities

- Clothing quantities adjust based on trip length
- Toiletries quantities scale with duration

## Getting Started

### Prerequisites

- Node.js 22+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pack-it-up
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill it in. `GOOGLE_GENERATIVE_AI_API_KEY` is a free key from [Google AI Studio](https://aistudio.google.com/apikey); without it, lists come from the built-in fallback.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK with Google Gemini (free tier), validated with Zod
- **Auth**: Clerk, with a guest mode
- **Database**: PostgreSQL (Neon) via Prisma
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```
pack-it-up/
├── app/
│   ├── api/trips/           # Trip, item and progress endpoints
│   ├── globals.css          # Global and print styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── components/
│   ├── trip-form.tsx        # Trip details form
│   ├── packing-list.tsx     # Packing list display
│   └── packing-history.tsx  # Saved lists
├── lib/
│   ├── ai.ts                # Gemini prompt and rule-based fallback
│   ├── trip-options.ts      # Activities, seasons, climates, categories
│   ├── validation.ts        # Zod schemas for API input
│   └── rate-limit.ts        # Guest rate limiting
└── prisma/schema.prisma     # Database schema
```

## Customization

### Adding New Activities

Add the activity to `ACTIVITIES` in `lib/trip-options.ts`, then add its fallback items in `generateFallbackSuggestions` in `lib/ai.ts`.

### Changing the AI Model

Set `AI_MODEL` to another Gemini model ID. The default is set in `lib/ai.ts`.

### Database Changes

The database is managed with `prisma db push`, so run `npx prisma db push` after changing `prisma/schema.prisma`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you have any questions or need help, please open an issue on GitHub.

---

**Happy Packing! 🧳✈️**
