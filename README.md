# Pack It Up - Smart Packing List Generator

A modern, intelligent packing list app built with Next.js that generates personalized packing recommendations based on your trip details.

## Features

- **Smart Recommendations**: AI-powered packing suggestions based on destination, climate, activities, and travel preferences
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

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pack-it-up-v2
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Deployment**: Vercel-ready

## Project Structure

```
pack-it-up-v2/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── components/
│   ├── TripForm.tsx         # Trip details form
│   └── PackingList.tsx      # Packing list display
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   └── packingLogic.ts      # Smart packing algorithm
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

## Customization

### Adding New Activities

Edit `lib/packingLogic.ts` and add new activity items to the `activityItems` object.

### Modifying Base Items

Update the `baseItems` array in `lib/packingLogic.ts` to add or remove default items.

### Styling Changes

Modify `app/globals.css` and `tailwind.config.js` to customize the appearance.

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
