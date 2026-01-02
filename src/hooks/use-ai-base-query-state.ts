import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Organization, Workspace, Project, Workflow } from '@/lib/types';
import { getClient } from '@/lib/api/api-helpers';
import { useAIBaseNavigationStore } from '@/stores/ai-base-navigation-store';
import {
  useOrganizationsQuery,
  useWorkspacesQuery,
  useProjectsQuery,
  useWorkflowsQuery,
  useCreateOrganizationMutation,
  useCreateWorkspaceMutation,
  useCreateProjectMutation,
  useCreateSandboxMutation,
  useDeleteOrganizationMutation,
  useDeleteWorkspaceMutation,
  useDeleteProjectMutation,
  SANDBOX_KEYS,
  PROJECT_KEYS,
} from '@/services/query-hooks';

interface ExtendedProject extends Project {
  organizationId?: string;
  organizationName?: string;
  workspaceName?: string;
  workflowId?: string | null; // Make workflowId explicitly nullable
}

interface AIBaseState {
  organizations: Organization[];
  workspaces: Workspace[];
  projects: ExtendedProject[];
  workflows: Workflow[];
  selectedOrganization: string | null;
  selectedWorkspace: string | null;
  selectedProject: string | null;
  viewMode: 'hierarchy' | 'grid' | 'list' | 'tree' | 'project-centric' | 'org-centric' | 'workflow-centric';
  expandedOrganizations: Record<string, boolean>;
  expandedWorkspaces: Record<string, boolean>;
  fetchedProjectWorkspaces: Set<string>;
  isDeleteLocked: boolean;
  isLoading: {
    organizations: boolean;
    workspaces: boolean;
    projects: boolean;
    workflows: boolean;
  };
  refetch: {
    organizations: () => void;
    workspaces: () => void;
    projects: () => void;
    workflows: () => void;
  };
}

interface AIBaseActions {
  // Selection actions
  handleSelectOrganization: (orgId: string | null) => void;
  handleSelectWorkspace: (wsId: string | null) => void;
  handleSelectProject: (projectId: string | null) => void;
  handleSetViewMode: (mode: 'hierarchy' | 'grid' | 'list' | 'tree' | 'project-centric' | 'org-centric' | 'workflow-centric') => void;
  handleSetIsDeleteLocked: (locked: boolean) => void;
  
  // Tree view toggle actions
  toggleOrganizationExpansion: (orgId: string) => void;
  toggleWorkspaceExpansion: (wsId: string) => void;
  
  // CRUD operations using mutations
  handleCreateOrganization: (name: string, folderPath: string) => Promise<void>;
  handleCreateWorkspace: (organizationId: string, name: string, folderPath: string) => Promise<void>;
  handleCreateProject: (workspaceId: string, name: string, folderPath: string, workflowId?: string) => Promise<void>;
  handleCreateSandbox: (projectId: string) => Promise<void>;
  handleDestroySandbox: (sandboxId: string) => Promise<void>;
  handleRecreateSandbox: (projectId: string, sandboxId: string) => Promise<void>;
  handleDeleteOrganization: (orgId: string) => Promise<void>;
  handleDeleteWorkspace: (workspaceId: string) => Promise<void>;
  handleDeleteProject: (projectId: string, deleteFolder?: boolean) => Promise<void>;
  handleMoveProject: (projectId: string, targetWorkspaceId: string) => Promise<void>;
  handleChangeWorkflow: (projectId: string, workflowId: string | null) => Promise<void>;
}

interface AIBaseHookProps {
  initialViewMode?: 'hierarchy' | 'grid' | 'list' | 'tree' | 'project-centric' | 'org-centric' | 'workflow-centric';
}

export function useAIBaseQueryState(_props: AIBaseHookProps = {}): [AIBaseState, AIBaseActions] {
  const queryClient = useQueryClient();
  
  // Use Zustand stores for navigation state
  const {
    selectedOrganization,
    selectedWorkspace,
    selectedProject,
    viewMode,
    expandedOrganizations,
    expandedWorkspaces,
    isDeleteLocked,
    setSelectedOrganization,
    setSelectedWorkspace,
    setSelectedProject,
    setViewMode,
    toggleOrganizationExpansion,
    toggleWorkspaceExpansion,
    setIsDeleteLocked,
    resetWorkspaceAndProject,
    resetProject,
  } = useAIBaseNavigationStore();

  // Use TanStack Query for server state
  const {
    data: organizations = [],
    isLoading: organizationsLoading,
    refetch: refetchOrganizations,
  } = useOrganizationsQuery();
  
  const {
    data: workflows = [],
    isLoading: workflowsLoading,
    refetch: refetchWorkflows,
  } = useWorkflowsQuery('published');
  
  // Use dependent queries that only run when needed
  const {
    data: workspaces = [],
    isLoading: workspacesLoading,
    refetch: refetchWorkspaces,
  } = useWorkspacesQuery(selectedOrganization || undefined);
  
  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useProjectsQuery(selectedWorkspace || undefined);

  // Track which workspaces we've fetched projects for in tree view (not used in new implementation)
  const fetchedProjectWorkspaces = new Set<string>();

  // Get mutations
  const createOrganizationMutation = useCreateOrganizationMutation();
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const createProjectMutation = useCreateProjectMutation();
  const createSandboxMutation = useCreateSandboxMutation();
  const deleteOrganizationMutation = useDeleteOrganizationMutation();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const deleteProjectMutation = useDeleteProjectMutation(selectedWorkspace || undefined);

  // Selection handlers that update Zustand state
  const handleSelectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrganization(orgId);
    if (orgId !== selectedOrganization) {
      resetWorkspaceAndProject();
    }
  }, [setSelectedOrganization, resetWorkspaceAndProject, selectedOrganization]);

  const handleSelectWorkspace = useCallback((wsId: string | null) => {
    setSelectedWorkspace(wsId);
    if (wsId !== selectedWorkspace) {
      resetProject();
    }
  }, [setSelectedWorkspace, resetProject, selectedWorkspace]);

  const handleSelectProject = useCallback((projectId: string | null) => {
    setSelectedProject(projectId);
  }, [setSelectedProject]);

  const handleSetViewMode = useCallback((mode: 'hierarchy' | 'grid' | 'list' | 'tree' | 'project-centric' | 'org-centric' | 'workflow-centric') => {
    setViewMode(mode);
  }, [setViewMode]);

  const handleSetIsDeleteLocked = useCallback((locked: boolean) => {
    setIsDeleteLocked(locked);
  }, [setIsDeleteLocked]);

  // Toggle expansion (using Zustand store now)
  const toggleOrganizationExpansionWrapped = useCallback((orgId: string) => {
    toggleOrganizationExpansion(orgId);
  }, [toggleOrganizationExpansion]);

  const toggleWorkspaceExpansionWrapped = useCallback((wsId: string) => {
    toggleWorkspaceExpansion(wsId);
  }, [toggleWorkspaceExpansion]);

  // CRUD operations using mutations
  const handleCreateOrganization = useCallback(async (name: string, folderPath: string) => {
    try {
      await createOrganizationMutation.mutateAsync({ name, folderPath });
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }, [createOrganizationMutation]);

  const handleCreateWorkspace = useCallback(async (organizationId: string, name: string, folderPath: string) => {
    if (!organizationId) return;
    try {
      await createWorkspaceMutation.mutateAsync({ organizationId, name, folderPath });
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  }, [createWorkspaceMutation]);

  const handleCreateProject = useCallback(async (workspaceId: string, name: string, folderPath: string, workflowId?: string) => {
    if (!workspaceId) return;
    try {
      // Create project
      const newProject = await createProjectMutation.mutateAsync({ workspaceId, name, folderPath }) as Project;

      // Bind workflow if provided
      if (workflowId && workflowId !== 'none') {
        const client = getClient();
        await client.workspaces.updateProject(newProject.id, { workflowId }) as any;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [createProjectMutation]);

  const handleCreateSandbox = useCallback(async (projectId: string) => {
    try {
      // Get the project first to access its workspaceId
      const project = projects.find(p => p.id === projectId);
      await createSandboxMutation.mutateAsync({ 
        projectId, 
        folderMapping: undefined, 
        name: undefined 
      });
      // Also invalidate the all-sandbox-data query for consistency
      await queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with new sandbox info
      await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      if (project?.workspaceId) {
        await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(project.workspaceId) });
      }
    } catch (error) {
      console.error('Failed to create sandbox:', error);
      throw error;
    }
  }, [createSandboxMutation, projects, queryClient]);

  const handleDestroySandbox = useCallback(async (sandboxId: string) => {
    try {
      // Find project associated with this sandbox
      const project = projects.find(p => p.sandboxId === sandboxId);
      const client = getClient();
      await client.sandboxes.stopSandbox(sandboxId);
      await client.sandboxes.deleteSandbox(sandboxId);
      // Invalidate both queries to refresh cache
      await queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      await queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with removed sandbox info
      await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      if (project?.workspaceId) {
        await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(project.workspaceId) });
      }
    } catch (error) {
      console.error('Failed to destroy sandbox:', error);
      throw error;
    }
  }, [queryClient, projects]);

  const handleRecreateSandbox = useCallback(async (projectId: string, sandboxId: string) => {
    try {
      // Get the project first to access its workspaceId
      const project = projects.find(p => p.id === projectId);
      const client = getClient();
      await client.sandboxes.stopSandbox(sandboxId);
      await client.sandboxes.deleteSandbox(sandboxId);
      await client.sandboxes.createSandbox({
        name: `sandbox-${projectId}`,
        folderMapping: '',
        projectId
      } as any);
      // Invalidate both queries to refresh cache
      await queryClient.invalidateQueries({ queryKey: SANDBOX_KEYS.list() });
      await queryClient.invalidateQueries({ queryKey: ['all-sandbox-data'] });
      // Invalidate projects query to refresh project with updated sandbox info
      await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      if (project?.workspaceId) {
        await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(project.workspaceId) });
      }
    } catch (error) {
      console.error('Failed to recreate sandbox:', error);
      throw error;
    }
  }, [queryClient, projects]);

  const handleDeleteOrganization = useCallback(async (orgId: string) => {
    try {
      await deleteOrganizationMutation.mutateAsync(orgId);
      if (selectedOrganization === orgId) {
        setSelectedOrganization(null);
        resetWorkspaceAndProject();
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      throw error;
    }
  }, [deleteOrganizationMutation, selectedOrganization, setSelectedOrganization, resetWorkspaceAndProject]);

  const handleDeleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      await deleteWorkspaceMutation.mutateAsync(workspaceId);
      if (selectedWorkspace === workspaceId) {
        setSelectedWorkspace(null);
        resetProject();
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  }, [deleteWorkspaceMutation, selectedWorkspace, setSelectedWorkspace, resetProject]);

  const handleDeleteProject = useCallback(async (projectId: string, deleteFolder: boolean = false) => {
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId, deleteFolder });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [deleteProjectMutation]);

  const handleMoveProject = useCallback(async (projectId: string, targetWorkspaceId: string) => {
    try {
      const client = getClient();
      await client.workspaces.moveProject(projectId, { targetWorkspaceId }) as any;
    } catch (error) {
      console.error('Failed to move project:', error);
      throw error;
    }
  }, []);

  const handleChangeWorkflow = useCallback(async (projectId: string, workflowId: string | null) => {
    try {
      const client = getClient();
      // Update project with new workflow (or null to unbind)
      await client.workspaces.updateProject(projectId, {
        workflowId: workflowId === 'none' ? null : workflowId || undefined,
      }) as any;
      
      // Invalidate projects cache to refresh the UI with the new workflow info
      await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      // Also invalidate the specific project if we know which workspace it belongs to
      const project = projects.find(p => p.id === projectId);
      if (project?.workspaceId) {
        await queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.list(project.workspaceId) });
      }
    } catch (error) {
      console.error('Failed to change workflow:', error);
      throw error;
    }
  }, [queryClient, projects]);

  const state: AIBaseState = {
    organizations,
    workspaces,
    projects,
    workflows,
    selectedOrganization,
    selectedWorkspace,
    selectedProject,
    viewMode,
    expandedOrganizations,
    expandedWorkspaces,
    fetchedProjectWorkspaces,
    isDeleteLocked,
    isLoading: {
      organizations: organizationsLoading,
      workspaces: workspacesLoading,
      projects: projectsLoading,
      workflows: workflowsLoading,
    },
    refetch: {
      organizations: refetchOrganizations,
      workspaces: refetchWorkspaces,
      projects: refetchProjects,
      workflows: refetchWorkflows,
    }
  };

  const actions: AIBaseActions = {
    handleSelectOrganization,
    handleSelectWorkspace,
    handleSelectProject,
    handleSetViewMode,
    handleSetIsDeleteLocked,
    handleCreateOrganization,
    handleCreateWorkspace,
    handleCreateProject,
    handleCreateSandbox,
    handleDestroySandbox,
    handleRecreateSandbox,
    handleDeleteOrganization,
    handleDeleteWorkspace,
    handleDeleteProject,
    handleMoveProject,
    handleChangeWorkflow,
    toggleOrganizationExpansion: toggleOrganizationExpansionWrapped,
    toggleWorkspaceExpansion: toggleWorkspaceExpansionWrapped,
  };

  return [state, actions];
}