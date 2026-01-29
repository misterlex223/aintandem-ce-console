import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClient, listSandboxImages } from '@/lib/api/api-helpers';
import type {
  Sandbox,
  Organization,
  Workspace,
  Project,
  SandboxImagesListResponse
} from '@/lib/types';

// Query keys for sandbox data
const SANDBOX_KEYS = {
  all: ['sandboxes'] as const,
  lists: () => [...SANDBOX_KEYS.all, 'list'] as const,
  list: () => [...SANDBOX_KEYS.lists()] as const,
  details: () => [...SANDBOX_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SANDBOX_KEYS.details(), id] as const,
};

// Query keys for organization data
const ORGANIZATION_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
  list: () => [...ORGANIZATION_KEYS.lists()] as const,
  details: () => [...ORGANIZATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORGANIZATION_KEYS.details(), id] as const,
};

// Query keys for workspace data
const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  lists: () => [...WORKSPACE_KEYS.all, 'list'] as const,
  list: () => [...WORKSPACE_KEYS.lists()] as const,
  details: () => [...WORKSPACE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORKSPACE_KEYS.details(), id] as const,
};

// Query keys for project data
const PROJECT_KEYS = {
  all: ['projects'] as const,
  lists: () => [...PROJECT_KEYS.all, 'list'] as const,
  list: () => [...PROJECT_KEYS.lists()] as const,
  details: () => [...PROJECT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
};

// Query keys for sandbox images
const SANDBOX_IMAGE_KEYS = {
  all: ['sandbox-images'] as const,
  lists: () => [...SANDBOX_IMAGE_KEYS.all, 'list'] as const,
  list: () => [...SANDBOX_IMAGE_KEYS.lists()] as const,
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

// Organization Queries
export const useOrganizationsQuery = () => {
  return useQuery<Organization[]>({
    queryKey: ORGANIZATION_KEYS.list(),
    queryFn: async () => {
      const client = getClient();
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
export const useWorkspacesQuery = (organizationId: string) => {
  return useQuery<Workspace[]>({
    queryKey: WORKSPACE_KEYS.list(),
    queryFn: async () => {
      const client = getClient();
      return client.workspaces.listWorkspaces(organizationId) as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!organizationId,
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
export const useProjectsQuery = (workspaceId: string) => {
  return useQuery<Project[]>({
    queryKey: PROJECT_KEYS.list(),
    queryFn: async () => {
      const client = getClient();
      return client.workspaces.listProjects(workspaceId) as any;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!workspaceId,
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

// Sandbox Images Queries
export const useSandboxImagesQuery = () => {
  return useQuery<SandboxImagesListResponse>({
    queryKey: SANDBOX_IMAGE_KEYS.list(),
    queryFn: async () => {
      return listSandboxImages() as any;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Combined Queries
export const useAllSandboxDataQuery = () => {
  return useQuery<{
    sandboxes: Sandbox[];
    organizations: Organization[];
    workspaces: Workspace[];
    projects: Project[];
  }>({
    queryKey: ['all-sandbox-data'],
    queryFn: async () => {
      const client = getClient();
      const [sandboxes, organizations] = await Promise.all([
        client.sandboxes.listSandboxes() as any,
        client.workspaces.listOrganizations() as any,
      ]);

      // Fetch all workspaces for each organization
      const workspaces: Workspace[] = [];
      const projects: Project[] = [];

      for (const org of organizations) {
        const orgWorkspaces = await client.workspaces.listWorkspaces(org.id) as any;
        workspaces.push(...orgWorkspaces);

        // Fetch all projects for each workspace
        for (const ws of orgWorkspaces) {
          const wsProjects = await client.workspaces.listProjects(ws.id) as any;
          projects.push(...wsProjects);
        }
      }

      return { sandboxes, organizations, workspaces, projects };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutations
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
    },
  });
};

export const useCreateSandboxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, folderMapping, projectId, imageName }: { name?: string; folderMapping?: string; projectId?: string; imageName?: string }) => {
      const client = getClient();
      return client.sandboxes.createSandbox({
        name: name || '',
        folderMapping,
        projectId,
        imageName
      } as any) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
    },
  });
};
