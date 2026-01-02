import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/lib/api/api-helpers';
import { searchEntities } from '@/lib/search-utils';
import type { Organization, Workspace, Project, Workflow } from '@/lib/types';

// Workaround for TypeScript unused import issue - these types are used throughout the file
// Use them in a way TypeScript recognizes as "used"
declare const _typeUsedForChecking: [Organization, Workspace, Project, Workflow];

// Enhanced query keys with better organization
const VIEW_OPTIMIZED_KEYS = {
  // Project-centric queries
  projectCentric: {
    all: ['project-centric'] as const,
    list: (filters?: any) => [...VIEW_OPTIMIZED_KEYS.projectCentric.all, 'list', filters] as const,
    detail: (id: string) => [...VIEW_OPTIMIZED_KEYS.projectCentric.all, 'detail', id] as const,
  },
  
  // Organization-centric queries
  organizationCentric: {
    all: ['organization-centric'] as const,
    list: (filters?: any) => [...VIEW_OPTIMIZED_KEYS.organizationCentric.all, 'list', filters] as const,
    tree: (orgId?: string) => [...VIEW_OPTIMIZED_KEYS.organizationCentric.all, 'tree', orgId] as const,
    flat: (filters?: any) => [...VIEW_OPTIMIZED_KEYS.organizationCentric.all, 'flat', filters] as const,
  },
  
  // Workflow-centric queries
  workflowCentric: {
    all: ['workflow-centric'] as const,
    list: (filters?: any) => [...VIEW_OPTIMIZED_KEYS.workflowCentric.all, 'list', filters] as const,
    lifecycle: (filters?: any) => [...VIEW_OPTIMIZED_KEYS.workflowCentric.all, 'lifecycle', filters] as const,
    detail: (id: string) => [...VIEW_OPTIMIZED_KEYS.workflowCentric.all, 'detail', id] as const,
  },
  
  // Search queries
  search: {
    all: ['search'] as const,
    query: (term: string, entityType?: string) => [...VIEW_OPTIMIZED_KEYS.search.all, term, entityType] as const,
  },
  
  // Stats queries
  stats: {
    all: ['stats'] as const,
    projectCentric: () => [...VIEW_OPTIMIZED_KEYS.stats.all, 'project-centric'] as const,
    organizationCentric: () => [...VIEW_OPTIMIZED_KEYS.stats.all, 'organization-centric'] as const,
    workflowCentric: () => [...VIEW_OPTIMIZED_KEYS.stats.all, 'workflow-centric'] as const,
  }
};

// Project-Centric Optimized Queries
export const useProjectCentricListQuery = (filters?: any) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.projectCentric.list(filters),
    queryFn: async () => {
      // Fetch all required data by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const workflows = await (await getClient()).workflows.listWorkflows() as any;

      // Apply filters if provided
      if (filters) {
        const filtered = searchEntities(organizations, workspaces, projects, workflows, filters);
        return {
          projects: filtered.projects,
          workspaces: filtered.workspaces,
          organizations: filtered.organizations,
          workflows: filtered.workflows
        };
      }

      return { projects, workspaces, organizations, workflows };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

// Organization-Centric Optimized Queries
export const useOrganizationCentricTreeQuery = (organizationId?: string) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.organizationCentric.tree(organizationId),
    queryFn: async () => {
      if (organizationId) {
        // Fetch specific organization tree
        const [organization, workspaces, projects] = await Promise.all([
          getClient().workspaces.getOrganization(organizationId),
          getClient().workspaces.listWorkspaces(organizationId),
          Promise.all(
            (await getClient().workspaces.listWorkspaces(organizationId) as any).map((ws: Workspace) =>
              getClient().workspaces.listProjects(ws.id)
            )
          ).then(results => results.flat())
        ]);
        
        return { organization, workspaces, projects };
      } else {
        // Fetch complete tree - need to fetch by hierarchy
        const organizations = await getClient().workspaces.listOrganizations() as any;
        const workspaces: Workspace[] = [];
        const projects: Project[] = [];

        for (const org of organizations) {
          const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
          workspaces.push(...orgWorkspaces);

          for (const ws of orgWorkspaces) {
            const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
            projects.push(...wsProjects);
          }
        }
        
        return { organizations, workspaces, projects };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

export const useOrganizationCentricFlatQuery = (filters?: any) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.organizationCentric.flat(filters),
    queryFn: async () => {
      // Fetch all data by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      // Apply filters if provided
      if (filters) {
        const filtered = searchEntities(organizations, workspaces, projects, [], filters);
        return {
          organizations: filtered.organizations,
          workspaces: filtered.workspaces,
          projects: filtered.projects
        };
      }

      return { organizations, workspaces, projects };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 12 * 60 * 1000,   // 12 minutes
  });
};

// Workflow-Centric Optimized Queries
export const useWorkflowCentricListQuery = (filters?: any) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.workflowCentric.list(filters),
    queryFn: async () => {
      // Fetch all projects by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const workflows = await (await getClient()).workflows.listWorkflows() as any;

      // Apply filters if provided
      if (filters) {
        // Filter workflows based on criteria
        let filteredWorkflows = [...workflows];

        if (filters.status && filters.status !== 'all') {
          filteredWorkflows = filteredWorkflows.filter((w: Workflow) => w.status === filters.status);
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filteredWorkflows = filteredWorkflows.filter((w: Workflow) =>
            w.name.toLowerCase().includes(query) ||
            w.description?.toLowerCase().includes(query)
          );
        }

        return { workflows: filteredWorkflows, projects };
      }

      return { workflows, projects };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

export const useWorkflowCentricLifecycleQuery = (filters?: any) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.workflowCentric.lifecycle(filters),
    queryFn: async () => {
      // Fetch all projects by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const workflows = await (await getClient()).workflows.listWorkflows() as any;
      
      // Group workflows by status for lifecycle view
      const groupedWorkflows = {
        published: workflows.filter((w: Workflow) => w.status === 'published'),
        draft: workflows.filter((w: Workflow) => w.status === 'draft'),
        archived: workflows.filter((w: Workflow) => w.status === 'archived')
      };

      // Calculate usage statistics
      const workflowStats: Record<string, { usageCount: number; lastUsed?: string }> = {};
      workflows.forEach((workflow: Workflow) => {
        const workflowProjects = projects.filter((p: Project) => p.workflowId === workflow.id);
        const usageCount = workflowProjects.length;

        const lastUsed = workflowProjects.length > 0
          ? workflowProjects.reduce((latest: string, project: Project) => {
            return new Date(project.createdAt) > new Date(latest)
              ? project.createdAt
              : latest;
          }, workflowProjects[0].createdAt)
          : undefined;
        
        workflowStats[workflow.id] = { usageCount, lastUsed };
      });
      
      return { workflows: groupedWorkflows, workflowStats, projects };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

// Enhanced Search Queries
export const useEnhancedSearchQuery = (searchTerm: string, entityType?: string) => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.search.query(searchTerm, entityType),
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { organizations: [], workspaces: [], projects: [], workflows: [] };
      }
      
      // Fetch all entities in parallel
      const organizations = await getClient().workspaces.listOrganizations() as any;

      // Fetch all workspaces and projects by hierarchy
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const workflows = await (await getClient()).workflows.listWorkflows() as any;
      
      // Perform search across all entities
      const results = searchEntities(
        organizations, 
        workspaces, 
        projects, 
        workflows, 
        { query: searchTerm }
      );
      
      return results;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,   // 5 minutes
  });
};

// Statistics Queries
export const useProjectCentricStatsQuery = () => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.stats.projectCentric(),
    queryFn: async () => {
      // Fetch all data by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const [workflows, sandboxes] = await Promise.all([
        (await getClient()).workflows.listWorkflows() as any,
        (await getClient()).sandboxes.listSandboxes() as any
      ]);

      // Calculate comprehensive statistics
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: Project) => p.sandboxId).length;
      const boundProjects = projects.filter((p: Project) => p.workflowId).length;
      const unboundProjects = totalProjects - boundProjects;

      const workflowDistribution: Record<string, number> = {};
      projects.forEach((project: Project) => {
        if (project.workflowId) {
          workflowDistribution[project.workflowId] =
            (workflowDistribution[project.workflowId] || 0) + 1;
        }
      });
      
      return {
        totalProjects,
        activeProjects,
        inactiveProjects: totalProjects - activeProjects,
        boundProjects,
        unboundProjects,
        totalOrganizations: organizations.length,
        totalWorkspaces: workspaces.length,
        totalWorkflows: workflows.length,
        totalSandboxes: sandboxes.length,
        workflowDistribution,
        projectGrowthRate: calculateGrowthRate(projects)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

export const useOrganizationCentricStatsQuery = () => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.stats.organizationCentric(),
    queryFn: async () => {
      // Fetch all data by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      // Calculate organization-centric statistics
      const orgProjectCounts: Record<string, number> = {};
      organizations.forEach((org: Organization) => {
        const orgWorkspaces = workspaces.filter((ws: Workspace) => ws.organizationId === org.id);
        const workspaceIds = orgWorkspaces.map((ws: Workspace) => ws.id);
        const orgProjects = projects.filter((p: Project) => workspaceIds.includes(p.workspaceId)).length;
        orgProjectCounts[org.id] = orgProjects;
      });
      
      const totalProjects = projects.length;
      const avgProjectsPerOrg = totalProjects / Math.max(organizations.length, 1);
      
      // Find largest organization
      const largestOrgId = Object.keys(orgProjectCounts).reduce((maxId, id) => 
        orgProjectCounts[id] > (orgProjectCounts[maxId] || 0) ? id : maxId, 
      ''
      );
      
      const largestOrg = organizations.find((org: Organization) => org.id === largestOrgId);
      
      return {
        totalOrganizations: organizations.length,
        totalWorkspaces: workspaces.length,
        totalProjects,
        avgProjectsPerOrg,
        largestOrganization: largestOrg ? {
          name: largestOrg.name,
          projectCount: orgProjectCounts[largestOrgId]
        } : null,
        organizationDistribution: orgProjectCounts
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

export const useWorkflowCentricStatsQuery = () => {
  return useQuery({
    queryKey: VIEW_OPTIMIZED_KEYS.stats.workflowCentric(),
    queryFn: async () => {
      // Fetch all data by hierarchy
      const organizations = await getClient().workspaces.listOrganizations() as any;
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await getClient().workspaces.listWorkspaces(org.id) as any;

        for (const ws of orgWorkspaces) {
          const wsProjects = await getClient().workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      const workflows = await (await getClient()).workflows.listWorkflows() as any;

      // Calculate workflow-centric statistics
      const workflowUsage: Record<string, { count: number; name: string }> = {};
      workflows.forEach((workflow: Workflow) => {
        const projectCount = projects.filter((p: Project) => p.workflowId === workflow.id).length;
        workflowUsage[workflow.id] = {
          count: projectCount,
          name: workflow.name
        };
      });

      const totalProjects = projects.length;
      const boundProjects = projects.filter((p: Project) => p.workflowId).length;
      const workflowAdoptionRate = totalProjects > 0 ? (boundProjects / totalProjects) * 100 : 0;

      // Find most popular workflow
      const mostPopularWorkflowId = Object.keys(workflowUsage).reduce((maxId, id) =>
        workflowUsage[id].count > (workflowUsage[maxId]?.count || 0) ? id : maxId,
      ''
      );

      const mostPopularWorkflow = mostPopularWorkflowId
        ? workflowUsage[mostPopularWorkflowId]
        : null;

      return {
        totalWorkflows: workflows.length,
        totalProjects,
        boundProjects,
        unboundProjects: totalProjects - boundProjects,
        workflowAdoptionRate,
        mostPopularWorkflow,
        workflowUsage,
        workflowStatusDistribution: {
          published: workflows.filter((w: Workflow) => w.status === 'published').length,
          draft: workflows.filter((w: Workflow) => w.status === 'draft').length,
          archived: workflows.filter((w: Workflow) => w.status === 'archived').length
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
};

// Utility function to calculate growth rate
function calculateGrowthRate(entities: { createdAt: string }[]): number {
  if (entities.length === 0) return 0;
  
  // Sort entities by creation date
  const sortedEntities = [...entities].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Calculate growth over the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentEntities = sortedEntities.filter(e => 
    new Date(e.createdAt) >= oneWeekAgo
  );
  
  return recentEntities.length;
}