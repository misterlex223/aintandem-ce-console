import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Sparkles, FileText } from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';
import { toast } from 'sonner';
import { Memory } from '@/types/context';
import { ContextSearchDialog } from '../context/context-search-dialog';
import { getMemorySummary } from '@/lib/memory-adapters';

interface AdvancedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onTaskStarted?: () => void;
}

export function AdvancedTaskDialog({
  open,
  onOpenChange,
  projectId,
  onTaskStarted,
}: AdvancedTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [parameters, setParameters] = useState<Array<{ key: string; value: string }>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContextMemories, setSelectedContextMemories] = useState<Memory[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const handleAddParameter = () => {
    setParameters([...parameters, { key: '', value: '' }]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const handleRemoveContext = (memoryId: string) => {
    setSelectedContextMemories(prev => prev.filter(m => m.id !== memoryId));
  };

  const handleExecute = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!prompt.trim()) {
      setError('Prompt is required');
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);

      // Convert parameters array to object
      const parametersObj: Record<string, any> = {};
      parameters.forEach(({ key, value }) => {
        if (key.trim()) {
          parametersObj[key.trim()] = value;
        }
      });

      const client = getClient();
      await client.tasks.executeAdhocTask({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        prompt: prompt.trim(),
        parameters: Object.keys(parametersObj).length > 0 ? parametersObj : undefined,
        contextMemoryIds: selectedContextMemories.map(m => m.id),
      });

      toast.success('Task started successfully');

      // Reset form
      setTitle('');
      setDescription('');
      setPrompt('');
      setParameters([]);
      setSelectedContextMemories([]);

      if (onTaskStarted) {
        onTaskStarted();
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Failed to execute task:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute task');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Advanced Task
          </DialogTitle>
          <DialogDescription>
            Configure and execute a custom task with detailed settings
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Generate React component"
              disabled={isExecuting}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description (Optional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context about this task..."
              rows={2}
              disabled={isExecuting}
            />
          </div>

          {/* Prompt */}
          <div className="grid gap-2">
            <Label htmlFor="task-prompt">
              Qwen Code CLI Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="task-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the full prompt for Qwen Code CLI..."
              rows={4}
              disabled={isExecuting}
            />
            <p className="text-xs text-muted-foreground">
              This will be executed as: <code className="bg-muted px-1 rounded">qwen "{'"prompt"'}"</code>
            </p>
          </div>

          {/* Parameters */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Parameters (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                disabled={isExecuting}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Parameter
              </Button>
            </div>
            {parameters.length > 0 && (
              <div className="space-y-2 border rounded-md p-3">
                {parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={param.key}
                      onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                      placeholder="Key"
                      className="flex-1"
                      disabled={isExecuting}
                    />
                    <Input
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                      disabled={isExecuting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParameter(index)}
                      disabled={isExecuting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add custom parameters that will be passed to the Qwen Code CLI
            </p>
          </div>

          {/* Context */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Context (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchDialogOpen(true)}
                disabled={isExecuting}
              >
                <FileText className="h-3 w-3 mr-1" />
                Search Context
              </Button>
            </div>
            {selectedContextMemories.length > 0 ? (
              <div className="space-y-2 border rounded-md p-3 bg-blue-50">
                <p className="text-xs font-medium text-blue-700">
                  Selected Context ({selectedContextMemories.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedContextMemories.map(memory => (
                    <Badge
                      key={memory.id}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {getMemorySummary(memory).substring(0, 40)}...
                      <button
                        onClick={() => handleRemoveContext(memory.id)}
                        className="ml-1 hover:bg-gray-300 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No context selected. Click "Search Context" to load relevant knowledge.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Preview</Label>
            <div className="bg-muted p-3 rounded-md text-xs font-mono">
              <div className="text-muted-foreground mb-1">Command:</div>
              <code>
                qwen "{prompt || 'your-prompt'}"
                {parameters.map(
                  (p) =>
                    p.key && ` --${p.key}="${p.value}"`
                )}
              </code>
            </div>
          </div>

          {/* Task Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">Ad-hoc Task</Badge>
            <span className="text-xs text-muted-foreground">
              This task will be saved in history but is not part of any workflow
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={isExecuting || !title.trim() || !prompt.trim()}>
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Executing...
              </>
            ) : (
              'Execute Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

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
    </Dialog>
  );
}
