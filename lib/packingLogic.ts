import { TripDetails, PackingItem } from './types';

const baseItems: PackingItem[] = [
  // Clothing
  { id: '1', name: 'Underwear', category: 'clothing', essential: true, quantity: 1 },
  { id: '2', name: 'Socks', category: 'clothing', essential: true, quantity: 1 },
  { id: '3', name: 'T-shirts', category: 'clothing', essential: true, quantity: 1 },
  { id: '4', name: 'Pants/Shorts', category: 'clothing', essential: true, quantity: 1 },
  { id: '5', name: 'Pajamas', category: 'clothing', essential: false, quantity: 1 },
  { id: '6', name: 'Swimwear', category: 'clothing', essential: false, quantity: 1 },
  { id: '7', name: 'Jacket/Sweater', category: 'clothing', essential: false, quantity: 1 },
  { id: '8', name: 'Formal Attire', category: 'clothing', essential: false, quantity: 1 },
  { id: '9', name: 'Rain Jacket', category: 'clothing', essential: false, quantity: 1 },
  { id: '10', name: 'Winter Coat', category: 'clothing', essential: false, quantity: 1 },
  { id: '11', name: 'Hiking Boots', category: 'clothing', essential: false, quantity: 1 },
  { id: '12', name: 'Comfortable Shoes', category: 'clothing', essential: true, quantity: 1 },
  { id: '13', name: 'Flip Flops', category: 'clothing', essential: false, quantity: 1 },

  // Toiletries
  { id: '14', name: 'Toothbrush', category: 'toiletries', essential: true, quantity: 1 },
  { id: '15', name: 'Toothpaste', category: 'toiletries', essential: true, quantity: 1 },
  { id: '16', name: 'Deodorant', category: 'toiletries', essential: true, quantity: 1 },
  { id: '17', name: 'Shampoo', category: 'toiletries', essential: true, quantity: 1 },
  { id: '18', name: 'Soap', category: 'toiletries', essential: true, quantity: 1 },
  { id: '19', name: 'Hair Brush', category: 'toiletries', essential: false, quantity: 1 },
  { id: '20', name: 'Razor', category: 'toiletries', essential: false, quantity: 1 },
  { id: '21', name: 'Sunscreen', category: 'toiletries', essential: false, quantity: 1 },
  { id: '22', name: 'Insect Repellent', category: 'toiletries', essential: false, quantity: 1 },
  { id: '23', name: 'First Aid Kit', category: 'toiletries', essential: false, quantity: 1 },
  { id: '24', name: 'Prescription Medications', category: 'toiletries', essential: false, quantity: 1 },

  // Electronics
  { id: '25', name: 'Phone Charger', category: 'electronics', essential: true, quantity: 1 },
  { id: '26', name: 'Power Bank', category: 'electronics', essential: false, quantity: 1 },
  { id: '27', name: 'Camera', category: 'electronics', essential: false, quantity: 1 },
  { id: '28', name: 'Laptop', category: 'electronics', essential: false, quantity: 1 },
  { id: '29', name: 'Universal Adapter', category: 'electronics', essential: false, quantity: 1 },

  // Documents
  { id: '30', name: 'Passport', category: 'documents', essential: true, quantity: 1 },
  { id: '31', name: 'Travel Insurance', category: 'documents', essential: false, quantity: 1 },
  { id: '32', name: 'Boarding Passes', category: 'documents', essential: true, quantity: 1 },
  { id: '33', name: 'Hotel Reservations', category: 'documents', essential: true, quantity: 1 },
  { id: '34', name: 'Credit Cards', category: 'documents', essential: true, quantity: 1 },
  { id: '35', name: 'Cash', category: 'documents', essential: true, quantity: 1 },

  // Accessories
  { id: '36', name: 'Backpack/Day Bag', category: 'accessories', essential: true, quantity: 1 },
  { id: '37', name: 'Water Bottle', category: 'accessories', essential: false, quantity: 1 },
  { id: '38', name: 'Sunglasses', category: 'accessories', essential: false, quantity: 1 },
  { id: '39', name: 'Hat/Cap', category: 'accessories', essential: false, quantity: 1 },
  { id: '40', name: 'Umbrella', category: 'accessories', essential: false, quantity: 1 },
  { id: '41', name: 'Travel Pillow', category: 'accessories', essential: false, quantity: 1 },
  { id: '42', name: 'Earplugs', category: 'accessories', essential: false, quantity: 1 },
  { id: '43', name: 'Eye Mask', category: 'accessories', essential: false, quantity: 1 },
  { id: '44', name: 'Books/Magazines', category: 'accessories', essential: false, quantity: 1 },
  { id: '45', name: 'Travel Games', category: 'accessories', essential: false, quantity: 1 },
];

const activityItems: Record<string, PackingItem[]> = {
  'hiking': [
    { id: 'h1', name: 'Hiking Boots', category: 'clothing', essential: true, quantity: 1 },
    { id: 'h2', name: 'Hiking Socks', category: 'clothing', essential: true, quantity: 2 },
    { id: 'h3', name: 'Hiking Pants', category: 'clothing', essential: true, quantity: 1 },
    { id: 'h4', name: 'Hiking Backpack', category: 'accessories', essential: true, quantity: 1 },
    { id: 'h5', name: 'Water Bottle', category: 'accessories', essential: true, quantity: 1 },
    { id: 'h6', name: 'Trail Snacks', category: 'other', essential: true, quantity: 1 },
    { id: 'h7', name: 'Map/Compass', category: 'accessories', essential: true, quantity: 1 },
  ],
  'beach': [
    { id: 'b1', name: 'Swimsuit', category: 'clothing', essential: true, quantity: 1 },
    { id: 'b2', name: 'Beach Towel', category: 'accessories', essential: true, quantity: 1 },
    { id: 'b3', name: 'Beach Umbrella', category: 'accessories', essential: false, quantity: 1 },
    { id: 'b4', name: 'Beach Bag', category: 'accessories', essential: true, quantity: 1 },
    { id: 'b5', name: 'Beach Games', category: 'accessories', essential: false, quantity: 1 },
  ],
  'skiing': [
    { id: 's1', name: 'Ski Jacket', category: 'clothing', essential: true, quantity: 1 },
    { id: 's2', name: 'Ski Pants', category: 'clothing', essential: true, quantity: 1 },
    { id: 's3', name: 'Thermal Underwear', category: 'clothing', essential: true, quantity: 2 },
    { id: 's4', name: 'Ski Gloves', category: 'clothing', essential: true, quantity: 1 },
    { id: 's5', name: 'Ski Goggles', category: 'accessories', essential: true, quantity: 1 },
    { id: 's6', name: 'Ski Helmet', category: 'accessories', essential: true, quantity: 1 },
    { id: 's7', name: 'Ski Socks', category: 'clothing', essential: true, quantity: 2 },
  ],
  'business': [
    { id: 'bus1', name: 'Business Suit', category: 'clothing', essential: true, quantity: 1 },
    { id: 'bus2', name: 'Dress Shirts', category: 'clothing', essential: true, quantity: 2 },
    { id: 'bus3', name: 'Dress Shoes', category: 'clothing', essential: true, quantity: 1 },
    { id: 'bus4', name: 'Tie', category: 'clothing', essential: false, quantity: 1 },
    { id: 'bus5', name: 'Laptop', category: 'electronics', essential: true, quantity: 1 },
    { id: 'bus6', name: 'Business Cards', category: 'documents', essential: true, quantity: 1 },
  ],
  'camping': [
    { id: 'c1', name: 'Tent', category: 'other', essential: true, quantity: 1 },
    { id: 'c2', name: 'Sleeping Bag', category: 'other', essential: true, quantity: 1 },
    { id: 'c3', name: 'Sleeping Pad', category: 'other', essential: true, quantity: 1 },
    { id: 'c4', name: 'Camping Stove', category: 'other', essential: true, quantity: 1 },
    { id: 'c5', name: 'Headlamp', category: 'accessories', essential: true, quantity: 1 },
    { id: 'c6', name: 'Multi-tool', category: 'accessories', essential: true, quantity: 1 },
  ],
};

export function generatePackingList(tripDetails: TripDetails): PackingItem[] {
  let items: PackingItem[] = [];

  // Add base items
  items.push(...baseItems);

  // Adjust quantities based on duration
  items = items.map(item => ({
    ...item,
    quantity: calculateQuantity(item, tripDetails.duration)
  }));

  // Add activity-specific items
  tripDetails.activities.forEach(activity => {
    const activityLower = activity.toLowerCase();
    if (activityItems[activityLower]) {
      items.push(...activityItems[activityLower]);
    }
  });

  // Add climate-specific items
  items.push(...getClimateItems(tripDetails.climate, tripDetails.season));

  // Add accommodation-specific items
  items.push(...getAccommodationItems(tripDetails.accommodation));

  // Add children-specific items
  if (tripDetails.includesChildren) {
    items.push(...getChildrenItems());
  }

  // Add special needs items
  tripDetails.specialNeeds.forEach(need => {
    const specialItems = getSpecialNeedsItems(need);
    items.push(...specialItems);
  });

  // Remove duplicates and merge quantities
  const uniqueItems = new Map<string, PackingItem>();
  items.forEach(item => {
    if (uniqueItems.has(item.name)) {
      const existing = uniqueItems.get(item.name)!;
      existing.quantity += item.quantity;
    } else {
      uniqueItems.set(item.name, { ...item, id: Math.random().toString(36).substr(2, 9) });
    }
  });

  return Array.from(uniqueItems.values());
}

function calculateQuantity(item: PackingItem, duration: number): number {
  if (item.category === 'clothing') {
    return Math.ceil(duration / 3); // Change clothes every 3 days
  }
  if (item.category === 'toiletries') {
    return Math.ceil(duration / 7); // Refill toiletries weekly
  }
  return item.quantity;
}

function getClimateItems(climate: string, season: string): PackingItem[] {
  const items: PackingItem[] = [];
  
  if (climate === 'tropical') {
    items.push(
      { id: 'trop1', name: 'Lightweight Clothing', category: 'clothing', essential: true, quantity: 1 },
      { id: 'trop2', name: 'Sunscreen SPF 50+', category: 'toiletries', essential: true, quantity: 1 },
      { id: 'trop3', name: 'Insect Repellent', category: 'toiletries', essential: true, quantity: 1 },
      { id: 'trop4', name: 'Wide-brimmed Hat', category: 'accessories', essential: true, quantity: 1 },
    );
  } else if (climate === 'cold') {
    items.push(
      { id: 'cold1', name: 'Thermal Underwear', category: 'clothing', essential: true, quantity: 2 },
      { id: 'cold2', name: 'Winter Hat', category: 'clothing', essential: true, quantity: 1 },
      { id: 'cold3', name: 'Winter Gloves', category: 'clothing', essential: true, quantity: 1 },
      { id: 'cold4', name: 'Scarf', category: 'clothing', essential: true, quantity: 1 },
    );
  } else if (climate === 'desert') {
    items.push(
      { id: 'des1', name: 'Lightweight, Long-sleeved Shirts', category: 'clothing', essential: true, quantity: 2 },
      { id: 'des2', name: 'Sunscreen SPF 50+', category: 'toiletries', essential: true, quantity: 1 },
      { id: 'des3', name: 'Lip Balm with SPF', category: 'toiletries', essential: true, quantity: 1 },
      { id: 'des4', name: 'Wide-brimmed Hat', category: 'accessories', essential: true, quantity: 1 },
    );
  }

  return items;
}

function getAccommodationItems(accommodation: string): PackingItem[] {
  const items: PackingItem[] = [];
  
  if (accommodation === 'camping') {
    items.push(
      { id: 'camp1', name: 'Tent', category: 'other', essential: true, quantity: 1 },
      { id: 'camp2', name: 'Sleeping Bag', category: 'other', essential: true, quantity: 1 },
      { id: 'camp3', name: 'Camping Stove', category: 'other', essential: true, quantity: 1 },
    );
  } else if (accommodation === 'hostel') {
    items.push(
      { id: 'host1', name: 'Sleeping Bag Liner', category: 'other', essential: true, quantity: 1 },
      { id: 'host2', name: 'Padlock', category: 'accessories', essential: true, quantity: 1 },
      { id: 'host3', name: 'Earplugs', category: 'accessories', essential: true, quantity: 1 },
    );
  }

  return items;
}

function getChildrenItems(): PackingItem[] {
  return [
    { id: 'child1', name: 'Diapers (if applicable)', category: 'toiletries', essential: true, quantity: 1 },
    { id: 'child2', name: 'Baby Wipes', category: 'toiletries', essential: true, quantity: 1 },
    { id: 'child3', name: 'Children\'s Medications', category: 'toiletries', essential: true, quantity: 1 },
    { id: 'child4', name: 'Children\'s Entertainment', category: 'accessories', essential: true, quantity: 1 },
    { id: 'child5', name: 'Children\'s Snacks', category: 'other', essential: true, quantity: 1 },
  ];
}

function getSpecialNeedsItems(need: string): PackingItem[] {
  const items: PackingItem[] = [];
  
  if (need.toLowerCase().includes('medical')) {
    items.push(
      { id: 'med1', name: 'Prescription Medications', category: 'toiletries', essential: true, quantity: 1 },
      { id: 'med2', name: 'Medical Documentation', category: 'documents', essential: true, quantity: 1 },
    );
  }
  
  if (need.toLowerCase().includes('dietary')) {
    items.push(
      { id: 'diet1', name: 'Special Dietary Snacks', category: 'other', essential: true, quantity: 1 },
      { id: 'diet2', name: 'Dietary Restrictions Card', category: 'documents', essential: true, quantity: 1 },
    );
  }
  
  if (need.toLowerCase().includes('accessibility')) {
    items.push(
      { id: 'acc1', name: 'Mobility Aids', category: 'accessories', essential: true, quantity: 1 },
      { id: 'acc2', name: 'Accessibility Information', category: 'documents', essential: true, quantity: 1 },
    );
  }

  return items;
} 