'use client';

import { useState, useEffect } from 'react';
import { SavedPackingList } from '@/lib/storage';
import { getPackingListHistory, deletePackingList } from '@/lib/storage';
import { 
  History, 
  MapPin, 
  Calendar, 
  Users, 
  Trash2, 
  Eye, 
  Copy,
  Clock
} from 'lucide-react';

interface PackingHistoryProps {
  onLoadList: (tripDetails: any, items: any[]) => void;
  onClose: () => void;
}

export default function PackingHistory({ onLoadList, onClose }: PackingHistoryProps) {
  const [history, setHistory] = useState<SavedPackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = getPackingListHistory();
      setHistory(savedHistory);
      setIsLoading(false);
    };

    loadHistory();
  }, []);

  const handleDelete = (id: string) => {
    deletePackingList(id);
    setHistory(prev => prev.filter(list => list.id !== id));
  };

  const handleLoad = (list: SavedPackingList) => {
    onLoadList(list.tripDetails, list.items);
    onClose();
  };

  const handleDuplicate = (list: SavedPackingList) => {
    const newList = {
      ...list,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: `${list.name} (Copy)`,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    
    // Save the duplicated list
    const currentHistory = getPackingListHistory();
    currentHistory.unshift(newList);
    localStorage.setItem('pack-it-up-history', JSON.stringify(currentHistory.slice(0, 20)));
    
    setHistory(prev => [newList, ...prev]);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Packing List History</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-600">
                Your packing lists will appear here once you create them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((list) => (
                <div
                  key={list.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{list.name}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{list.tripDetails.destination}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{list.tripDetails.duration} days</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{list.tripDetails.groupSize} people</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Created: {formatDate(list.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{list.items.length} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleLoad(list)}
                        className="btn-primary text-sm px-3 py-1"
                        title="Load this list"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(list)}
                        className="btn-secondary text-sm px-3 py-1"
                        title="Duplicate this list"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 transition-colors"
                        title="Delete this list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 