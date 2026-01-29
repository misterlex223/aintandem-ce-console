/**
 * Context Search Dialog
 *
 * Quick context search overlay (Cmd+K style) for selecting memories to inject into tasks.
 * Features: instant semantic search, keyboard navigation, multi-select, preview pane.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Memory, MEMORY_TYPE_INFO, MEMORY_VISIBILITY_INFO } from '@/types/context';
import { searchMemories } from '@/lib/context-api';
import { Search, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { getMemoryType, getMemoryContent, getMemorySummary } from '@/lib/memory-adapters';

export interface ContextSearchDialogProps {
  projectId: string;
  onSelectMemories: (memories: Memory[]) => void;
  isOpen: boolean;
  onClose: () => void;
  maxSelect?: number;
  preselected?: Memory[];
}

export function ContextSearchDialog({
  projectId,
  onSelectMemories,
  isOpen,
  onClose,
  maxSelect = 10,
  preselected = [],
}: ContextSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Memory[]>([]);
  const [selectedMemories, setSelectedMemories] = useState<Memory[]>(preselected);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize selected memories from preselected
  useEffect(() => {
    setSelectedMemories(preselected);
  }, [preselected]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await searchMemories({
          query,
          scope: 'project',
          scope_id: projectId,
          limit: 20,
          include_inherited: true,
        });
        setSearchResults(response.results);
        setSelectedIndex(0); // Reset selection
      } catch (error) {
        console.error('Failed to search context:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, projectId]);

  // Toggle memory selection
  const toggleMemory = useCallback((memory: Memory) => {
    setSelectedMemories(prev => {
      const isSelected = prev.some(m => m.id === memory.id);
      if (isSelected) {
        return prev.filter(m => m.id !== memory.id);
      } else {
        if (prev.length >= maxSelect) {
          // Max selection reached
          return prev;
        }
        return [...prev, memory];
      }
    });
  }, [maxSelect]);

  // Check if memory is selected
  const isSelected = useCallback((memoryId: string) => {
    return selectedMemories.some(m => m.id === memoryId);
  }, [selectedMemories]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      break;
    case 'Enter':
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        toggleMemory(searchResults[selectedIndex]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      onClose();
      break;
    }
  }, [searchResults, selectedIndex, toggleMemory, onClose]);

  // Handle confirm
  const handleConfirm = () => {
    onSelectMemories(selectedMemories);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Search Context</span>
            <span className="text-sm font-normal text-gray-500">
              {selectedMemories.length}/{maxSelect} selected
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for context... (e.g., 'authentication API')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                {query ? 'No results found' : 'Enter a search query'}
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((memory, index) => {
                  const memoryType = getMemoryType(memory);
                  const typeInfo = MEMORY_TYPE_INFO[memoryType] || MEMORY_TYPE_INFO.knowledge;
                  const visibilityInfo = MEMORY_VISIBILITY_INFO[memory.metadata.visibility || 'workspace'];
                  const selected = isSelected(memory.id);
                  const highlighted = index === selectedIndex;

                  return (
                    <div
                      key={memory.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        highlighted ? 'bg-blue-50' : selected ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleMemory(memory)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <div className="mt-1">
                          {selected ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.icon} {typeInfo.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {visibilityInfo.icon} {visibilityInfo.label}
                            </Badge>
                            {memory.score && (
                              <span className="text-xs text-gray-500">
                                {(memory.score * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>

                          {/* Summary */}
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {getMemorySummary(memory)}
                          </div>

                          {/* Content Preview */}
                          <div className="text-xs text-gray-600 line-clamp-2">
                            {getMemoryContent(memory)}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-2 mt-2">
                            {memory.metadata.tags?.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-gray-600">
              {selectedMemories.length > 0 && (
                <span>{selectedMemories.length} context{selectedMemories.length > 1 ? 's' : ''} selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectedMemories.length === 0}>
                Add Context ({selectedMemories.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
