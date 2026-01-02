/**
 * Workflow Editor Page
 * Create and edit workflows with full phase/step editing capabilities
 * Features: Metadata editing, status management, phase/step CRUD, reordering
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient } from '@/lib/api/api-helpers';
import { getWorkflowStatusDisplayName } from '@/lib/api/api-helpers';
import type { Workflow, WorkflowDefinition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, FileCheck, Archive, FileEdit, Maximize, Minimize } from 'lucide-react';
import { WorkflowEditorView } from '@/components/workflow/workflow-editor-view';

// Simple default workflow structure for new workflows
const defaultWorkflowDefinition: WorkflowDefinition = {
  phases: [
    {
      id: 'phase-1',
      title: 'Phase 1',
      titleEn: 'Phase 1',
      description: 'First phase of the workflow',
      color: '#E3F2FD',
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          description: 'First step',
          type: 'process',
          workflows: []
        }
      ]
    }
  ],
  transitions: []
};

export function WorkflowEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [definition, setDefinition] = useState<WorkflowDefinition>(defaultWorkflowDefinition);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const workflowEditorRef = useRef<HTMLDivElement>(null);

  // Fetch workflow if editing existing
  useEffect(() => {
    if (isNew) return;

    async function fetchWorkflow() {
      try {
        setIsLoading(true);
        const client = getClient();
        const data = await client.workflows.getWorkflow(id!) as any;
        setWorkflow(data);
        setName(data.name);
        setDescription(data.description);
        setDefinition(data.definition);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch workflow:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch workflow');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchWorkflow();
  }, [id, isNew]);

  // Handle save
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a workflow description');
      return;
    }

    // Validate definition
    if (!definition.phases || definition.phases.length === 0) {
      alert('Workflow must have at least one phase');
      return;
    }

    for (const phase of definition.phases) {
      if (!phase.steps || phase.steps.length === 0) {
        alert(`Phase "${phase.title}" must have at least one step`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const client = getClient();

      if (isNew) {
        // Create new workflow
        const newWorkflow = await client.workflows.createWorkflow({
          name,
          description,
          definition
        }) as any;
        alert('Workflow created successfully!');
        navigate(`/workflow/${newWorkflow.id}/edit`);
      } else {
        // Update existing workflow
        const updated = await client.workflows.updateWorkflow(id!, {
          name,
          description,
          definition,
        }) as any;
        setWorkflow(updated);
        setDefinition(updated.definition);
        alert('Workflow updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      alert(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: 'published' | 'draft' | 'archived') => {
    if (!workflow) return;

    const confirmMsg = `Change workflow status to "${getWorkflowStatusDisplayName(newStatus)}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const client = getClient();
      const updated = await client.workflows.changeWorkflowStatus(workflow.id, newStatus) as any;
      setWorkflow(updated);
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Failed to change status:', err);
      alert(err instanceof Error ? err.message : 'Failed to change status');
    }
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isFullscreen && workflowEditorRef.current && !workflowEditorRef.current.contains(event.target as Node)) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFullscreen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/workflows')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNew ? 'Create Workflow' : 'Edit Workflow'}
            </h1>
            {workflow && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getWorkflowStatusDisplayName(workflow.status)}
                </Badge>
                {workflow.isTemplate && (
                  <Badge variant="outline">Template</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  v{workflow.currentVersion}
                </span>
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Basic Info and Status Management in responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Workflow Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workflow name..."
                disabled={workflow?.isTemplate}
              />
              {workflow?.isTemplate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Template workflows cannot be renamed
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe the workflow purpose and use case..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Management Card (only for existing workflows) */}
        {!isNew && workflow && (
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Current status: <strong>{getWorkflowStatusDisplayName(workflow.status)}</strong>
              </p>

              <div className="flex gap-2 flex-wrap">
                {workflow.status !== 'published' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange('published')}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                )}

                {workflow.status !== 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('draft')}
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Move to Draft
                  </Button>
                )}

                {workflow.status !== 'archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('archived')}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                )}
              </div>

              <div className="mt-3 p-3 bg-muted rounded-lg">
                <h4 className="text-xs font-medium mb-1">Status Rules:</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• <strong>Draft:</strong> Can be edited freely</li>
                  <li>• <strong>Published:</strong> Edits create new versions</li>
                  <li>• <strong>Archived:</strong> Cannot bind to new projects</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workflow Structure Editor */}
      <Card 
        ref={workflowEditorRef}
        className={isFullscreen ? 'fixed inset-0 z-50 overflow-auto bg-background p-4' : ''}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workflow Structure</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isFullscreen ? 'flex-1 h-[calc(100vh-100px)]' : ''}>
          <WorkflowEditorView
            phases={definition.phases}
            transitions={definition.transitions}
            onChange={(phases) => setDefinition({ ...definition, transitions: definition.transitions, phases })}
            disabled={workflow?.isTemplate}
          />
          {workflow?.isTemplate && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> This is a built-in template workflow. The structure cannot be modified.
                Clone this workflow to create a customizable copy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WorkflowEditorPage;
