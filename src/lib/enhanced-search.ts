import type { Organization, Workspace, Project, Workflow } from '@/lib/types';

/**
 * Enhanced search and filtering utilities for AI Base views
 */

// Search functions
export function searchOrganizations(organizations: Organization[], query: string): Organization[] {
  if (!query) return organizations;

  const lowerQuery = query.toLowerCase();
  return organizations.filter(org =>
    org.name.toLowerCase().includes(lowerQuery) ||
    org.id.toLowerCase().includes(lowerQuery) ||
    org.folderPath.toLowerCase().includes(lowerQuery)
  );
}

export function searchWorkspaces(workspaces: Workspace[], query: string): Workspace[] {
  if (!query) return workspaces;

  const lowerQuery = query.toLowerCase();
  return workspaces.filter(ws =>
    ws.name.toLowerCase().includes(lowerQuery) ||
    ws.id.toLowerCase().includes(lowerQuery) ||
    ws.folderPath.toLowerCase().includes(lowerQuery)
  );
}

export function searchProjects(projects: Project[], query: string): Project[] {
  if (!query) return projects;

  const lowerQuery = query.toLowerCase();
  return projects.filter(project =>
    project.name.toLowerCase().includes(lowerQuery) ||
    project.id.toLowerCase().includes(lowerQuery) ||
    project.folderPath.toLowerCase().includes(lowerQuery) ||
    (project.workflowState?.currentPhaseId &&
      project.workflowState.currentPhaseId.toLowerCase().includes(lowerQuery))
  );
}

export function searchWorkflows(workflows: Workflow[], query: string): Workflow[] {
  if (!query) return workflows;

  const lowerQuery = query.toLowerCase();
  return workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(lowerQuery) ||
    workflow.id.toLowerCase().includes(lowerQuery) ||
    workflow.description.toLowerCase().includes(lowerQuery) ||
    workflow.status.toLowerCase().includes(lowerQuery)
  );
}

// Filter functions
export function filterProjectsByWorkflow(
  projects: Project[],
  filter: 'all' | 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization' | 'none'
): Project[] {
  if (filter === 'all') return projects;

  if (filter === 'none') {
    return projects.filter(project => !project.workflowState?.currentPhaseId);
  }

  return projects.filter(project =>
    project.workflowState?.currentPhaseId === filter
  );
}

export function filterProjectsByStatus(
  projects: Project[],
  filter: 'all' | 'active' | 'inactive'
): Project[] {
  if (filter === 'all') return projects;

  if (filter === 'active') {
    // Active projects are those with running sandboxes or those that have been updated recently
    return projects.filter(project => {
      // Check if workflow state has recent activity or if sandbox exists
      return project.workflowState || project.sandboxId;
    });
  }

  // Inactive projects are those without workflow state and no sandbox
  return projects.filter(project =>
    !project.workflowState && !project.sandboxId
  );
}

export function filterWorkflowsByStatus(
  workflows: Workflow[],
  status: 'all' | 'published' | 'draft' | 'archived'
): Workflow[] {
  if (status === 'all') return workflows;

  return workflows.filter(workflow => workflow.status === status);
}

export function filterWorkflowsByPhase(
  workflows: Workflow[],
  phase: 'all' | 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization'
): Workflow[] {
  if (phase === 'all') return workflows;

  return workflows.filter(workflow =>
    workflow.definition.phases.some(p =>
      p.id === phase || p.title.toLowerCase().includes(phase) || p.titleEn.toLowerCase().includes(phase)
    )
  );
}

// Sort functions
export function sortOrganizations(
  organizations: Organization[],
  sortBy: 'name' | 'createdAt' | 'projectCount',
  sortOrder: 'asc' | 'desc'
): Organization[] {
  const sorted = [...organizations];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'createdAt':
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
    case 'projectCount':
      comparison = (a as any).projectCount - (b as any).projectCount; // Assuming projectCount is added
      break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function sortWorkspaces(
  workspaces: Workspace[],
  sortBy: 'name' | 'createdAt' | 'projectCount',
  sortOrder: 'asc' | 'desc'
): Workspace[] {
  const sorted = [...workspaces];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'createdAt':
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
    case 'projectCount':
      comparison = (a as any).projectCount - (b as any).projectCount; // Assuming projectCount is added
      break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function sortProjects(
  projects: Project[],
  sortBy: 'name' | 'createdAt' | 'workflowPhase',
  sortOrder: 'asc' | 'desc'
): Project[] {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'createdAt':
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
    case 'workflowPhase': {
      const phaseA = a.workflowState?.currentPhaseId || '';
      const phaseB = b.workflowState?.currentPhaseId || '';
      comparison = phaseA.localeCompare(phaseB);
      break;
    }
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function sortWorkflows(
  workflows: Workflow[],
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'status',
  sortOrder: 'asc' | 'desc'
): Workflow[] {
  const sorted = [...workflows];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'createdAt':
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
    case 'updatedAt':
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      break;
    case 'status':
      comparison = a.status.localeCompare(b.status);
      break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// Combined search and filter
export function searchAndFilterProjects(
  projects: Project[],
  searchQuery: string,
  workflowFilter: 'all' | 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization' | 'none',
  statusFilter: 'all' | 'active' | 'inactive'
): Project[] {
  let filtered = [...projects];

  // Apply search
  if (searchQuery) {
    filtered = searchProjects(filtered, searchQuery);
  }

  // Apply workflow filter
  filtered = filterProjectsByWorkflow(filtered, workflowFilter);

  // Apply status filter
  filtered = filterProjectsByStatus(filtered, statusFilter);

  return filtered;
}

export function searchAndFilterWorkflows(
  workflows: Workflow[],
  searchQuery: string,
  statusFilter: 'all' | 'published' | 'draft' | 'archived',
  phaseFilter: 'all' | 'rapid-prototyping' | 'automated-qa' | 'continuous-optimization'
): Workflow[] {
  let filtered = [...workflows];

  // Apply search
  if (searchQuery) {
    filtered = searchWorkflows(filtered, searchQuery);
  }

  // Apply status filter
  filtered = filterWorkflowsByStatus(filtered, statusFilter);

  // Apply phase filter
  filtered = filterWorkflowsByPhase(filtered, phaseFilter);

  return filtered;
}