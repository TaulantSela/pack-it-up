'use client';

import { PackingItem } from '@/lib/types';
import {
  CheckCircle,
  Circle,
  Download,
  Droplets,
  FileText,
  Package,
  Plus,
  Printer,
  Shirt,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
  clothing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  toiletries: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  electronics: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  documents: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  accessories: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function PackingList({ items, tripId }: PackingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showOnlyEssential, setShowOnlyEssential] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allItems, setAllItems] = useState<PackingItem[]>(items);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemEssential, setNewItemEssential] = useState(false);
  const [newItemNotes, setNewItemNotes] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryFirstItem, setNewCategoryFirstItem] = useState('');
  const [newCategoryQuantity, setNewCategoryQuantity] = useState(1);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // Load progress from database
  useEffect(() => {
    const loadProgress = async () => {
      console.log('Loading progress for trip:', tripId);
      try {
        const response = await fetch(`/api/trips/${tripId}/progress`);
        if (response.ok) {
          const data = await response.json();
          const checkedSet = new Set<string>(data.progress.filter((p: any) => p.checked).map((p: any) => p.itemId));
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

  // Update allItems when items prop changes
  useEffect(() => {
    setAllItems(items);
  }, [items]);

  const filteredItems = showOnlyEssential ? allItems.filter((item) => item.essential) : allItems;

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>,
  );

  const totalItems = allItems.length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const handleAddItem = async (category: string) => {
    if (!newItemName.trim()) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          category,
          quantity: newItemQuantity,
          notes: newItemNotes.trim() || null,
          essential: newItemEssential,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAllItems([...allItems, data.item]);
        // Reset form
        setNewItemName('');
        setNewItemQuantity(1);
        setNewItemEssential(false);
        setNewItemNotes('');
        setAddingToCategory(null);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        setAllItems(allItems.filter((item) => item.id !== itemId));
        // Remove from checked items if it was checked
        const newChecked = new Set(checkedItems);
        newChecked.delete(itemId);
        setCheckedItems(newChecked);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryFirstItem.trim()) {
      alert('Please provide both a category name and first item name.');
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryFirstItem.trim(),
          category: newCategoryName.trim().toLowerCase(),
          quantity: newCategoryQuantity,
          notes: null,
          essential: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAllItems([...allItems, data.item]);
        // Reset form
        setNewCategoryName('');
        setNewCategoryFirstItem('');
        setNewCategoryQuantity(1);
        setShowAddCategory(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        setAllItems(allItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)));
        setEditingQuantity(null);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const listText = allItems
      .map((item) => `${item.name} (${item.quantity}x)${item.essential ? ' *ESSENTIAL*' : ''}`)
      .join('\n');

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Packing List</h2>
          <div className="flex items-center space-x-4">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyEssential}
                onChange={(e) => setShowOnlyEssential(e.target.checked)}
                className="text-primary-600 focus:ring-primary-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-800 dark:text-gray-100">Show essential only</span>
            </label>
            <button onClick={handleExport} className="btn-secondary flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button onClick={handlePrint} className="btn-secondary flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-200">
            <span>
              Progress: {checkedCount} of {totalItems} items packed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Category Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAddCategory(!showAddCategory)}
          className="btn-secondary flex items-center space-x-2"
        >
          {showAddCategory ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Custom Category</span>
            </>
          )}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="card border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Create New Category</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-100">
                Category Name *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Sports Equipment, Baby Items, Work"
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-100">
                First Item in This Category *
              </label>
              <input
                type="text"
                value={newCategoryFirstItem}
                onChange={(e) => setNewCategoryFirstItem(e.target.value)}
                placeholder="e.g., Tennis Racket, Diapers, Laptop"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-100">Quantity</label>
              <input
                type="number"
                value={newCategoryQuantity}
                onChange={(e) => setNewCategoryQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="input-field"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddCategory}
                className="btn-primary flex-1"
                disabled={!newCategoryName.trim() || !newCategoryFirstItem.trim()}
              >
                Create Category
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                  setNewCategoryFirstItem('');
                  setNewCategoryQuantity(1);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packing List by Category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || Package;
          const colorClass = categoryColors[category as keyof typeof categoryColors] || categoryColors.other;

          return (
            <div key={category} className="card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                  <h3 className="text-lg font-semibold text-gray-900 capitalize dark:text-white">{category}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
                    {categoryItems.length} items
                  </span>
                </div>
                <button
                  onClick={() => setAddingToCategory(addingToCategory === category ? null : category)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1 text-sm"
                >
                  {addingToCategory === category ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => {
                  const isChecked = checkedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 rounded-lg border p-3 transition-all duration-200 ${
                        isChecked
                          ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        disabled={isLoading}
                        className="flex-shrink-0 disabled:opacity-50"
                      >
                        {isChecked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-medium ${isChecked ? 'text-gray-500 line-through dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}
                          >
                            {item.name}
                          </span>
                          {item.essential && <Star className="h-4 w-4 fill-current text-yellow-500" />}
                          {item.aiSuggested && (
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              AI
                            </span>
                          )}
                        </div>
                        {item.notes && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.notes}</p>}
                      </div>

                      <div className="flex items-center space-x-2">
                        {editingQuantity === item.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={tempQuantity}
                              onChange={(e) => setTempQuantity(parseInt(e.target.value) || 1)}
                              onBlur={() => {
                                handleUpdateQuantity(item.id, tempQuantity);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateQuantity(item.id, tempQuantity);
                                } else if (e.key === 'Escape') {
                                  setEditingQuantity(null);
                                }
                              }}
                              min="1"
                              max="99"
                              className="border-primary-400 dark:border-primary-500 focus:ring-primary-500 w-16 rounded border bg-white px-2 py-1 text-center text-sm font-medium text-gray-900 focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingQuantity(item.id);
                              setTempQuantity(item.quantity);
                            }}
                            className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            title="Click to edit quantity"
                          >
                            {item.quantity}x
                          </button>
                        )}
                        {!item.aiSuggested && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete custom item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Item Form */}
                {addingToCategory === category && (
                  <div className="border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-dashed p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Add Custom Item</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="e.g., Sunscreen, Passport"
                          className="input-field text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex cursor-pointer items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newItemEssential}
                              onChange={(e) => setNewItemEssential(e.target.checked)}
                              className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-400 dark:border-gray-500 dark:bg-gray-700"
                            />
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-100">Essential</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={newItemNotes}
                          onChange={(e) => setNewItemNotes(e.target.value)}
                          placeholder="Any special notes"
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddItem(category)}
                          className="btn-primary flex-1 text-sm"
                          disabled={!newItemName.trim()}
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => {
                            setAddingToCategory(null);
                            setNewItemName('');
                            setNewItemQuantity(1);
                            setNewItemEssential(false);
                            setNewItemNotes('');
                          }}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</div>
            <div className="text-gray-600 dark:text-gray-300">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {allItems.filter((item) => item.essential).length}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Essential Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{checkedCount}</div>
            <div className="text-gray-600 dark:text-gray-300">Packed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalItems - checkedCount}</div>
            <div className="text-gray-600 dark:text-gray-300">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}
