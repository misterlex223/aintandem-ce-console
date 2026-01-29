// This file contains shared type definitions for API responses and other data structures.

export interface ApiError {
  message: string;
}

export interface Sandbox {
  id: string;
  name: string;
  status: string;
  folderMapping: string;
  portMapping?: string;
  createdAt: string;
  projectId?: string;
  workspaceId?: string;
}

export interface Organization {
  id: string;
  name: string;
  folderPath: string; // Relative path from KAI_BASE_ROOT
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepStatus {
  stepId: string;
  status: 'pending' | 'in-progress' | 'completed';
  updatedAt: string;
}

export interface WorkflowState {
  currentPhaseId: string; // rapid-prototyping, automated-qa, continuous-optimization
  currentStepId: string | null;
  stepStatuses: Record<string, 'pending' | 'in-progress' | 'completed'>;
  lastUpdated: string;
}

export interface AIWindowConfig {
  type: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface FolderMapping {
  hostPath: string;
  containerPath: string;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
}

export interface AIConfig {
  aiWindows: AIWindowConfig[];
  enableDockerOutofDocker?: boolean;
  folderMappings?: FolderMapping[];
  portMappings?: PortMapping[];
  environmentVariables?: EnvironmentVariable[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  folderPath: string;
  sandboxId?: string;
  sandboxName?: string;
  workflowId?: string | null; // Reference to bound workflow (can be null when unbound)
  workflowVersionId?: string | null; // Reference to specific version (can be null)
  workflowState?: WorkflowState;
  aiConfig?: AIConfig; // Saved AI tool configuration
  createdAt: string;
  updatedAt: string;
}

export interface ExtendedProject extends Project {
  organizationId?: string;
  organizationName?: string;
  workspaceName?: string;
  workflowId?: string | null; // Make workflowId explicitly nullable
}

// Workflow Definition Types
export interface WorkflowLink {
  name: string;
  path: string;
  description: string;
  phase: string;
  id?: string; // Optional ID for identification and editing
}

// Task Definition Types
export interface Task {
  id: string;
  title: string;
  description: string;
  qwenCodePrompt: string;
  taskFile?: string; // Path to task definition file (migrated from workflowLinks)
  parameters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: 'process' | 'milestone' | 'decision' | 'documentation';
  // Integrated task fields (new structure)
  hasExecutableTask?: boolean;
  qwenCodePrompt?: string;
  taskFile?: string;
  // Legacy fields for compatibility
  taskId?: string;
  workflows?: WorkflowLink[];
}

export interface Phase {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  color: string;
  icon?: string;
  steps: WorkflowStep[];
}

export interface PhaseTransition {
  from: string;
  to: string;
  label?: string;
  type: 'forward' | 'feedback' | 'loop';
}

export interface WorkflowDefinition {
  phases: Phase[];
  transitions: PhaseTransition[];
}

// Workflow Entity
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'published' | 'draft' | 'archived';
  currentVersion: number;
  definition: WorkflowDefinition;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Workflow Version for history tracking
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  createdAt: string;
  changeDescription?: string;
}

export interface TaskArtifact {
  path: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface TaskExecution {
  id: string;
  projectId: string;
  stepId: string;
  sandboxId: string;
  prompt: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
  userId?: string;
  // Extended fields
  isAdhoc?: boolean;
  title?: string;
  description?: string;
  artifacts?: TaskArtifact[];
  terminalOutput?: string;
  duration?: number;
  // Context integration fields (Phase 2)
  contextMemoryIds?: string[]; // Context injected into task prompt
  generatedMemoryId?: string; // Auto-captured dialog memory
  contextUsage?: {
    retrieved: number; // # of memories searched
    injected: number; // # of memories used in prompt
    generated: number; // # of new memories created
  };
}

export interface TaskFilter {
  status?: string[];
  type?: 'workflow' | 'adhoc';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TaskHistoryResponse {
  tasks: TaskExecution[];
  total: number;
}

export interface DirectoryListing {
  currentPath: string;
  directories: string[];
}

// Sandbox Image Types
export interface SandboxImage {
  id: string;
  name: string;
  tags?: string[];
  icon?: string;
  isDefault?: boolean;
  platform?: string;
}

export interface SandboxImagesListResponse {
  images: SandboxImage[];
  total: number;
  defaultImageId: string;
}
