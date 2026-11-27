'use client';

import { isSharedItem, MAX_TICKED_TRAVELERS, parseTravelers, tickKey, travelerLabel } from '@/lib/travelers';
import { PackingItem } from '@/lib/types';
import { pluralize } from '@/lib/utils';
import {
  Check,
  CheckCircle,
  Circle,
  CircleDot,
  Download,
  Droplets,
  FileText,
  Minus,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Shirt,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { MouseEvent, SyntheticEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface PackingListProps {
  items: PackingItem[];
  tripId: string;
  groupSize?: number;
  // JSON array of traveler names; null for trips from before per-person ticks
  travelers?: string | null;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  // tickKey(itemId, person) for every tick
  initialTicks?: string[];
  onGuestToggleItem?: (itemId: string, persons: number[], checked: boolean) => void;
  onGuestResetProgress?: () => void;
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

export default function PackingList({
  items,
  tripId,
  groupSize = 1,
  travelers,
  isGuest = false,
  onRequireAuth,
  initialTicks,
  onGuestToggleItem,
  onGuestResetProgress,
}: PackingListProps) {
  // The AI and the built-in list count personal items per person; shared items' notes start with "Shared:"
  const quantityNote =
    groupSize > 1
      ? `For ${pluralize(groupSize, 'person', 'people')}: quantities are per person. Items marked “Shared” are one for the whole group.`
      : null;
  // One tick per traveler for personal items on group trips; one tick per item otherwise
  const travelerNames = useMemo(() => parseTravelers(travelers, groupSize), [travelers, groupSize]);
  const perPerson = travelerNames !== null && groupSize > 1;
  const useCounter = perPerson && groupSize > MAX_TICKED_TRAVELERS;
  const everyone = useMemo(() => Array.from({ length: groupSize }, (_, i) => i), [groupSize]);
  const [ticks, setTicks] = useState<Set<string>>(new Set());
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
  const [hasShownGuestNotice, setHasShownGuestNotice] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const notifyGuestRestriction = () => {
    onRequireAuth?.();
    if (!hasShownGuestNotice) {
      setHasShownGuestNotice(true);
    }
  };

  const isPreventedTarget = (target: EventTarget | null, currentTarget: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || !(currentTarget instanceof HTMLElement)) {
      return false;
    }
    const interactive = target.closest('[data-prevent-card-toggle="true"]');
    if (!interactive) {
      return false;
    }
    return interactive !== currentTarget;
  };

  const handleCardClick = (event: MouseEvent<HTMLDivElement>, item: PackingItem) => {
    if (isPreventedTarget(event.target, event.currentTarget)) {
      return;
    }
    toggleItem(item);
  };

  const handleCardPointerCapture = (event: SyntheticEvent<HTMLDivElement>) => {
    if (isPreventedTarget(event.target, event.currentTarget)) {
      event.stopPropagation();
    }
  };

  // Load progress from database
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}/progress`);
        if (response.ok) {
          const data: { progress: { itemId: string; person?: number; checked: boolean }[] } = await response.json();
          setTicks(
            new Set(data.progress.filter((p) => p.checked).map((p) => tickKey(p.itemId, p.person ?? 0))),
          );
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (tripId && !isGuest) {
      loadProgress();
    }
  }, [tripId, isGuest]);

  // A guest's ticks live in the parent's session copy: mirror them, adjusting state during render
  // (it converges, since after this update they match) instead of an extra effect pass
  const guestKeys = initialTicks ?? [];
  if (isGuest && !(guestKeys.length === ticks.size && guestKeys.every((key) => ticks.has(key)))) {
    setTicks(new Set(guestKeys));
  }

  // The travelers who tick an item: everyone for personal items on group trips, else one tick
  const personsFor = (item: PackingItem) => (perPerson && !isSharedItem(item.notes) ? everyone : [0]);
  const tickedPersons = (item: PackingItem) => personsFor(item).filter((person) => ticks.has(tickKey(item.id, person)));
  const isPacked = (item: PackingItem) => tickedPersons(item).length === personsFor(item).length;

  const setItemTicks = async (itemId: string, persons: number[], checked: boolean) => {
    const keys = persons.map((person) => tickKey(itemId, person));
    const before = new Map(keys.map((key) => [key, ticks.has(key)]));
    const apply = (entries: [string, boolean][]) =>
      setTicks((current) => {
        const next = new Set(current);
        for (const [key, on] of entries) {
          if (on) next.add(key);
          else next.delete(key);
        }
        return next;
      });

    apply(keys.map((key) => [key, checked]));

    if (isGuest) {
      onGuestToggleItem?.(itemId, persons, checked);
      notifyGuestRestriction();
      return;
    }

    // Save to database
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${tripId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, persons, checked }),
      });

      if (!response.ok) {
        throw new Error(`Progress update failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert only these ticks, other toggles may have happened meanwhile
      apply([...before.entries()]);
      setActionError('Couldn’t save that change. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // The big tick packs or unpacks the item for everyone
  const toggleItem = (item: PackingItem) => setItemTicks(item.id, personsFor(item), !isPacked(item));

  const togglePerson = (item: PackingItem, person: number) =>
    setItemTicks(item.id, [person], !ticks.has(tickKey(item.id, person)));

  // Counter for big groups: + ticks the next traveler, - unticks the last one
  const changeCount = (item: PackingItem, delta: 1 | -1) => {
    const ticked = tickedPersons(item);
    const person = delta > 0 ? personsFor(item).find((p) => !ticked.includes(p)) : ticked[ticked.length - 1];
    if (person !== undefined) setItemTicks(item.id, [person], delta > 0);
  };

  // Reset allItems when the items prop changes (React's "adjust state when a prop changes" pattern)
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setAllItems(items);
  }

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
  // Count only items that still exist, older trips can have progress for deleted items
  const checkedCount = allItems.filter(isPacked).length;
  // The bar counts every tick, so one of two passports packed is half of that item
  const tickTotal = allItems.reduce((sum, item) => sum + personsFor(item).length, 0);
  const tickDone = allItems.reduce((sum, item) => sum + tickedPersons(item).length, 0);
  const progress = tickTotal > 0 ? (tickDone / tickTotal) * 100 : 0;
  const personalItems = allItems.filter((item) => !isSharedItem(item.notes));
  const sharedItems = allItems.filter((item) => isSharedItem(item.notes));

  const handleAddItem = async (category: string) => {
    if (isGuest) {
      notifyGuestRestriction();
      return;
    }

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

      if (!response.ok) {
        throw new Error(`Add item failed: ${response.status}`);
      }

      const data = await response.json();
      setAllItems([...allItems, data.item]);
      // Reset form
      setNewItemName('');
      setNewItemQuantity(1);
      setNewItemEssential(false);
      setNewItemNotes('');
      setAddingToCategory(null);
    } catch (error) {
      console.error('Error adding item:', error);
      setActionError('Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (isGuest) {
      notifyGuestRestriction();
      return;
    }

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) {
        throw new Error(`Delete item failed: ${response.status}`);
      }

      setAllItems(allItems.filter((item) => item.id !== itemId));
      // Remove its ticks
      setTicks((current) => new Set([...current].filter((key) => !key.startsWith(`${itemId}#`))));
    } catch (error) {
      console.error('Error deleting item:', error);
      setActionError('Failed to delete item. Please try again.');
    }
  };

  const handleAddCategory = async () => {
    if (isGuest) {
      notifyGuestRestriction();
      return;
    }

    if (!newCategoryName.trim() || !newCategoryFirstItem.trim()) {
      setActionError('Please provide both a category name and first item name.');
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

      if (!response.ok) {
        throw new Error(`Add category failed: ${response.status}`);
      }

      const data = await response.json();
      setAllItems([...allItems, data.item]);
      // Reset form
      setNewCategoryName('');
      setNewCategoryFirstItem('');
      setNewCategoryQuantity(1);
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
      setActionError('Failed to add category. Please try again.');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (isGuest) {
      notifyGuestRestriction();
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error(`Update quantity failed: ${response.status}`);
      }

      setAllItems(allItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)));
      setEditingQuantity(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setActionError('Failed to update quantity. Please try again.');
    }
  };

  const handleUncheckAll = async () => {
    if (!confirm('Uncheck everything on this list?')) return;

    if (isGuest) {
      setTicks(new Set());
      onGuestResetProgress?.();
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${tripId}/progress`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`Reset progress failed: ${response.status}`);
      }

      setTicks(new Set());
    } catch (error) {
      console.error('Error resetting progress:', error);
      setActionError('Couldn’t uncheck the items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const lines = allItems.map(
      (item) =>
        `${item.name} (${item.quantity}x)${item.essential ? ' *ESSENTIAL*' : ''}${item.notes ? ` - ${item.notes}` : ''}`,
    );
    const listText = (quantityNote ? [quantityNote, '', ...lines] : lines).join('\n');

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Packing List</h2>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyEssential}
                onChange={(e) => setShowOnlyEssential(e.target.checked)}
                className="text-primary-600 focus:ring-primary-500 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-800 dark:text-gray-100">Show essential only</span>
            </label>
            {tickDone > 0 && (
              <button
                onClick={handleUncheckAll}
                disabled={isLoading && !isGuest}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Uncheck all</span>
              </button>
            )}
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

        {quantityNote && (
          <p className="mb-4 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Users className="text-primary-600 dark:text-primary-400 mt-0.5 h-4 w-4 shrink-0" />
            <span>{quantityNote}</span>
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-sm text-gray-700 dark:text-gray-200">
            <span>
              Progress: {checkedCount} of {pluralize(totalItems, 'item')} packed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {perPerson && travelerNames && !useCounter && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              {everyone.map((person) => (
                <span key={person}>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    {travelerLabel(travelerNames, person)}
                  </strong>{' '}
                  {personalItems.filter((item) => ticks.has(tickKey(item.id, person))).length}/{personalItems.length}
                </span>
              ))}
              {sharedItems.length > 0 && (
                <span>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">Shared</strong>{' '}
                  {sharedItems.filter(isPacked).length}/{sharedItems.length}
                </span>
              )}
            </div>
          )}
        </div>

        {actionError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200 print:hidden"
          >
            <p>{actionError}</p>
            <button onClick={() => setActionError(null)} aria-label="Dismiss error" className="shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add Category Button */}
      <div className="flex justify-center print:hidden">
        <button
          onClick={() => {
            if (isGuest) {
              notifyGuestRestriction();
              return;
            }
            setShowAddCategory(!showAddCategory);
          }}
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
        <div className="card border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed print:hidden">
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
                    {pluralize(categoryItems.length, 'item')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (isGuest) {
                      notifyGuestRestriction();
                      return;
                    }
                    setAddingToCategory(addingToCategory === category ? null : category);
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1 text-sm print:hidden"
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
                  const isChecked = isPacked(item);
                  const persons = personsFor(item);
                  const ticked = tickedPersons(item);
                  const isPartial = !isChecked && ticked.length > 0;

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleCardClick(event, item)}
                      onMouseDownCapture={handleCardPointerCapture}
                      onTouchStartCapture={handleCardPointerCapture}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleItem(item);
                        }
                      }}
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-all duration-200 ${
                        isChecked
                          ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-gray-500'
                      }`}
                    >
                      <button
                        data-prevent-card-toggle="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleItem(item);
                        }}
                        disabled={isLoading && !isGuest}
                        aria-label={persons.length > 1 ? `Packed ${item.name} for everyone` : `Packed ${item.name}`}
                        aria-pressed={isChecked}
                        className="flex-shrink-0 disabled:opacity-50"
                      >
                        {isChecked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : isPartial ? (
                          <CircleDot className="h-5 w-5 text-amber-500 dark:text-amber-400" />
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
                        </div>
                        {item.notes && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.notes}</p>}
                        {persons.length > 1 && travelerNames && (
                          <div
                            className="mt-2 flex flex-wrap items-center gap-2"
                            data-prevent-card-toggle="true"
                            onClick={(event) => event.stopPropagation()}
                            onTouchStart={(event) => event.stopPropagation()}
                          >
                            {useCounter ? (
                              <>
                                <button
                                  data-prevent-card-toggle="true"
                                  onClick={() => changeCount(item, -1)}
                                  disabled={(isLoading && !isGuest) || ticked.length === 0}
                                  aria-label={`One fewer ${item.name} packed`}
                                  className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                  {ticked.length}/{persons.length} packed
                                </span>
                                <button
                                  data-prevent-card-toggle="true"
                                  onClick={() => changeCount(item, 1)}
                                  disabled={(isLoading && !isGuest) || isChecked}
                                  aria-label={`One more ${item.name} packed`}
                                  className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              persons.map((person) => {
                                const isTicked = ticked.includes(person);
                                const label = travelerLabel(travelerNames, person);
                                return (
                                  <button
                                    key={person}
                                    data-prevent-card-toggle="true"
                                    onClick={() => togglePerson(item, person)}
                                    disabled={isLoading && !isGuest}
                                    aria-pressed={isTicked}
                                    aria-label={`${label} packed ${item.name}`}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                      isTicked
                                        ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200'
                                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {isTicked ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                    {label}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center space-x-2"
                        data-prevent-card-toggle="true"
                        onClick={(event) => event.stopPropagation()}
                        onTouchStart={(event) => event.stopPropagation()}
                      >
                        {editingQuantity === item.id ? (
                          <div className="flex items-center space-x-1" data-prevent-card-toggle="true">
                            <input
                              type="number"
                              value={tempQuantity}
                              data-prevent-card-toggle="true"
                              onClick={(event) => event.stopPropagation()}
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
                            data-prevent-card-toggle="true"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (isGuest) {
                                notifyGuestRestriction();
                                return;
                              }
                              setEditingQuantity(item.id);
                              setTempQuantity(item.quantity);
                            }}
                            className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            title="Click to edit quantity"
                          >
                            {item.quantity}x
                          </button>
                        )}
                        <button
                          data-prevent-card-toggle="true"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          className="text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 print:hidden"
                          title="Delete item"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Item Form */}
                {addingToCategory === category && (
                  <div className="border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-2 border-dashed p-4 print:hidden">
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
