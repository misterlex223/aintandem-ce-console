import type { Organization, Workspace, Project, Workflow } from '@/lib/types';

export interface SearchFilters {
  query?: string;
  organizationId?: string;
  workspaceId?: string;
  workflowId?: string;
  status?: 'active' | 'inactive' | 'all';
  workflowPhase?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'workflowPhase';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  organizations: Organization[];
  workspaces: Workspace[];
  projects: Project[];
  workflows: Workflow[];
}

/**
 * Comprehensive search function that searches across all entity types
 */
export function searchEntities(
  organizations: Organization[],
  workspaces: Workspace[],
  projects: Project[],
  workflows: Workflow[],
  filters: SearchFilters
): SearchResult {
  let filteredOrganizations = [...organizations];
  let filteredWorkspaces = [...workspaces];
  let filteredProjects = [...projects];
  let filteredWorkflows = [...workflows];

  // Apply text search query
  if (filters.query) {
    const query = filters.query.toLowerCase().trim();
    
    if (query) {
      filteredOrganizations = filteredOrganizations.filter(org => 
        org.name.toLowerCase().includes(query) ||
        org.folderPath.toLowerCase().includes(query) ||
        (org as any).description?.toLowerCase().includes(query)
      );
      
      filteredWorkspaces = filteredWorkspaces.filter(ws => 
        ws.name.toLowerCase().includes(query) ||
        ws.folderPath.toLowerCase().includes(query) ||
        (ws as any).description?.toLowerCase().includes(query)
      );
      
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.folderPath.toLowerCase().includes(query) ||
        (project as any).description?.toLowerCase().includes(query)
      );
      
      filteredWorkflows = filteredWorkflows.filter(workflow => 
        workflow.name.toLowerCase().includes(query) ||
        workflow.description?.toLowerCase().includes(query)
      );
    }
  }

  // Apply organization filter
  if (filters.organizationId) {
    filteredWorkspaces = filteredWorkspaces.filter(ws => 
      ws.organizationId === filters.organizationId
    );
    
    // Filter projects based on filtered workspaces
    const workspaceIds = filteredWorkspaces.map(ws => ws.id);
    filteredProjects = filteredProjects.filter(project => 
      workspaceIds.includes(project.workspaceId)
    );
  }

  // Apply workspace filter
  if (filters.workspaceId) {
    filteredProjects = filteredProjects.filter(project => 
      project.workspaceId === filters.workspaceId
    );
  }

  // Apply workflow filter
  if (filters.workflowId) {
    filteredProjects = filteredProjects.filter(project => 
      project.workflowId === filters.workflowId
    );
  }

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      filteredProjects = filteredProjects.filter(project => 
        project.sandboxId
      );
    } else {
      filteredProjects = filteredProjects.filter(project => 
        !project.sandboxId
      );
    }
  }

  // Apply workflow phase filter
  if (filters.workflowPhase) {
    filteredProjects = filteredProjects.filter(project => {
      if (!project.workflowState) return false;
      return project.workflowState.currentPhaseId === filters.workflowPhase;
    });
  }

  // Apply sorting
  if (filters.sortBy) {
    const sortFn = (a: any, b: any) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'workflowPhase':
        if (a.workflowState?.currentPhaseId && b.workflowState?.currentPhaseId) {
          comparison = a.workflowState.currentPhaseId.localeCompare(b.workflowState.currentPhaseId);
        } else if (a.workflowState?.currentPhaseId) {
          comparison = -1;
        } else if (b.workflowState?.currentPhaseId) {
          comparison = 1;
        }
        break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    };

    filteredOrganizations.sort(sortFn);
    filteredWorkspaces.sort(sortFn);
    filteredProjects.sort(sortFn);
    filteredWorkflows.sort(sortFn);
  }

  return {
    organizations: filteredOrganizations,
    workspaces: filteredWorkspaces,
    projects: filteredProjects,
    workflows: filteredWorkflows,
  };
}

/**
 * Advanced fuzzy search for better matching
 */
export function fuzzySearch(text: string, query: string): boolean {
  if (!query) return true;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match
  if (textLower.includes(queryLower)) return true;
  
  // Word boundary match
  const words = textLower.split(/\s+/);
  return words.some(word => word.includes(queryLower));
}

/**
 * Get related entities for a given entity
 */
export function getRelatedEntities(
  entityId: string,
  entityType: 'organization' | 'workspace' | 'project' | 'workflow',
  organizations: Organization[],
  workspaces: Workspace[],
  projects: Project[],
  workflows: Workflow[]
): {
  parent?: Organization | Workspace | Project | Workflow;
  children: (Organization | Workspace | Project | Workflow)[];
  siblings: (Organization | Workspace | Project | Workflow)[];
} {
  let parent: Organization | Workspace | Project | Workflow | undefined;
  let children: (Organization | Workspace | Project | Workflow)[] = [];
  let siblings: (Organization | Workspace | Project | Workflow)[] = [];

  switch (entityType) {
  case 'organization': {
    const org = organizations.find(o => o.id === entityId);
    if (org) {
      children = workspaces.filter(ws => ws.organizationId === org.id);
      siblings = organizations.filter(o => o.id !== org.id);
    }
    break;
  }
  case 'workspace': {
    const ws = workspaces.find(w => w.id === entityId);
    if (ws) {
      parent = organizations.find(o => o.id === ws.organizationId);
      children = projects.filter(p => p.workspaceId === ws.id);
      siblings = workspaces.filter(w => w.id !== ws.id && w.organizationId === ws.organizationId);
    }
    break;
  }
      
  case 'project': {
    const project = projects.find(p => p.id === entityId);
    if (project) {
      parent = workspaces.find(w => w.id === project.workspaceId);
      // Projects don't have children in our model
      siblings = projects.filter(p => p.id !== project.id && p.workspaceId === project.workspaceId);
    }
    break;
  }
      
  case 'workflow': {
    const workflow = workflows.find(w => w.id === entityId);
    if (workflow) {
      // Workflows don't have parents in our model
      children = projects.filter(p => p.workflowId === workflow.id);
      siblings = workflows.filter(w => w.id !== workflow.id);
    }
    break;
  }
  }

  return { parent, children, siblings };
}

/**
 * Get entity statistics
 */
export function getEntityStatistics(
  organizations: Organization[],
  workspaces: Workspace[],
  projects: Project[],
  workflows: Workflow[]
): {
  totalOrganizations: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalWorkflows: number;
  activeProjects: number;
  projectsByWorkflow: Record<string, number>;
} {
  const activeProjects = projects.filter(p => p.sandboxId).length;
  
  const projectsByWorkflow: Record<string, number> = {};
  projects.forEach(project => {
    if (project.workflowId) {
      projectsByWorkflow[project.workflowId] = (projectsByWorkflow[project.workflowId] || 0) + 1;
    }
  });

  return {
    totalOrganizations: organizations.length,
    totalWorkspaces: workspaces.length,
    totalProjects: projects.length,
    totalWorkflows: workflows.length,
    activeProjects,
    projectsByWorkflow,
  };
}