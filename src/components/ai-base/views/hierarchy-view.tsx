import type { Organization, Workspace, Project, Workflow } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SimpleFormDialog } from '@/components/ai-base/simple-form-dialog';
import { OrganizationCard } from '@/components/ai-base/organization-card';
import { WorkspaceCard } from '@/components/ai-base/workspace-card';
import { ProjectCard } from '@/components/ai-base/project-card';

interface ExtendedProject extends Project {
  organizationId?: string;
  organizationName?: string;
  workspaceName?: string;
}

interface HierarchyViewProps {
  organizations: Organization[];
  workspaces: Workspace[];
  projects: ExtendedProject[];
  selectedOrganization: string | null;
  selectedWorkspace: string | null;
  selectedProject: string | null;
  workflows: Workflow[];
  selectedWorkflowId: string;
  isDeleteLocked: boolean;
  newWorkspaceName: string;
  newWorkspacePath: string;
  newProjectName: string;
  newProjectPath: string;
  isWorkspaceDialogOpen: boolean;
  isProjectDialogOpen: boolean;
  onOrganizationSelect: (orgId: string) => void;
  onWorkspaceSelect: (wsId: string) => void;
  onProjectSelect: (projectId: string) => void;
  onCreateWorkspace: () => void;
  onCreateProject: () => void;
  onWorkspaceDialogChange: (open: boolean) => void;
  onProjectDialogChange: (open: boolean) => void;
  onNewWorkspaceNameChange: (name: string) => void;
  onNewWorkspacePathChange: (path: string) => void;
  onNewProjectNameChange: (name: string) => void;
  onNewProjectPathChange: (path: string) => void;
  onDeleteOrg: (orgId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onCreateSandbox: (projectId: string) => void;
  onDestroySandbox: (sandboxId: string) => void;
  onRecreateSandbox: (projectId: string, sandboxId: string) => void;
  onMove: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onChangeWorkflow: (projectId: string) => void;
  onWorkflowIdChange: (value: string) => void;
}

export function HierarchyView({
  organizations,
  workspaces,
  projects,
  selectedOrganization,
  selectedWorkspace,
  selectedProject,
  workflows,
  selectedWorkflowId,
  isDeleteLocked,
  newWorkspaceName,
  newWorkspacePath,
  newProjectName,
  newProjectPath,
  isWorkspaceDialogOpen,
  isProjectDialogOpen,
  onOrganizationSelect,
  onWorkspaceSelect,
  onProjectSelect,
  onCreateWorkspace,
  onCreateProject,
  onWorkspaceDialogChange,
  onProjectDialogChange,
  onNewWorkspaceNameChange,
  onNewWorkspacePathChange,
  onNewProjectNameChange,
  onNewProjectPathChange,
  onDeleteOrg,
  onDeleteWorkspace,
  onCreateSandbox,
  onDestroySandbox,
  onRecreateSandbox,
  onMove,
  onDelete,
  onChangeWorkflow,
  onWorkflowIdChange,
}: HierarchyViewProps) {
  const getWorkflowName = (workflowId: string | null | undefined): string | undefined => {
    if (!workflowId) return undefined;
    return workflows.find(w => w.id === workflowId)?.name;
  };

  return (
    <>
      {/* Organizations Column */}
      <div className="col-span-3">
        <h2 className="text-xl font-semibold mb-4">Organizations</h2>
        <div className="space-y-2">
          {organizations.map(org => (
            <OrganizationCard
              key={org.id}
              organization={org}
              isSelected={selectedOrganization === org.id}
              onSelect={onOrganizationSelect}
              onDelete={onDeleteOrg}
              showDelete={!isDeleteLocked}
            />
          ))}
        </div>
      </div>

      {/* Workspaces Column */}
      <div className="col-span-3">
        {selectedOrganization ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Workspaces</h2>
              <SimpleFormDialog
                open={isWorkspaceDialogOpen}
                onOpenChange={onWorkspaceDialogChange}
                title="Add Workspace"
                description="A workspace is a folder within the organization."
                fields={[
                  {
                    id: 'ws-name',
                    label: 'Name',
                    value: newWorkspaceName,
                    onChange: onNewWorkspaceNameChange,
                  },
                  {
                    id: 'ws-path',
                    label: 'Folder',
                    value: newWorkspacePath,
                    onChange: onNewWorkspacePathChange,
                    placeholder: 'subfolder',
                    enableFolderSelection: true,
                  },
                ]}
                onSubmit={async () => {
                  try {
                    await onCreateWorkspace();
                    // Reset form fields in parent
                    onNewWorkspaceNameChange('');
                    onNewWorkspacePathChange('');
                    // Close dialog on success
                    onWorkspaceDialogChange(false);
                  } catch (error) {
                    console.error('Error creating workspace:', error);
                    // Keep dialog open on error to allow retry
                  }
                }}
                trigger={<Button size="sm">Add</Button>}
                folderSelectionConfig={{
                  apiEndpoint: `/folders/workspaces/${selectedOrganization}`,
                  title: 'Select Workspace Folder',
                  description: 'Select an existing folder within the organization. Only one level is shown to maintain hierarchy structure.',
                }}
              />
            </div>
            <div className="space-y-2">
              {workspaces.map(ws => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  isSelected={selectedWorkspace === ws.id}
                  onSelect={onWorkspaceSelect}
                  onDelete={onDeleteWorkspace}
                  showDelete={!isDeleteLocked}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select an organization
          </div>
        )}
      </div>

      {/* Projects Column */}
      <div className="col-span-6">
        {selectedWorkspace ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Projects</h2>
              <SimpleFormDialog
                open={isProjectDialogOpen}
                onOpenChange={onProjectDialogChange}
                title="Add Project"
                description="A project is a folder within the workspace. Each project can have one sandbox."
                fields={[
                  {
                    id: 'proj-name',
                    label: 'Name',
                    value: newProjectName,
                    onChange: onNewProjectNameChange,
                  },
                  {
                    id: 'proj-path',
                    label: 'Folder',
                    value: newProjectPath,
                    onChange: onNewProjectPathChange,
                    placeholder: 'project-folder',
                    enableFolderSelection: true,
                  },
                  {
                    id: 'proj-workflow',
                    label: 'Workflow',
                    value: selectedWorkflowId || 'none', // Use 'none' as value when no workflow is selected
                    onChange: (value) => onWorkflowIdChange(value === 'none' ? '' : value),
                    type: 'select',
                    placeholder: 'Select workflow (optional)',
                    selectOptions: [
                      { value: 'none', label: 'None' },
                      ...workflows.map(w => ({ value: w.id, label: w.name })),
                    ],
                  },
                ]}
                onSubmit={async () => {
                  try {
                    await onCreateProject();
                    // Reset form fields in parent
                    onNewProjectNameChange('');
                    onNewProjectPathChange('');
                    onWorkflowIdChange('');
                    // Close dialog on success
                    onProjectDialogChange(false);
                  } catch (error) {
                    console.error('Error creating project:', error);
                    // Keep dialog open on error to allow retry
                  }
                }}
                trigger={<Button size="sm">Add Project</Button>}
                folderSelectionConfig={{
                  apiEndpoint: `/folders/projects/${selectedWorkspace}`,
                  title: 'Select Project Folder',
                  description: 'Select an existing folder within the workspace. Only one level is shown to maintain hierarchy structure.',
                }}
              />
            </div>
            <div className="grid gap-4">
              {projects.map(proj => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  workflowName={getWorkflowName(proj.workflowId)}
                  onCreateSandbox={() => { void onCreateSandbox(proj.id); }}
                  onDestroySandbox={proj.sandboxId ? () => { void onDestroySandbox(proj.sandboxId!); } : undefined}
                  onRecreateSandbox={proj.sandboxId ? () => { void onRecreateSandbox(proj.id, proj.sandboxId!); } : undefined}
                  onMove={proj.workspaceId ? () => onMove(proj.id) : undefined}
                  onDelete={() => onDelete(proj.id)}
                  onChangeWorkflow={() => onChangeWorkflow(proj.id)}
                  showDelete={!isDeleteLocked}
                  isSelected={selectedProject === proj.id}
                  onClick={() => onProjectSelect(proj.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select a workspace
          </div>
        )}
      </div>
    </>
  );
}