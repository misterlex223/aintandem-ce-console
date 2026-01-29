import type { Organization, Workspace, Project, Workflow } from '@/lib/types';

export interface ProjectFilterOptions {
  workflowStatus?: 'all' | 'bound' | 'unbound';
  sandboxStatus?: 'all' | 'active' | 'inactive';
  organizationId?: string;
  workspaceId?: string;
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'workflowPhase';
  sortOrder?: 'asc' | 'desc';
}

export interface OrganizationFilterOptions {
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'projectCount';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowFilterOptions {
  status?: 'all' | 'published' | 'draft' | 'archived';
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'version' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter projects based on various criteria
 */
export function filterProjects(
  projects: Project[],
  workspaces: Workspace[],
  organizations: Organization[],
  workflows: Workflow[],
  options: ProjectFilterOptions
): Project[] {
  let result = [...projects];

  // Apply workflow binding filter
  if (options.workflowStatus === 'bound') {
    result = result.filter(project => project.workflowId);
  } else if (options.workflowStatus === 'unbound') {
    result = result.filter(project => !project.workflowId);
  }

  // Apply sandbox status filter
  if (options.sandboxStatus === 'active') {
    result = result.filter(project => project.sandboxId);
  } else if (options.sandboxStatus === 'inactive') {
    result = result.filter(project => !project.sandboxId);
  }

  // Apply organization filter
  if (options.organizationId) {
    const orgWorkspaces = workspaces.filter(ws => ws.organizationId === options.organizationId);
    const workspaceIds = orgWorkspaces.map(ws => ws.id);
    result = result.filter(project => workspaceIds.includes(project.workspaceId));
  }

  // Apply workspace filter
  if (options.workspaceId) {
    result = result.filter(project => project.workspaceId === options.workspaceId);
  }

  // Apply search query
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(project => {
        // Search in project name and path
        if (project.name.toLowerCase().includes(query) || 
            project.folderPath.toLowerCase().includes(query)) {
          return true;
        }

        // Search in organization name and path
        const workspace = workspaces.find(ws => ws.id === project.workspaceId);
        if (workspace) {
          const organization = organizations.find(org => org.id === workspace.organizationId);
          if (organization && 
              (organization.name.toLowerCase().includes(query) || 
               organization.folderPath.toLowerCase().includes(query))) {
            return true;
          }
        }

        // Search in workspace name and path
        if (workspace && 
            (workspace.name.toLowerCase().includes(query) || 
             workspace.folderPath.toLowerCase().includes(query))) {
          return true;
        }

        // Search in workflow name
        if (project.workflowId) {
          const workflow = workflows.find(w => w.id === project.workflowId);
          if (workflow && workflow.name.toLowerCase().includes(query)) {
            return true;
          }
        }

        return false;
      });
    }
  }

  // Apply sorting
  if (options.sortBy) {
    result.sort((a, b) => {
      let comparison = 0;

      switch (options.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'workflowPhase': {
        const workflowA = a.workflowId ? workflows.find(w => w.id === a.workflowId) : null;
        const workflowB = b.workflowId ? workflows.find(w => w.id === b.workflowId) : null;
        const phaseA = workflowA?.name || '';
        const phaseB = workflowB?.name || '';
        comparison = phaseA.localeCompare(phaseB);
        break;
      }
      }

      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

/**
 * Filter organizations based on criteria
 */
export function filterOrganizations(
  organizations: Organization[],
  workspaces: Workspace[],
  projects: Project[],
  options: OrganizationFilterOptions
): Organization[] {
  let result = [...organizations];

  // Apply search query
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(org => 
        org.name.toLowerCase().includes(query) ||
        org.folderPath.toLowerCase().includes(query) ||
        (org as any).description?.toLowerCase().includes(query)
      );
    }
  }

  // Apply sorting
  if (options.sortBy) {
    result.sort((a, b) => {
      let comparison = 0;

      switch (options.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'projectCount': {
        const orgAWorkspaces = workspaces.filter(ws => ws.organizationId === a.id);
        const orgBWorkspaces = workspaces.filter(ws => ws.organizationId === b.id);
        const orgAProjects = projects.filter(p =>
          orgAWorkspaces.some(ws => ws.id === p.workspaceId)
        ).length;
        const orgBProjects = projects.filter(p =>
          orgBWorkspaces.some(ws => ws.id === p.workspaceId)
        ).length;
        comparison = orgAProjects - orgBProjects;
        break;
      }
      }

      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

/**
 * Filter workflows based on criteria
 */
export function filterWorkflows(
  workflows: Workflow[],
  projects: Project[],
  options: WorkflowFilterOptions
): Workflow[] {
  let result = [...workflows];

  // Apply status filter
  if (options.status && options.status !== 'all') {
    result = result.filter(workflow => workflow.status === options.status);
  }

  // Apply search query
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(workflow => 
        workflow.name.toLowerCase().includes(query) ||
        (workflow as any).description?.toLowerCase().includes(query)
      );
    }
  }

  // Apply sorting
  if (options.sortBy) {
    result.sort((a, b) => {
      let comparison = 0;

      switch (options.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'version':
        comparison = (a.currentVersion || 0) - (b.currentVersion || 0);
        break;
      case 'usageCount': {
        const countA = projects.filter(p => p.workflowId === a.id).length;
        const countB = projects.filter(p => p.workflowId === b.id).length;
        comparison = countA - countB;
        break;
      }
      }

      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

/**
 * Create filter presets for common use cases
 */
export const FILTER_PRESETS = {
  project: {
    activeSandboxes: { sandboxStatus: 'active' } as ProjectFilterOptions,
    unboundProjects: { workflowStatus: 'unbound' } as ProjectFilterOptions,
    recentProjects: { sortBy: 'createdAt', sortOrder: 'desc' } as ProjectFilterOptions,
  },
  organization: {
    recentOrganizations: { sortBy: 'createdAt', sortOrder: 'desc' } as OrganizationFilterOptions,
    mostActive: { sortBy: 'projectCount', sortOrder: 'desc' } as OrganizationFilterOptions,
  },
  workflow: {
    published: { status: 'published' } as WorkflowFilterOptions,
    recentWorkflows: { sortBy: 'createdAt', sortOrder: 'desc' } as WorkflowFilterOptions,
    mostUsed: { sortBy: 'usageCount', sortOrder: 'desc' } as WorkflowFilterOptions,
  }
} as const;