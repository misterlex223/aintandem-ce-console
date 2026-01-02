import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Sparkles, Info, FileText, X } from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';
import { toast } from 'sonner';
import { Memory } from '@/types/context';
import { ContextSearchDialog } from '../context/context-search-dialog';
import { getMemorySummary } from '@/lib/memory-adapters';

interface QuickTaskLauncherProps {
  projectId: string;
  onTaskStarted?: () => void;
  onAdvancedClick?: () => void;
}

export function QuickTaskLauncher({ projectId, onTaskStarted, onAdvancedClick }: QuickTaskLauncherProps) {
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedContextMemories, setSelectedContextMemories] = useState<Memory[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const handleExecute = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a task prompt');
      return;
    }

    try {
      setIsExecuting(true);
      const client = getClient();

      await client.tasks.executeAdhocTask({
        projectId,
        title: `Quick task: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
        prompt: prompt.trim(),
        contextMemoryIds: selectedContextMemories.map(m => m.id),
      });

      toast.success('Task started successfully');
      setPrompt(''); // Clear prompt after successful execution
      setSelectedContextMemories([]); // Clear selected context

      if (onTaskStarted) {
        onTaskStarted();
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute task');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRemoveContext = (memoryId: string) => {
    setSelectedContextMemories(prev => prev.filter(m => m.id !== memoryId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to execute
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Task Launcher
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchDialogOpen(true)}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Load Context
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdvancedClick}
              className="text-xs"
            >
              Advanced
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Qwen Code CLI prompt... (e.g., 'Create a React component for user profile')"
            rows={3}
            className="resize-none"
            disabled={isExecuting}
          />

          {/* Selected Context Badges */}
          {selectedContextMemories.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
                <FileText className="h-3 w-3" />
                Context ({selectedContextMemories.length}):
              </div>
              {selectedContextMemories.map(memory => (
                <Badge
                  key={memory.id}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {getMemorySummary(memory).substring(0, 30)}
                  <button
                    onClick={() => handleRemoveContext(memory.id)}
                    className="ml-1 hover:bg-gray-300 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Press Cmd/Ctrl + Enter to execute</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Ad-hoc Task
              </Badge>
            </div>
          </div>
        </div>

        <Button
          onClick={handleExecute}
          disabled={!prompt.trim() || isExecuting}
          className="w-full"
          size="sm"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-2" />
              Execute Task
            </>
          )}
        </Button>
      </CardContent>

      {/* Context Search Dialog */}
      <ContextSearchDialog
        projectId={projectId}
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectMemories={(memories) => {
          setSelectedContextMemories(memories);
          setSearchDialogOpen(false);
        }}
        preselected={selectedContextMemories}
      />
    </Card>
  );
}
