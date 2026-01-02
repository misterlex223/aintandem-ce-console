import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/lib/api/api-helpers';
import type {
  Organization,
  Workspace,
  Project,
  Sandbox,
  Workflow
} from '@/lib/types';

// Query keys for organization data
const ORGANIZATION_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
  list: (filters?: string) => [...ORGANIZATION_KEYS.lists(), filters] as const,
  details: () => [...ORGANIZATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORGANIZATION_KEYS.details(), id] as const,
};

// Query keys for workspace data
const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  lists: () => [...WORKSPACE_KEYS.all, 'list'] as const,
  list: (orgId: string) => [...WORKSPACE_KEYS.lists(), orgId] as const,
  details: () => [...WORKSPACE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORKSPACE_KEYS.details(), id] as const,
};

// Query keys for project data
const PROJECT_KEYS = {
  all: ['projects'] as const,
  lists: () => [...PROJECT_KEYS.all, 'list'] as const,
  list: (wsId: string) => [...PROJECT_KEYS.lists(), wsId] as const,
  details: () => [...PROJECT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
};

// Query keys for sandbox data
const SANDBOX_KEYS = {
  all: ['sandboxes'] as const,
  lists: () => [...SANDBOX_KEYS.all, 'list'] as const,
  list: () => [...SANDBOX_KEYS.lists()] as const,
  details: () => [...SANDBOX_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SANDBOX_KEYS.details(), id] as const,
};

// Query keys for workflow data
const WORKFLOW_KEYS = {
  all: ['workflows'] as const,
  lists: () => [...WORKFLOW_KEYS.all, 'list'] as const,
  list: (status?: string) => [...WORKFLOW_KEYS.lists(), status] as const,
  details: () => [...WORKFLOW_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORKFLOW_KEYS.details(), id] as const,
};

// Export query keys so they can be used elsewhere
export {
  ORGANIZATION_KEYS,
  WORKSPACE_KEYS,
  PROJECT_KEYS,
  SANDBOX_KEYS,
  WORKFLOW_KEYS,
};

// Organization Queries
export const useOrganizationsQuery = () => {
  return useQuery<Organization[]>({
    queryKey: ORGANIZATION_KEYS.lists(),
    queryFn: async () => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.listOrganizations() as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrganizationQuery = (id: string) => {
  return useQuery<Organization>({
    queryKey: ORGANIZATION_KEYS.detail(id),
    queryFn: async () => {
      const client = getClient();
      return client.workspaces.getOrganization(id) as any;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Workspace Queries
export const useWorkspacesQuery = (organizationId?: string) => {
  return useQuery<Workspace[]>({
    queryKey: WORKSPACE_KEYS.list(organizationId || ''),
    queryFn: async () => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.listWorkspaces(organizationId || '') as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!organizationId, // only fetch if organizationId is provided
  });
};

export const useWorkspaceQuery = (id: string) => {
  return useQuery<Workspace>({
    queryKey: WORKSPACE_KEYS.detail(id),
    queryFn: async () => {
      const client = getClient();
      return client.workspaces.getWorkspace(id) as any;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Project Queries
export const useProjectsQuery = (workspaceId?: string) => {
  return useQuery<Project[]>({
    queryKey: PROJECT_KEYS.list(workspaceId || ''),
    queryFn: async () => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.listProjects(workspaceId || '') as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!workspaceId, // only fetch if workspaceId is provided
  });
};

export const useProjectQuery = (id: string) => {
  return useQuery<Project>({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: async () => {
      const client = getClient();
      return client.workspaces.getProject(id) as any;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Sandbox Queries
export const useSandboxesQuery = () => {
  return useQuery<Sandbox[]>({
    queryKey: SANDBOX_KEYS.list(),
    queryFn: async () => {
      const client = getClient();
      return client.sandboxes.listSandboxes() as any;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSandboxQuery = (id: string) => {
  return useQuery<Sandbox>({
    queryKey: SANDBOX_KEYS.detail(id),
    queryFn: async () => {
      const client = getClient();
      return client.sandboxes.getSandbox(id) as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Workflow Queries
export const useWorkflowsQuery = (status?: 'published' | 'draft' | 'archived') => {
  return useQuery<Workflow[]>({
    queryKey: WORKFLOW_KEYS.list(status),
    queryFn: async () => {
      const client = getClient();
      return client.workflows.listWorkflows(status) as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations
export const useCreateOrganizationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, folderPath }: { name: string; folderPath: string }) => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.createOrganization({ name, folderPath }) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
    },
  });
};

export const useUpdateOrganizationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Organization, 'name' | 'folderPath'>> }) => {
      const client = getClient();
      return client.workspaces.updateOrganization(id, data) as any;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
      queryClient.setQueryData(ORGANIZATION_KEYS.detail(data.id), data);
    },
  });
};

export const useDeleteOrganizationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const client = getClient();
      return client.workspaces.deleteOrganization(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
    },
  });
};

export const useCreateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, name, folderPath }: { organizationId: string; name: string; folderPath: string }) => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.createWorkspace(organizationId, { name, folderPath }) as any;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.list(organizationId) });
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
    },
  });
};

export const useUpdateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Workspace, 'name' | 'folderPath'>> }) => {
      const client = getClient();
      return client.workspaces.updateWorkspace(id, data) as any;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.lists() });
      queryClient.setQueryData(WORKSPACE_KEYS.detail(data.id), data);
    },
  });
};

export const useDeleteWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const client = getClient();
      return client.workspaces.deleteWorkspace(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.lists() });
    },
  });
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, name, folderPath }: { workspaceId: string; name: string; folderPath: string }) => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.createProject(workspaceId, { name, folderPath }) as any;
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.list(data.workspaceId) });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const client = getClient();
      // TODO: Fix SDK type incompatibility, remove any type assertion
      return client.workspaces.updateProject(id, data) as any;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.setQueryData(PROJECT_KEYS.detail(data.id), data);
    },
  });
};

export const useDeleteProjectMutation = (workspaceId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteFolder }: { id: string; deleteFolder?: boolean }) => {
      const client = getClient();
      // SDK now supports deleteFolder parameter
      // TODO: Fix SDK type incompatibility, remove any type assertion
      if (deleteFolder) {
        return client.workspaces.deleteProject(id) as any;
      }
      return client.workspaces.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(workspaceId) });
      }
    },
  });
};

export const useCreateSandboxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, folderMapping, projectId }: { name?: string; folderMapping?: string; projectId?: string }) => {
      const client = getClient();
      return client.sandboxes.createSandbox({
        name: name || '',
        folderMapping,
        projectId
      } as any) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with new sandbox info
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
    },
  });
};

export const useStartSandboxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.sandboxes.startSandbox(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
    },
  });
};

export const useStopSandboxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.sandboxes.stopSandbox(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with updated sandbox status
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
    },
  });
};

export const useDeleteSandboxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const client = getClient();
      await client.sandboxes.deleteSandbox(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with removed sandbox info
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
    },
  });
};
