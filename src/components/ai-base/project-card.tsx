import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SandboxConfigDialog } from '@/components/ai-base/sandbox-config-dialog';
import { MoreVertical, ExternalLink, RotateCcw, Move3D, Workflow, Loader2, Settings } from 'lucide-react';
import type { Project } from '@/lib/types';
import { getPhaseDisplayName } from '@/lib/api/workflow';
import { getClient } from '@/lib/api/api-helpers';

interface ProjectCardProps {
  project: Project;
  workflowName?: string; // Display name of bound workflow
  onCreateSandbox?: (projectId: string, aiConfig?: any, imageName?: string) => void | Promise<void>;
  onDestroySandbox?: (sandboxId: string) => void | Promise<void>;
  onRecreateSandbox?: (projectId: string, sandboxId: string, aiConfig?: any, imageName?: string) => void | Promise<void>;
  onMove?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onChangeWorkflow?: (projectId: string) => void;
  showDelete?: boolean;
  isCompact?: boolean; // Display in compact mode for tables
  isSelected?: boolean; // Indicates if this project is currently selected
  onClick?: () => void; // Click handler to select the project
}

export function ProjectCard({
  project,
  workflowName,
  onCreateSandbox,
  onDestroySandbox,
  onRecreateSandbox,
  onMove,
  onDelete,
  onChangeWorkflow,
  showDelete = true,
  isCompact = false,
  isSelected = false,
  onClick,
}: ProjectCardProps) {
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
  const [isDestroyingSandbox, setIsDestroyingSandbox] = useState(false);
  const [isRecreatingSandbox, setIsRecreatingSandbox] = useState(false);
  const [isSandboxConfigDialogOpen, setIsSandboxConfigDialogOpen] = useState(false);
  const [aiConfigIntent, setAiConfigIntent] = useState<'create' | 'recreate' | 'save' | null>(null);

  const navigate = useNavigate();

  const handleWorkflowClick = () => {
    navigate(`/project/${project.id}/workflow`);
  };

  const handleOpenSandbox = () => {
    if (project.sandboxId) {
      // Navigate to sandbox page with shell tab by default
      navigate(`/sandbox/${project.sandboxId}?tab=shell`);
    }
  };

  const handleCreateSandbox = async () => {
    if (onCreateSandbox) {
      setIsCreatingSandbox(true);
      try {
        const result = onCreateSandbox(project.id);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        setIsCreatingSandbox(false);
      }
    }
  };

  const handleDestroySandbox = async () => {
    if (onDestroySandbox) {
      setIsDestroyingSandbox(true);
      try {
        const result = onDestroySandbox(project.sandboxId!);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        setIsDestroyingSandbox(false);
      }
    }
  };

  const handleCreateSandboxWithConfig = async (config?: any) => {
    if (onCreateSandbox) {
      setIsCreatingSandbox(true);
      try {
        const { imageName, ...aiConfig } = config || {};
        const result = onCreateSandbox(project.id, aiConfig, imageName);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        setIsCreatingSandbox(false);
      }
    }
  };

  const handleRecreateSandbox = async () => {
    if (onRecreateSandbox) {
      setIsRecreatingSandbox(true);
      try {
        const result = onRecreateSandbox(project.id, project.sandboxId!);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        setIsRecreatingSandbox(false);
      }
    }
  };

  const handleRecreateSandboxWithConfig = async (config?: any) => {
    if (onRecreateSandbox) {
      setIsRecreatingSandbox(true);
      try {
        const { imageName, ...aiConfig } = config || {};
        const result = onRecreateSandbox(project.id, project.sandboxId!, aiConfig, imageName);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        setIsRecreatingSandbox(false);
      }
    }
  };

  const handleSaveAiConfig = async (aiConfig: any) => {
    try {
      const client = getClient();
      // Update the project with the new sandbox configuration
      await client.workspaces.updateProject(project.id, { aiConfig }) as any;
    } catch (error) {
      console.error('Failed to save sandbox configuration:', error);
    }
  };

  return (
    <Card
      className={`${isCompact ? 'border-0 shadow-none' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={isCompact ? undefined : onClick}
    >
      {isCompact ? (
        // Compact mode for table cells
        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            <div className="flex gap-2 flex-wrap">
              {(isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCreatingSandbox && 'Creating...'}
                  {isDestroyingSandbox && 'Destroying...'}
                  {isRecreatingSandbox && 'Recreating...'}
                </div>
              )}
              {project.sandboxId ? (
                <>
                  {onCreateSandbox && (
                    <Button size="sm" variant="outline" onClick={handleOpenSandbox} disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  )}

                </>
              ) : (
                <>
                  {onCreateSandbox && (
                    <Button size="sm" onClick={handleCreateSandbox} disabled={isCreatingSandbox}>
                      {isCreatingSandbox ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" variant="outline" onClick={handleWorkflowClick} disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                Workflow
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {project.sandboxId && (
                  <>
                    {onDestroySandbox && (
                      <DropdownMenuItem
                        onClick={handleDestroySandbox}
                        className="text-red-600"
                        disabled={isDestroyingSandbox}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Destroy Sandbox
                      </DropdownMenuItem>
                    )}
                    {onRecreateSandbox && (
                      <DropdownMenuItem
                        onClick={handleRecreateSandbox}
                        disabled={isRecreatingSandbox}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Recreate Sandbox
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {onChangeWorkflow && (
                  <DropdownMenuItem onClick={() => onChangeWorkflow(project.id)}>
                    <Workflow className="h-4 w-4 mr-2" />
                    Change Workflow
                  </DropdownMenuItem>
                )}
                {onMove && (
                  <DropdownMenuItem onClick={() => onMove(project.id)}>
                    <Move3D className="h-4 w-4 mr-2" />
                    Move
                  </DropdownMenuItem>
                )}
                {showDelete && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(project.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        // Normal mode
        <>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{project.name}</span>
              <div className="flex items-center gap-2">
                {project.workflowState && (
                  <Badge variant="secondary" className="text-xs">
                    {getPhaseDisplayName(project.workflowState.currentPhaseId)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.sandboxId && (
                      <>
                        {onDestroySandbox && (
                          <DropdownMenuItem
                            onClick={handleDestroySandbox}
                            className="text-red-600"
                            disabled={isDestroyingSandbox}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Destroy Sandbox
                          </DropdownMenuItem>
                        )}
                        {onRecreateSandbox && (
                          <DropdownMenuItem
                            onClick={handleRecreateSandbox}
                            disabled={isRecreatingSandbox}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recreate Sandbox
                          </DropdownMenuItem>
                        )}
                        {onCreateSandbox && (
                          <DropdownMenuItem
                            onClick={() => {
                              setAiConfigIntent('save');
                              setIsSandboxConfigDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Save Sandbox Configuration
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    {onChangeWorkflow && (
                      <DropdownMenuItem onClick={() => onChangeWorkflow(project.id)}>
                        <Workflow className="h-4 w-4 mr-2" />
                        Change Workflow
                      </DropdownMenuItem>
                    )}
                    {onMove && (
                      <DropdownMenuItem onClick={() => onMove(project.id)}>
                        <Move3D className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                    )}
                    {showDelete && onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(project.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
            <CardDescription className="text-sm">{project.folderPath}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.sandboxId ? (
                <p className="text-sm text-green-600">Sandbox: {project.sandboxName}</p>
              ) : (
                <p className="text-sm text-gray-500">No sandbox</p>
              )}
              {project.workflowId && workflowName ? (
                <p className="text-sm text-blue-600">Workflow: {workflowName} (v{project.workflowVersionId})</p>
              ) : (
                <p className="text-sm text-gray-500">No workflow bound</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2 flex-wrap">
              {(isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCreatingSandbox && 'Creating sandbox...'}
                  {isDestroyingSandbox && 'Destroying sandbox...'}
                  {isRecreatingSandbox && 'Recreating sandbox...'}
                </div>
              )}
              {project.sandboxId ? (
                <>
                  {onCreateSandbox && (
                    <Button size="sm" variant="outline" onClick={handleOpenSandbox} disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Sandbox
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {onCreateSandbox && (
                    <Button size="sm" onClick={handleCreateSandbox} disabled={isCreatingSandbox}>
                      {isCreatingSandbox ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Sandbox'
                      )}
                    </Button>
                  )}
                  {onCreateSandbox && project.aiConfig && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAiConfigIntent('create');
                        setIsSandboxConfigDialogOpen(true);
                      }}
                      disabled={isCreatingSandbox}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Create with Saved Config
                    </Button>
                  )}
                </>
              )}
              <Button size="sm" variant="outline" onClick={handleWorkflowClick} disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                <Workflow className="h-4 w-4 mr-1" />
                Workflow
              </Button>
            </div>
            {showDelete && onDelete && (
              <Button size="sm" variant="destructive" onClick={() => onDelete(project.id)} disabled={isCreatingSandbox || isDestroyingSandbox || isRecreatingSandbox}>
                Delete
              </Button>
            )}
          </CardFooter>
        </>
      )}
      <SandboxConfigDialog
        open={isSandboxConfigDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsSandboxConfigDialogOpen(open);
          if (!open) {
            setAiConfigIntent(null); // Reset intent when dialog closes
          }
        }}
        initialConfig={project.aiConfig}
        onSave={(aiConfig: any) => {
          if (aiConfigIntent === 'recreate') {
            handleRecreateSandboxWithConfig(aiConfig);
          } else if (aiConfigIntent === 'save') {
            // Save sandbox configuration to project but don't create sandbox
            handleSaveAiConfig(aiConfig);
          } else { // create intent
            handleCreateSandboxWithConfig(aiConfig);
          }
          setAiConfigIntent(null); // Reset intent after save
          setIsSandboxConfigDialogOpen(false);
        }}
      />
    </Card>
  );
}
