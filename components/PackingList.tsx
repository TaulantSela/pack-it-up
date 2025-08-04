'use client';

import { useState, useEffect } from 'react';
import { PackingItem } from '@/lib/types';
import { 
  CheckCircle, 
  Circle, 
  Package, 
  Shirt, 
  Droplets, 
  Zap, 
  FileText, 
  Star,
  Download,
  Printer
} from 'lucide-react';

interface PackingListProps {
  items: PackingItem[];
  tripId: string;
}

const categoryIcons = {
  clothing: Shirt,
  toiletries: Droplets,
  electronics: Zap,
  documents: FileText,
  accessories: Package,
  other: Package,
};

const categoryColors = {
  clothing: 'bg-blue-100 text-blue-800',
  toiletries: 'bg-green-100 text-green-800',
  electronics: 'bg-purple-100 text-purple-800',
  documents: 'bg-red-100 text-red-800',
  accessories: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function PackingList({ items, tripId }: PackingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showOnlyEssential, setShowOnlyEssential] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load progress from database
  useEffect(() => {
    const loadProgress = async () => {
      console.log('Loading progress for trip:', tripId);
      try {
        const response = await fetch(`/api/trips/${tripId}/progress`);
        if (response.ok) {
          const data = await response.json();
          const checkedSet = new Set<string>(
            data.progress
              .filter((p: any) => p.checked)
              .map((p: any) => p.itemId)
          );
          setCheckedItems(checkedSet);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (tripId) {
      loadProgress();
    }
  }, [tripId]);

  const toggleItem = async (itemId: string) => {
    const newChecked = new Set(checkedItems);
    const isChecked = newChecked.has(itemId);
    
    if (isChecked) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    
    setCheckedItems(newChecked);

    // Save to database
    try {
      setIsLoading(true);
      await fetch(`/api/trips/${tripId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          checked: !isChecked,
        }),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert the UI change if the API call failed
      setCheckedItems(checkedItems);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = showOnlyEssential 
    ? items.filter(item => item.essential)
    : items;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);

  const totalItems = items.length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const listText = items.map(item => 
      `${item.name} (${item.quantity}x)${item.essential ? ' *ESSENTIAL*' : ''}`
    ).join('\n');
    
    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'packing-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Packing List</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyEssential}
                onChange={(e) => setShowOnlyEssential(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Show essential only</span>
            </label>
            <button onClick={handleExport} className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button onClick={handlePrint} className="btn-secondary flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {checkedCount} of {totalItems} items packed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Packing List by Category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const colorClass = categoryColors[category as keyof typeof categoryColors];
          
          return (
            <div key={category} className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Icon className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {category}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                  {categoryItems.length} items
                </span>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => {
                  const isChecked = checkedItems.has(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        isChecked 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        disabled={isLoading}
                        className="flex-shrink-0 disabled:opacity-50"
                      >
                        {isChecked ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          {item.essential && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
                          {item.aiSuggested && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              AI
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {item.quantity}x
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
            <div className="text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(item => item.essential).length}
            </div>
            <div className="text-gray-600">Essential Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{checkedCount}</div>
            <div className="text-gray-600">Packed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalItems - checkedCount}</div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
} 