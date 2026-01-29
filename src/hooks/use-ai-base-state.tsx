import { useState, useEffect, useCallback } from 'react';
import type { Organization, Workspace, Project, Workflow } from '@/lib/types';
import { getClient } from '@/lib/api/api-helpers';

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
  viewMode: 'hierarchy' | 'grid' | 'list' | 'tree';
  expandedOrganizations: Record<string, boolean>;
  expandedWorkspaces: Record<string, boolean>;
  fetchedProjectWorkspaces: Set<string>;
  isDeleteLocked: boolean;
  [key: string]: any; // For dialog states and form fields
}

// Interface for the state stored in localStorage
interface StoredAIBaseState {
  selectedOrganization?: string | null;
  selectedWorkspace?: string | null;
  selectedProject?: string | null;
  viewMode?: 'hierarchy' | 'grid' | 'list' | 'tree';
  expandedOrganizations?: Record<string, boolean>;
  expandedWorkspaces?: Record<string, boolean>;
}

interface AIBaseActions {
  // Selection actions
  handleSelectOrganization: (orgId: string | null) => void;
  handleSelectWorkspace: (wsId: string | null) => void;
  handleSelectProject: (projectId: string | null) => void;
  handleSetViewMode: (mode: 'hierarchy' | 'grid' | 'list' | 'tree') => void;
  handleSetIsDeleteLocked: (locked: boolean) => void;

  // Tree view toggle actions
  toggleOrganizationExpansion: (orgId: string) => void;
  toggleWorkspaceExpansion: (wsId: string) => void;

  // Data fetching
  fetchOrganizations: () => Promise<void>;
  fetchWorkspaces: (organizationId: string) => Promise<void>;
  fetchProjects: (workspaceId: string) => Promise<void>;
  fetchAllProjects: () => Promise<void>;
  fetchWorkflows: () => Promise<void>;

  // CRUD operations
  handleCreateOrganization: (name: string, folderPath: string) => Promise<void>;
  handleCreateWorkspace: (organizationId: string, name: string, folderPath: string) => Promise<void>;
  handleCreateProject: (workspaceId: string, name: string, folderPath: string, workflowId?: string) => Promise<void>;
  handleCreateSandbox: (projectId: string, aiConfig?: any, imageName?: string) => Promise<void>;
  handleDestroySandbox: (sandboxId: string) => Promise<void>;
  handleRecreateSandbox: (projectId: string, sandboxId: string, aiConfig?: any, imageName?: string) => Promise<void>;
  handleDeleteOrganization: (orgId: string) => Promise<void>;
  handleDeleteWorkspace: (workspaceId: string) => Promise<void>;
  handleDeleteProject: (projectId: string, deleteFolder?: boolean) => Promise<void>;
  handleMoveProject: (projectId: string, targetWorkspaceId: string) => Promise<void>;
  handleChangeWorkflow: (projectId: string, workflowId: string | null) => Promise<void>;
}

interface AIBaseHookProps {
  initialViewMode?: 'hierarchy' | 'grid' | 'list' | 'tree';
}

export function useAIBaseState({ initialViewMode = 'hierarchy' }: AIBaseHookProps = {}): [AIBaseState, AIBaseActions] {
  // State declarations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'hierarchy' | 'grid' | 'list' | 'tree'>(initialViewMode);
  
  // State for tree view expansion - track multiple expanded items
  const [expandedOrganizations, setExpandedOrganizations] = useState<Record<string, boolean>>({});
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({});
  
  // Track which workspaces we've fetched projects for in tree view
  const [fetchedProjectWorkspaces, setFetchedProjectWorkspaces] = useState<Set<string>>(new Set());

  // Data fetching functions - these need to be declared before the functions that use them
  const fetchOrganizations = useCallback(async () => {
    try {
      const client = getClient();
      const data = await client.workspaces.listOrganizations() as any;
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, []);

  const fetchWorkspaces = useCallback(async (organizationId: string) => {
    try {
      const client = getClient();
      const data = await client.workspaces.listWorkspaces(organizationId) as any;
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  }, []);

  const fetchProjects = useCallback(async (workspaceId: string) => {
    try {
      const client = getClient();
      const data = await client.workspaces.listProjects(workspaceId) as any;
      if (viewMode === 'list') {
        // In list view, we accumulate projects from all workspaces
        setProjects(prevProjects => {
          // Filter out existing projects for this workspace
          const filteredProjects = prevProjects.filter(p => p.workspaceId !== workspaceId);
          // Add the new projects
          return [...filteredProjects, ...data];
        });
      } else {
        // In other views, behavior depends on context
        if (viewMode === 'tree') {
          // In tree view, we accumulate projects from all expanded workspaces
          setProjects(prevProjects => {
            // Filter out existing projects for this workspace
            const filteredProjects = prevProjects.filter(p => p.workspaceId !== workspaceId);
            // Add the new projects
            return [...filteredProjects, ...data];
          });
        } else {
          // In hierarchy and grid views, we only show projects for the current workspace
          setProjects(data);
        }
      }
      // Mark this workspace as having fetched projects
      setFetchedProjectWorkspaces(prev => new Set(prev).add(workspaceId));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, [viewMode]);

  const fetchWorkflows = useCallback(async () => {
    try {
      // Fetch only published workflows for binding
      const client = getClient();
      const data = await client.workflows.listWorkflows('published') as any;
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  }, []);

  const fetchAllProjects = useCallback(async () => {
    try {
      const allProjects: ExtendedProject[] = [];
      const client = getClient();

      // Fetch all organizations
      const orgs = await client.workspaces.listOrganizations() as any;

      // For each organization, fetch its workspaces
      for (const org of orgs) {
        const wspaces = await client.workspaces.listWorkspaces(org.id) as any;

        // For each workspace, fetch its projects
        for (const ws of wspaces) {
          const projs = await client.workspaces.listProjects(ws.id) as any;

          // Add organization and workspace info to each project
          const projectsWithInfo = projs.map((proj: Project) => ({
            ...proj,
            organizationId: org.id,
            organizationName: org.name,
            workspaceName: ws.name,
          }));

          allProjects.push(...projectsWithInfo);
        }
      }

      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to fetch all projects:', error);
    }
  }, []);

  const [isDeleteLocked, setIsDeleteLocked] = useState(true);
  
  // Setter function for isDeleteLocked
  const handleSetIsDeleteLocked = useCallback((locked: boolean) => {
    setIsDeleteLocked(locked);
  }, []);

  // Check if localStorage is available
  const isLocalStorageAvailable = useCallback((): boolean => {
    try {
      const testKey = '__kai_localstorage_test';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }, []);

  // State persistence functions
  const saveStateToStorage = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const state: StoredAIBaseState = {
        selectedOrganization,
        selectedWorkspace,
        selectedProject,
        viewMode,
        // Include expanded items for tree view
        expandedOrganizations,
        expandedWorkspaces,
      };
      localStorage.setItem('kai-ai-base-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  }, [selectedOrganization, selectedWorkspace, selectedProject, viewMode, expandedOrganizations, expandedWorkspaces, isLocalStorageAvailable]);

  const restoreStateFromStorage = useCallback(async () => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const storedStateStr = localStorage.getItem('kai-ai-base-state');
      if (!storedStateStr) {
        return; // No stored state to restore
      }

      let parsedState: StoredAIBaseState;
      try {
        parsedState = JSON.parse(storedStateStr);
      } catch (parseError) {
        console.error('Failed to parse stored state:', parseError);
        localStorage.removeItem('kai-ai-base-state'); // Remove corrupted state
        return;
      }

      // Validate and restore state values
      const { 
        selectedOrganization: storedOrg, 
        selectedWorkspace: storedWs, 
        selectedProject: storedProj, 
        viewMode: storedViewMode, 
        expandedOrganizations: storedExpandedOrgs,
        expandedWorkspaces: storedExpandedWss
      } = parsedState;

      // Only restore valid viewMode values
      const validViewModes: Array<'hierarchy' | 'grid' | 'list' | 'tree'> = ['hierarchy', 'grid', 'list', 'tree'];
      if (storedViewMode && validViewModes.includes(storedViewMode)) {
        setViewMode(storedViewMode);
      }

      // Restore expanded items first (before fetching data)
      if (storedExpandedOrgs && typeof storedExpandedOrgs === 'object') {
        setExpandedOrganizations(storedExpandedOrgs);
      }
      if (storedExpandedWss && typeof storedExpandedWss === 'object') {
        setExpandedWorkspaces(storedExpandedWss);
      }

      // Restore the selected items
      if (storedOrg !== undefined && storedOrg !== null) {
        // Validate that the organization still exists before selecting it
        const orgExists = organizations.some(org => org.id === storedOrg);
        if (orgExists) {
          setSelectedOrganization(storedOrg);
        }
      }
      if (storedWs !== undefined && storedWs !== null) {
        // Validate that the workspace still exists before selecting it
        const workspaceExists = workspaces.some(ws => ws.id === storedWs);
        if (workspaceExists) {
          setSelectedWorkspace(storedWs);
        }
      }
      if (storedProj !== undefined && storedProj !== null) {
        // Validate that the project still exists before selecting it
        const projectExists = projects.some(proj => proj.id === storedProj);
        if (projectExists) {
          setSelectedProject(storedProj);
        }
      }

      // After restoring state, fetch data for the selected items if they're valid
      if (storedOrg && organizations.some(org => org.id === storedOrg)) {
        await fetchWorkspaces(storedOrg);
      }
      if (storedWs && workspaces.some(ws => ws.id === storedWs)) {
        await fetchProjects(storedWs);
      }
    } catch (error) {
      console.error('Failed to restore state from storage:', error);
    }
  }, [isLocalStorageAvailable, organizations, workspaces, projects, fetchWorkspaces, fetchProjects]);

  // Selection handlers
  const handleSelectOrganization = useCallback((orgId: string | null) => {
    setSelectedOrganization(orgId);
    setSelectedWorkspace(null); // Reset workspace when organization changes
    setSelectedProject(null); // Reset project when organization changes
    saveStateToStorage();
  }, [saveStateToStorage]);

  const handleSelectWorkspace = useCallback((wsId: string | null) => {
    setSelectedWorkspace(wsId);
    setSelectedProject(null); // Reset project when workspace changes
    saveStateToStorage();
  }, [saveStateToStorage]);

  const handleSelectProject = useCallback((projectId: string | null) => {
    setSelectedProject(projectId);
    saveStateToStorage();
  }, [saveStateToStorage]);

  const handleSetViewMode = useCallback((mode: 'hierarchy' | 'grid' | 'list' | 'tree') => {
    setViewMode(mode);
    saveStateToStorage();
  }, [saveStateToStorage]);

  // Toggle expansion for tree view
  const toggleOrganizationExpansion = useCallback((orgId: string) => {
    setExpandedOrganizations(prev => {
      const isCurrentlyExpanded = prev[orgId];
      const newExpanded = { ...prev, [orgId]: !isCurrentlyExpanded };

      if (!isCurrentlyExpanded) {
        // Only fetch when expanding
        void fetchWorkspaces(orgId);
      } else {
        // When collapsing, we should also collapse all nested workspaces
        const orgWorkspaces = workspaces.filter(ws => ws.organizationId === orgId);
        const workspaceIds = orgWorkspaces.map(ws => ws.id);

        setExpandedWorkspaces(prevWs => {
          const newWsExpanded = { ...prevWs };
          workspaceIds.forEach(wsId => {
            delete newWsExpanded[wsId];
          });
          return newWsExpanded;
        });

        // Clear projects for this organization's workspaces
        setFetchedProjectWorkspaces(prev => {
          const newFetched = new Set(prev);
          workspaceIds.forEach(wsId => {
            newFetched.delete(wsId);
          });
          return newFetched;
        });
      }

      // Save state after expansion toggle
      setTimeout(() => saveStateToStorage(), 0); // Use timeout to ensure state is updated

      return newExpanded;
    });
  }, [workspaces, fetchWorkspaces, setFetchedProjectWorkspaces, saveStateToStorage]);

  const toggleWorkspaceExpansion = useCallback((wsId: string) => {
    setExpandedWorkspaces(prev => {
      const isCurrentlyExpanded = prev[wsId];
      const newExpanded = { ...prev, [wsId]: !isCurrentlyExpanded };

      if (!isCurrentlyExpanded) {
        // Only fetch when expanding
        void fetchProjects(wsId);
      } else {
        // When collapsing, clear projects for this workspace
        setFetchedProjectWorkspaces(prev => {
          const newFetched = new Set(prev);
          newFetched.delete(wsId);
          return newFetched;
        });
      }

      // Save state after expansion toggle
      setTimeout(() => saveStateToStorage(), 0); // Use timeout to ensure state is updated

      return newExpanded;
    });
  }, [fetchProjects, setFetchedProjectWorkspaces, saveStateToStorage]);

  // CRUD operations
  const handleCreateOrganization = useCallback(async (name: string, folderPath: string) => {
    try {
      const client = getClient();
      await client.workspaces.createOrganization({ name, folderPath }) as any;
      await fetchOrganizations();
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  }, [fetchOrganizations]);

  const handleCreateWorkspace = useCallback(async (organizationId: string, name: string, folderPath: string) => {
    if (!organizationId) return;
    try {
      const client = getClient();
      await client.workspaces.createWorkspace(organizationId, { name, folderPath }) as any;
      await fetchWorkspaces(organizationId);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      throw error;
    }
  }, [fetchWorkspaces]);

  const handleCreateProject = useCallback(async (workspaceId: string, name: string, folderPath: string, workflowId?: string) => {
    if (!workspaceId) return;
    try {
      const client = getClient();
      // Create project
      const newProject = await client.workspaces.createProject(workspaceId, { name, folderPath }) as any;

      // Bind workflow if provided
      if (workflowId && workflowId !== 'none') {
        await client.workspaces.updateProject(newProject.id, { workflowId }) as any;
      }

      await fetchProjects(workspaceId);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [fetchProjects]);

  const handleCreateSandbox = useCallback(async (projectId: string, aiConfig?: any, imageName?: string) => {
    try {
      const client = getClient();
      await client.sandboxes.createSandbox({
        name: '',
        folderMapping: undefined,
        projectId,
        aiConfig,
        imageName
      } as any);
      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to create sandbox:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  const handleDestroySandbox = useCallback(async (sandboxId: string) => {
    try {
      const client = getClient();
      await client.sandboxes.stopSandbox(sandboxId);
      await client.sandboxes.deleteSandbox(sandboxId);
      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to destroy sandbox:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  const handleRecreateSandbox = useCallback(async (projectId: string, sandboxId: string, aiConfig?: any, imageName?: string) => {
    try {
      const client = getClient();
      await client.sandboxes.stopSandbox(sandboxId);
      await client.sandboxes.deleteSandbox(sandboxId);
      await client.sandboxes.createSandbox({
        name: '',
        folderMapping: undefined,
        projectId,
        aiConfig,
        imageName
      } as any);
      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to recreate sandbox:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  const handleDeleteOrganization = useCallback(async (orgId: string) => {
    try {
      const client = getClient();
      await client.workspaces.deleteOrganization(orgId);
      await fetchOrganizations();
      if (selectedOrganization === orgId) {
        setSelectedOrganization(null);
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      throw error;
    }
  }, [fetchOrganizations, selectedOrganization]);

  const handleDeleteWorkspace = useCallback(async (workspaceId: string) => {
    try {
      const client = getClient();
      await client.workspaces.deleteWorkspace(workspaceId);
      if (selectedOrganization) {
        await fetchWorkspaces(selectedOrganization);
      }
      if (selectedWorkspace === workspaceId) {
        setSelectedWorkspace(null);
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      throw error;
    }
  }, [fetchWorkspaces, selectedOrganization, selectedWorkspace]);

  const handleDeleteProject = useCallback(async (projectId: string, deleteFolder: boolean = false) => {
    try {
      const client = getClient();
      await client.workspaces.deleteProject(projectId, deleteFolder);
      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  const handleMoveProject = useCallback(async (projectId: string, targetWorkspaceId: string) => {
    try {
      const client = getClient();
      await client.workspaces.moveProject(projectId, { targetWorkspaceId }) as any;
      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to move project:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  const handleChangeWorkflow = useCallback(async (projectId: string, workflowId: string | null) => {
    try {
      const client = getClient();
      // Update project with new workflow (or null to unbind)
      await client.workspaces.updateProject(projectId, {
        workflowId: workflowId === 'none' ? null : workflowId || undefined,
      }) as any;

      if (selectedWorkspace) {
        await fetchProjects(selectedWorkspace);
      }
    } catch (error) {
      console.error('Failed to change workflow:', error);
      throw error;
    }
  }, [fetchProjects, selectedWorkspace]);

  // Initialize on mount
  useEffect(() => {
    // Restore the state when the component mounts
    void restoreStateFromStorage();

    void fetchOrganizations();
    void fetchWorkflows();
  }, [restoreStateFromStorage, fetchOrganizations, fetchWorkflows]);

  // Effects to handle fetching based on selection
  useEffect(() => {
    if (selectedOrganization) {
      void fetchWorkspaces(selectedOrganization);
      // Only reset workspace when not in tree view mode
      if (viewMode !== 'tree') {
        setSelectedWorkspace(null);
      }
    }
  }, [selectedOrganization, viewMode, fetchWorkspaces]);

  useEffect(() => {
    if (selectedWorkspace) {
      // Only fetch projects if not in tree view, since tree view handles this differently
      if (viewMode !== 'tree') {
        void fetchProjects(selectedWorkspace);
      }
    }
  }, [selectedWorkspace, viewMode, fetchProjects]);

  // Effect to handle fetching projects based on view mode
  useEffect(() => {
    if (viewMode === 'list') {
      // In list view, fetch all projects
      void fetchAllProjects();
    } else if (viewMode === 'tree') {
      // In tree view, we fetch projects for expanded workspaces as needed
      // This is handled by the tree view expansion logic
    } else {
      // In hierarchy and grid views, fetch projects for the selected workspace if applicable
      if (selectedWorkspace) {
        void fetchProjects(selectedWorkspace);
      } else {
        // Clear projects when no workspace is selected
        setProjects([]);
        setFetchedProjectWorkspaces(new Set());
      }
    }
  }, [viewMode, selectedWorkspace, fetchAllProjects, fetchProjects]);

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
  };

  const actions: AIBaseActions = {
    handleSelectOrganization,
    handleSelectWorkspace,
    handleSelectProject,
    handleSetViewMode,
    handleSetIsDeleteLocked,
    fetchOrganizations,
    fetchWorkspaces,
    fetchProjects,
    fetchAllProjects,
    fetchWorkflows,
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
    toggleOrganizationExpansion,
    toggleWorkspaceExpansion,
  };

  return [state, actions];
}