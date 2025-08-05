import { TripDetails } from './types';

interface AIPackingItem {
  name: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'accessories' | 'other';
  essential: boolean;
  quantity: number;
  notes?: string;
  aiSuggested?: boolean;
}

export async function generateAIPackingSuggestions(tripDetails: TripDetails): Promise<AIPackingItem[]> {
  // For now, we'll use a fallback system if no API key is provided
  if (!process.env.OPENAI_API_KEY) {
    return generateFallbackSuggestions(tripDetails);
  }

  try {
    const prompt = createPrompt(tripDetails);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert travel planner and packing specialist. Generate highly specific, detailed packing lists tailored to the exact destination, activities, climate, and trip duration. Consider local customs, weather patterns, and practical needs. Return only valid JSON array with exact structure specified.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    const items = JSON.parse(content);
    return items.map((item: any) => ({
      ...item,
      aiSuggested: true,
    }));
  } catch (error) {
    console.error('AI generation failed, using fallback:', error);
    return generateFallbackSuggestions(tripDetails);
  }
}

function createPrompt(tripDetails: TripDetails): string {
  return `Generate a highly specific and detailed packing list for this exact trip:

TRIP DETAILS:
- Destination: ${tripDetails.destination}
- Duration: ${tripDetails.duration} days
- Season: ${tripDetails.season}
- Climate: ${tripDetails.climate}
- Activities: ${tripDetails.activities.join(', ')}
- Accommodation: ${tripDetails.accommodation}
- Group size: ${tripDetails.groupSize} people
- Includes children: ${tripDetails.includesChildren}
- Special needs: ${tripDetails.specialNeeds.join(', ')}

INSTRUCTIONS:
1. Be extremely specific to the destination and activities
2. Consider local weather patterns and cultural requirements
3. Include destination-specific items (e.g., power adapters for international travel)
4. Account for trip duration with appropriate quantities
5. Include activity-specific gear and clothing
6. Consider accommodation type (hotel vs camping vs hostel)
7. Add destination-specific toiletries and health items
8. Include practical items for the specific climate
9. Consider group size for shared items
10. Include children-specific items if applicable
11. Add special needs accommodations

Return a JSON array with this exact structure:
[
  {
    "name": "Specific item name",
    "category": "clothing|toiletries|electronics|documents|accessories|other",
    "essential": true/false,
    "quantity": number,
    "notes": "specific reason or tip for this item"
  }
]

Make items highly specific to the destination and activities. Include local considerations, weather-specific items, and practical necessities.`;
}

function generateFallbackSuggestions(tripDetails: TripDetails): AIPackingItem[] {
  const items: AIPackingItem[] = [];

  // Base essential items
  items.push(
    { name: 'Passport/ID', category: 'documents', essential: true, quantity: 1, notes: 'Required for travel' },
    { name: 'Credit Cards', category: 'documents', essential: true, quantity: 2, notes: 'Primary and backup' },
    {
      name: 'Cash (Local Currency)',
      category: 'documents',
      essential: true,
      quantity: 1,
      notes: 'For small purchases and tips',
    },
    {
      name: 'Phone Charger',
      category: 'electronics',
      essential: true,
      quantity: 1,
      notes: 'Essential for navigation and communication',
    },
    { name: 'Toothbrush & Toothpaste', category: 'toiletries', essential: true, quantity: 1, notes: 'Basic hygiene' },
    { name: 'Deodorant', category: 'toiletries', essential: true, quantity: 1, notes: 'Personal hygiene' },
    { name: 'Shampoo & Soap', category: 'toiletries', essential: true, quantity: 1, notes: 'Basic hygiene' },
  );

  // Duration-based clothing
  const clothingQuantity = Math.ceil(tripDetails.duration / 3);
  const underwearQuantity = Math.ceil(tripDetails.duration / 2);

  items.push(
    {
      name: 'T-shirts/Tops',
      category: 'clothing',
      essential: true,
      quantity: clothingQuantity,
      notes: `${clothingQuantity} changes for ${tripDetails.duration} days`,
    },
    {
      name: 'Underwear',
      category: 'clothing',
      essential: true,
      quantity: underwearQuantity,
      notes: `${underwearQuantity} pairs for ${tripDetails.duration} days`,
    },
    {
      name: 'Socks',
      category: 'clothing',
      essential: true,
      quantity: underwearQuantity,
      notes: `${underwearQuantity} pairs for ${tripDetails.duration} days`,
    },
    {
      name: 'Pants/Shorts',
      category: 'clothing',
      essential: true,
      quantity: Math.ceil(tripDetails.duration / 4),
      notes: 'Comfortable walking pants',
    },
    {
      name: 'Comfortable Walking Shoes',
      category: 'clothing',
      essential: true,
      quantity: 1,
      notes: 'Essential for sightseeing',
    },
  );

  // Climate-specific items
  if (tripDetails.climate === 'tropical') {
    items.push(
      {
        name: 'Sunscreen SPF 50+',
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'High SPF for tropical sun',
      },
      {
        name: 'Insect Repellent',
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'Protection against mosquitoes',
      },
      {
        name: 'Lightweight, Breathable Shirts',
        category: 'clothing',
        essential: true,
        quantity: clothingQuantity,
        notes: 'Cotton or moisture-wicking fabric',
      },
      { name: 'Wide-brimmed Hat', category: 'accessories', essential: true, quantity: 1, notes: 'Sun protection' },
      { name: 'Sunglasses', category: 'accessories', essential: true, quantity: 1, notes: 'UV protection' },
      { name: 'Swimsuit', category: 'clothing', essential: false, quantity: 1, notes: 'For beach or pool activities' },
      {
        name: 'Beach Towel',
        category: 'accessories',
        essential: false,
        quantity: 1,
        notes: 'If beach activities planned',
      },
    );
  } else if (tripDetails.climate === 'cold') {
    items.push(
      {
        name: 'Winter Coat/Jacket',
        category: 'clothing',
        essential: true,
        quantity: 1,
        notes: 'Warm, insulated jacket',
      },
      { name: 'Thermal Underwear', category: 'clothing', essential: true, quantity: 2, notes: 'Base layer for warmth' },
      { name: 'Winter Hat', category: 'clothing', essential: true, quantity: 1, notes: 'Warm hat for cold weather' },
      { name: 'Winter Gloves', category: 'clothing', essential: true, quantity: 1, notes: 'Insulated gloves' },
      { name: 'Scarf', category: 'clothing', essential: true, quantity: 1, notes: 'Neck protection from cold' },
      {
        name: 'Warm Socks',
        category: 'clothing',
        essential: true,
        quantity: underwearQuantity,
        notes: 'Thick, warm socks',
      },
      { name: 'Lip Balm', category: 'toiletries', essential: true, quantity: 1, notes: 'Prevent chapped lips' },
    );
  } else if (tripDetails.climate === 'desert') {
    items.push(
      {
        name: 'Long-sleeved Lightweight Shirts',
        category: 'clothing',
        essential: true,
        quantity: clothingQuantity,
        notes: 'Sun protection',
      },
      {
        name: 'Sunscreen SPF 50+',
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'High SPF for desert sun',
      },
      {
        name: 'Lip Balm with SPF',
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'Protect lips from sun',
      },
      { name: 'Wide-brimmed Hat', category: 'accessories', essential: true, quantity: 1, notes: 'Sun protection' },
      { name: 'Sunglasses', category: 'accessories', essential: true, quantity: 1, notes: 'UV protection' },
      {
        name: 'Water Bottle',
        category: 'accessories',
        essential: true,
        quantity: 1,
        notes: 'Stay hydrated in desert climate',
      },
    );
  } else {
    // temperate
    items.push(
      {
        name: 'Light Jacket/Sweater',
        category: 'clothing',
        essential: true,
        quantity: 1,
        notes: 'For cooler evenings',
      },
      { name: 'Sunscreen SPF 30+', category: 'toiletries', essential: false, quantity: 1, notes: 'Sun protection' },
      { name: 'Umbrella', category: 'accessories', essential: false, quantity: 1, notes: 'For rain protection' },
    );
  }

  // Activity-specific items
  if (tripDetails.activities.includes('hiking')) {
    items.push(
      {
        name: 'Hiking Boots',
        category: 'clothing',
        essential: true,
        quantity: 1,
        notes: 'Sturdy, waterproof hiking boots',
      },
      {
        name: 'Hiking Socks',
        category: 'clothing',
        essential: true,
        quantity: 2,
        notes: 'Moisture-wicking hiking socks',
      },
      { name: 'Hiking Pants', category: 'clothing', essential: true, quantity: 1, notes: 'Durable, quick-dry pants' },
      { name: 'Hiking Backpack', category: 'accessories', essential: true, quantity: 1, notes: '20-30L day pack' },
      {
        name: 'Water Bottle (1L+)',
        category: 'accessories',
        essential: true,
        quantity: 1,
        notes: 'Stay hydrated on trails',
      },
      {
        name: 'Trail Snacks',
        category: 'other',
        essential: true,
        quantity: 1,
        notes: 'Energy bars, nuts, dried fruit',
      },
      { name: 'Map/Compass or GPS', category: 'accessories', essential: true, quantity: 1, notes: 'Navigation tools' },
      { name: 'First Aid Kit', category: 'toiletries', essential: true, quantity: 1, notes: 'Basic medical supplies' },
    );
  }

  if (tripDetails.activities.includes('beach')) {
    items.push(
      { name: 'Swimsuit', category: 'clothing', essential: true, quantity: 1, notes: 'Beach activities' },
      { name: 'Beach Towel', category: 'accessories', essential: true, quantity: 1, notes: 'Quick-dry beach towel' },
      { name: 'Beach Bag', category: 'accessories', essential: true, quantity: 1, notes: 'Waterproof beach bag' },
      { name: 'Beach Umbrella', category: 'accessories', essential: false, quantity: 1, notes: 'Shade from sun' },
      {
        name: 'Beach Games',
        category: 'accessories',
        essential: false,
        quantity: 1,
        notes: 'Volleyball, frisbee, etc.',
      },
      { name: 'Water Shoes', category: 'clothing', essential: false, quantity: 1, notes: 'Protect feet from rocks' },
    );
  }

  if (tripDetails.activities.includes('skiing')) {
    items.push(
      {
        name: 'Ski Jacket',
        category: 'clothing',
        essential: true,
        quantity: 1,
        notes: 'Waterproof, insulated ski jacket',
      },
      {
        name: 'Ski Pants',
        category: 'clothing',
        essential: true,
        quantity: 1,
        notes: 'Waterproof, insulated ski pants',
      },
      { name: 'Thermal Underwear', category: 'clothing', essential: true, quantity: 2, notes: 'Base layer for warmth' },
      { name: 'Ski Gloves', category: 'clothing', essential: true, quantity: 1, notes: 'Insulated, waterproof gloves' },
      {
        name: 'Ski Goggles',
        category: 'accessories',
        essential: true,
        quantity: 1,
        notes: 'Eye protection from sun and snow',
      },
      { name: 'Ski Helmet', category: 'accessories', essential: true, quantity: 1, notes: 'Safety equipment' },
      { name: 'Ski Socks', category: 'clothing', essential: true, quantity: 2, notes: 'Thick, warm ski socks' },
      { name: 'Hand Warmers', category: 'accessories', essential: false, quantity: 1, notes: 'Extra warmth' },
    );
  }

  if (tripDetails.activities.includes('business')) {
    items.push(
      { name: 'Business Suit', category: 'clothing', essential: true, quantity: 1, notes: 'Professional attire' },
      { name: 'Dress Shirts', category: 'clothing', essential: true, quantity: 2, notes: 'Professional shirts' },
      { name: 'Dress Shoes', category: 'clothing', essential: true, quantity: 1, notes: 'Professional footwear' },
      { name: 'Tie', category: 'clothing', essential: false, quantity: 1, notes: 'Professional accessory' },
      { name: 'Laptop', category: 'electronics', essential: true, quantity: 1, notes: 'Work requirements' },
      { name: 'Business Cards', category: 'documents', essential: true, quantity: 1, notes: 'Networking' },
      {
        name: 'Portfolio/Briefcase',
        category: 'accessories',
        essential: false,
        quantity: 1,
        notes: 'Professional bag',
      },
    );
  }

  if (tripDetails.activities.includes('camping')) {
    items.push(
      { name: 'Tent', category: 'other', essential: true, quantity: 1, notes: 'Sleeping shelter' },
      { name: 'Sleeping Bag', category: 'other', essential: true, quantity: 1, notes: 'Warm sleeping bag' },
      { name: 'Sleeping Pad', category: 'other', essential: true, quantity: 1, notes: 'Ground insulation' },
      { name: 'Camping Stove', category: 'other', essential: true, quantity: 1, notes: 'Cooking equipment' },
      { name: 'Headlamp', category: 'accessories', essential: true, quantity: 1, notes: 'Hands-free lighting' },
      { name: 'Multi-tool', category: 'accessories', essential: true, quantity: 1, notes: 'Versatile tool' },
      { name: 'Camping Cookware', category: 'other', essential: true, quantity: 1, notes: 'Pots, pans, utensils' },
    );
  }

  // Accommodation-specific items
  if (tripDetails.accommodation === 'camping') {
    items.push(
      { name: 'Tent', category: 'other', essential: true, quantity: 1, notes: 'Sleeping shelter' },
      { name: 'Sleeping Bag', category: 'other', essential: true, quantity: 1, notes: 'Warm sleeping bag' },
    );
  } else if (tripDetails.accommodation === 'hostel') {
    items.push(
      {
        name: 'Sleeping Bag Liner',
        category: 'other',
        essential: true,
        quantity: 1,
        notes: 'Hygiene in shared accommodation',
      },
      { name: 'Padlock', category: 'accessories', essential: true, quantity: 1, notes: 'Secure belongings' },
      { name: 'Earplugs', category: 'accessories', essential: true, quantity: 1, notes: 'Sleep in shared rooms' },
      { name: 'Eye Mask', category: 'accessories', essential: false, quantity: 1, notes: 'Block light for sleep' },
    );
  }

  // Children-specific items
  if (tripDetails.includesChildren) {
    items.push(
      {
        name: "Children's Medications",
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'Fever reducer, pain reliever',
      },
      {
        name: "Children's Entertainment",
        category: 'accessories',
        essential: true,
        quantity: 1,
        notes: 'Books, games, tablets',
      },
      { name: "Children's Snacks", category: 'other', essential: true, quantity: 1, notes: 'Healthy snacks for kids' },
      {
        name: "Children's Sunscreen",
        category: 'toiletries',
        essential: true,
        quantity: 1,
        notes: 'Kid-friendly sunscreen',
      },
      {
        name: "Children's Clothing (Extra)",
        category: 'clothing',
        essential: true,
        quantity: Math.ceil(tripDetails.duration / 2),
        notes: 'Kids need more changes',
      },
    );
  }

  // Special needs
  tripDetails.specialNeeds.forEach((need) => {
    if (need.toLowerCase().includes('medical')) {
      items.push(
        {
          name: 'Prescription Medications',
          category: 'toiletries',
          essential: true,
          quantity: 1,
          notes: 'Medical requirements',
        },
        {
          name: 'Medical Documentation',
          category: 'documents',
          essential: true,
          quantity: 1,
          notes: "Doctor's notes, prescriptions",
        },
      );
    }

    if (need.toLowerCase().includes('dietary')) {
      items.push(
        { name: 'Special Dietary Snacks', category: 'other', essential: true, quantity: 1, notes: 'Safe food options' },
        {
          name: 'Dietary Restrictions Card',
          category: 'documents',
          essential: true,
          quantity: 1,
          notes: 'Explain dietary needs in local language',
        },
      );
    }

    if (need.toLowerCase().includes('accessibility')) {
      items.push(
        {
          name: 'Mobility Aids',
          category: 'accessories',
          essential: true,
          quantity: 1,
          notes: 'Required mobility equipment',
        },
        {
          name: 'Accessibility Information',
          category: 'documents',
          essential: true,
          quantity: 1,
          notes: 'Accessibility requirements documentation',
        },
      );
    }
  });

  // Electronics and accessories
  items.push(
    { name: 'Power Bank', category: 'electronics', essential: false, quantity: 1, notes: 'Backup phone charging' },
    { name: 'Camera', category: 'electronics', essential: false, quantity: 1, notes: 'Capture memories' },
    {
      name: 'Universal Adapter',
      category: 'electronics',
      essential: false,
      quantity: 1,
      notes: 'International travel',
    },
    { name: 'Travel Pillow', category: 'accessories', essential: false, quantity: 1, notes: 'Comfort during travel' },
    {
      name: 'Books/Magazines',
      category: 'accessories',
      essential: false,
      quantity: 1,
      notes: 'Entertainment during downtime',
    },
  );

  return items.map((item) => ({
    ...item,
    aiSuggested: false,
  }));
}
