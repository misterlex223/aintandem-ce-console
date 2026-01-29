import { create } from 'zustand';

interface SandboxUIState {
  // Dialog states
  isSourceDialogOpen: boolean;

  // Source dialog related states
  sourceProjectId: string | null;
  sourceProjectPath: string | null;

  // Actions for dialogs
  setIsSourceDialogOpen: (open: boolean) => void;
  setSourceProjectId: (id: string | null) => void;
  setSourceProjectPath: (path: string | null) => void;
  
  // Actions to reset dialog states
  resetSourceDialog: () => void;
}

export const useSandboxUIStore = create<SandboxUIState>((set) => ({
  // Dialog states
  isSourceDialogOpen: false,

  // Source dialog related states
  sourceProjectId: null,
  sourceProjectPath: null,

  // Dialog actions
  setIsSourceDialogOpen: (open) => set({ isSourceDialogOpen: open }),
  setSourceProjectId: (id) => set({ sourceProjectId: id }),
  setSourceProjectPath: (path) => set({ sourceProjectPath: path }),
  
  // Reset functions
  resetSourceDialog: () => set({
    isSourceDialogOpen: false,
    sourceProjectId: null,
    sourceProjectPath: null,
  }),
}));