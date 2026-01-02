import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { executeWorkflowStep } from '@/lib/api/api-helpers';

interface TaskExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  stepId: string;
  stepTitle: string;
  stepDescription: string;

  onTaskStarted?: () => void;
}

export function TaskExecutionDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  stepId, 
  stepTitle, 
  stepDescription,
  onTaskStarted
}: TaskExecutionDialogProps) {
  const [additionalInput, setAdditionalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteTask = async () => {
    try {
      setIsExecuting(true);
      setError(null);
      
      // Execute the workflow step as a task
      await executeWorkflowStep(projectId, stepId, additionalInput.trim());
      
      if (onTaskStarted) {
        onTaskStarted();
      }
      
      // Close the dialog
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute Task: {stepTitle}</DialogTitle>
          <DialogDescription>
            Run this workflow step as a Qwen Code task in the project sandbox
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="step-description">Step Description</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {stepDescription}
            </div>
          </div>



          <div className="grid gap-2">
            <Label htmlFor="additional-input">Additional Input (Optional)</Label>
            <Textarea
              id="additional-input"
              value={additionalInput}
              onChange={(e) => setAdditionalInput(e.target.value)}
              placeholder="Provide any additional context or instructions for the task..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This will be appended to the default task prompt
            </p>
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
          <Button onClick={handleExecuteTask} disabled={isExecuting}>
            {isExecuting ? 'Executing...' : 'Execute Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}