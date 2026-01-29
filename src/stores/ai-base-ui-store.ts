import { create } from 'zustand';

interface AIBaseUIState {
  // Dialog states
  isOrgDialogOpen: boolean;
  isWorkspaceDialogOpen: boolean;
  isProjectDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isMoveDialogOpen: boolean;
  isDeleteOrgDialogOpen: boolean;
  isDeleteWorkspaceDialogOpen: boolean;
  isChangeWorkflowDialogOpen: boolean;

  // Form field states
  newOrgName: string;
  newOrgFolderPath: string;
  newWorkspaceName: string;
  newWorkspacePath: string;
  newProjectName: string;
  newProjectPath: string;
  selectedWorkflowId: string;

  // Other dialog related states
  projectToDelete: string | null;
  deleteFolder: boolean;
  deleteConfirmation: string;
  projectToMove: string | null;
  targetWorkspaceId: string;
  orgToDelete: string | null;
  workspaceToDelete: string | null;
  projectToChangeWorkflow: string | null;
  
  // Actions for dialogs
  setIsOrgDialogOpen: (open: boolean) => void;
  setIsWorkspaceDialogOpen: (open: boolean) => void;
  setIsProjectDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setIsMoveDialogOpen: (open: boolean) => void;
  setIsDeleteOrgDialogOpen: (open: boolean) => void;
  setIsDeleteWorkspaceDialogOpen: (open: boolean) => void;
  setIsChangeWorkflowDialogOpen: (open: boolean) => void;

  // Actions for form fields
  setNewOrgName: (name: string) => void;
  setNewOrgFolderPath: (path: string) => void;
  setNewWorkspaceName: (name: string) => void;
  setNewWorkspacePath: (path: string) => void;
  setNewProjectName: (name: string) => void;
  setNewProjectPath: (path: string) => void;
  setSelectedWorkflowId: (id: string) => void;

  // Actions for other states
  setProjectToDelete: (id: string | null) => void;
  setDeleteFolder: (checked: boolean) => void;
  setDeleteConfirmation: (value: string) => void;
  setProjectToMove: (id: string | null) => void;
  setTargetWorkspaceId: (id: string) => void;
  setOrgToDelete: (id: string | null) => void;
  setWorkspaceToDelete: (id: string | null) => void;
  setProjectToChangeWorkflow: (id: string | null) => void;

  // Reset functions
  resetDeleteDialog: () => void;
  resetMoveDialog: () => void;
}

export const useAIBaseUIStore = create<AIBaseUIState>((set) => ({
  // Dialog states
  isOrgDialogOpen: false,
  isWorkspaceDialogOpen: false,
  isProjectDialogOpen: false,
  isDeleteDialogOpen: false,
  isMoveDialogOpen: false,
  isDeleteOrgDialogOpen: false,
  isDeleteWorkspaceDialogOpen: false,
  isChangeWorkflowDialogOpen: false,

  // Form states
  newOrgName: '',
  newOrgFolderPath: '',
  newWorkspaceName: '',
  newWorkspacePath: '',
  newProjectName: '',
  newProjectPath: '',
  selectedWorkflowId: '',

  // Other states
  projectToDelete: null,
  deleteFolder: false,
  deleteConfirmation: '',
  projectToMove: null,
  targetWorkspaceId: '',
  orgToDelete: null,
  workspaceToDelete: null,
  projectToChangeWorkflow: null,

  // Dialog actions
  setIsOrgDialogOpen: (open) => set({ isOrgDialogOpen: open }),
  setIsWorkspaceDialogOpen: (open) => set({ isWorkspaceDialogOpen: open }),
  setIsProjectDialogOpen: (open) => set({ isProjectDialogOpen: open }),
  setIsDeleteDialogOpen: (open) => set({ isDeleteDialogOpen: open }),
  setIsMoveDialogOpen: (open) => set({ isMoveDialogOpen: open }),
  setIsDeleteOrgDialogOpen: (open) => set({ isDeleteOrgDialogOpen: open }),
  setIsDeleteWorkspaceDialogOpen: (open) => set({ isDeleteWorkspaceDialogOpen: open }),
  setIsChangeWorkflowDialogOpen: (open) => set({ isChangeWorkflowDialogOpen: open }),

  // Form actions
  setNewOrgName: (name) => set({ newOrgName: name }),
  setNewOrgFolderPath: (path) => set({ newOrgFolderPath: path }),
  setNewWorkspaceName: (name) => set({ newWorkspaceName: name }),
  setNewWorkspacePath: (path) => set({ newWorkspacePath: path }),
  setNewProjectName: (name) => set({ newProjectName: name }),
  setNewProjectPath: (path) => set({ newProjectPath: path }),
  setSelectedWorkflowId: (id) => set({ selectedWorkflowId: id }),

  // State actions
  setProjectToDelete: (id) => set({ projectToDelete: id }),
  setDeleteFolder: (checked) => set({ deleteFolder: checked }),
  setDeleteConfirmation: (value) => set({ deleteConfirmation: value }),
  setProjectToMove: (id) => set({ projectToMove: id }),
  setTargetWorkspaceId: (id) => set({ targetWorkspaceId: id }),
  setOrgToDelete: (id) => set({ orgToDelete: id }),
  setWorkspaceToDelete: (id) => set({ workspaceToDelete: id }),
  setProjectToChangeWorkflow: (id) => set({ projectToChangeWorkflow: id }),

  // Reset functions
  resetDeleteDialog: () => set({
    projectToDelete: null,
    deleteFolder: false,
    deleteConfirmation: '',
    isDeleteDialogOpen: false,
  }),
  
  resetMoveDialog: () => set({
    projectToMove: null,
    targetWorkspaceId: '',
    isMoveDialogOpen: false,
  }),
}));