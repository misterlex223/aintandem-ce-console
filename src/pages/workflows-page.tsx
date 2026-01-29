/**
 * Workflows Page
 * List and manage all workflows with status filtering
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClient, exportWorkflowJson, importWorkflowJson } from '@/lib/api/api-helpers';
import { getWorkflowStatusBadgeVariant, getWorkflowStatusDisplayName } from '@/lib/api/api-helpers';
import type { Workflow } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Trash2, Edit, Download, Upload } from 'lucide-react';
import { downloadFile, triggerFileInput } from '@/lib/file-utils';

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

export function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workflows
  useEffect(() => {
    async function fetchWorkflows() {
      try {
        setIsLoading(true);
        const client = getClient();
        const data = await client.workflows.listWorkflows() as any;
        setWorkflows(data);
        setFilteredWorkflows(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchWorkflows();
  }, []);

  // Apply status filter
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredWorkflows(workflows);
    } else {
      setFilteredWorkflows(workflows.filter(w => w.status === statusFilter));
    }
  }, [statusFilter, workflows]);

  // Handle clone workflow
  const handleClone = async (workflow: Workflow) => {
    const newName = prompt(`Clone "${workflow.name}" as:`, `${workflow.name} (Copy)`);
    if (!newName) return;

    try {
      const client = getClient();
      const cloned = await client.workflows.cloneWorkflow(workflow.id, { name: newName }) as any;
      setWorkflows([...workflows, cloned]);
      alert(`Workflow cloned successfully as "${cloned.name}"`);
    } catch (err) {
      console.error('Failed to clone workflow:', err);
      alert(err instanceof Error ? err.message : 'Failed to clone workflow');
    }
  };

  // Handle delete workflow
  const handleDelete = async (workflow: Workflow) => {
    if (workflow.isTemplate) {
      alert('Cannot delete built-in template workflows');
      return;
    }

    const confirmMsg = `Are you sure you want to delete "${workflow.name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const client = getClient();
      await client.workflows.deleteWorkflow(workflow.id);
      setWorkflows(workflows.filter(w => w.id !== workflow.id));
      alert('Workflow deleted successfully');
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  };

  // Handle create new workflow
  const handleCreateNew = () => {
    navigate('/workflow/new');
  };

  // Handle edit workflow
  const handleEdit = (workflowId: string) => {
    navigate(`/workflow/${workflowId}/edit`);
  };

  // Handle export workflow
  const handleExport = (workflow: Workflow) => {
    const jsonStr = exportWorkflowJson(workflow);
    const filename = `${workflow.name.replace(/\s+/g, '_')}_export.json`;
    downloadFile(jsonStr, filename);
  };

  // Handle import workflow
  const handleImport = async () => {
    triggerFileInput(async (file) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        if (!parsed.name || !parsed.definition) {
          throw new Error('Invalid workflow file format');
        }
        
        // Prompt for name and description
        const name = prompt('Enter workflow name:', parsed.name) || parsed.name;
        if (!name.trim()) {
          alert('Workflow name is required');
          return;
        }
        
        const description = prompt('Enter workflow description:', parsed.description || '');
        
        // Import the workflow
        const importedWorkflow = await importWorkflowJson(text, name, description || '');
        setWorkflows([...workflows, importedWorkflow]);
        alert('Workflow imported successfully!');
      } catch (err) {
        console.error('Failed to import workflow:', err);
        alert('Failed to import workflow: ' + (err instanceof Error ? err.message : 'Invalid file format'));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Manage workflow templates and definitions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import Workflow
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Workflow
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All ({workflows.length})
        </Button>
        <Button
          variant={statusFilter === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('published')}
        >
          Published ({workflows.filter(w => w.status === 'published').length})
        </Button>
        <Button
          variant={statusFilter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('draft')}
        >
          Draft ({workflows.filter(w => w.status === 'draft').length})
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('archived')}
        >
          Archived ({workflows.filter(w => w.status === 'archived').length})
        </Button>
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {statusFilter === 'all'
              ? 'No workflows found. Create your first workflow to get started.'
              : `No ${statusFilter} workflows found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(workflow => (
            <Card key={workflow.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {workflow.name}
                    {workflow.isTemplate && (
                      <Badge variant="secondary" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant={getWorkflowStatusBadgeVariant(workflow.status)}>
                    {getWorkflowStatusDisplayName(workflow.status)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {workflow.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Phases:</span>{' '}
                    {workflow.definition.phases.length}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> v{workflow.currentVersion}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(workflow.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClone(workflow)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(workflow)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!workflow.isTemplate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(workflow)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkflowsPage;
