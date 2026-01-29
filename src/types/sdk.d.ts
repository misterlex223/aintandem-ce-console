// Realtime Progress Event Types
export type TaskEvent =
  | TaskQueuedEvent
  | TaskStartedEvent
  | TaskStepProgressEvent
  | TaskOutputEvent
  | TaskArtifactEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskCancelledEvent;

export interface TaskQueuedEvent {
  type: 'task_queued';
  timestamp: string;
  projectId: string;
  taskId: string;
  task?: string;
  input?: Record<string, unknown>;
}

export interface TaskStartedEvent {
  type: 'task_started';
  timestamp: string;
  projectId: string;
  taskId: string;
  task?: string;
}

export interface TaskStepProgressEvent {
  type: 'step_progress';
  timestamp: string;
  projectId: string;
  taskId: string;
  stepId?: string;
  step?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  output?: unknown;
}

export interface TaskOutputEvent {
  type: 'output';
  timestamp: string;
  projectId: string;
  taskId: string;
  stepId?: string;
  output: string;
}

export interface TaskArtifactEvent {
  type: 'artifact';
  timestamp: string;
  projectId: string;
  taskId: string;
  artifact: {
    path: string;
    type: string;
    size?: number;
  };
}

export interface TaskCompletedEvent {
  type: 'task_completed';
  timestamp: string;
  projectId: string;
  taskId: string;
  task?: string;
  output?: unknown;
  duration?: number;
}

export interface TaskFailedEvent {
  type: 'task_failed';
  timestamp: string;
  projectId: string;
  taskId: string;
  task?: string;
  error?: string;
  output?: unknown;
}

export interface TaskCancelledEvent {
  type: 'task_cancelled';
  timestamp: string;
  projectId: string;
  taskId: string;
  task?: string;
}

// Workflow Event Types
export type WorkflowEvent =
  | WorkflowExecutionCreatedEvent
  | WorkflowExecutionStartedEvent
  | WorkflowPhaseStartedEvent
  | WorkflowPhaseCompletedEvent
  | WorkflowExecutionCompletedEvent
  | WorkflowExecutionFailedEvent
  | WorkflowExecutionPausedEvent
  | WorkflowExecutionResumedEvent;

export interface WorkflowExecutionCreatedEvent {
  type: 'workflow_execution_created';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
  input?: Record<string, unknown>;
}

export interface WorkflowExecutionStartedEvent {
  type: 'workflow_execution_started';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
}

export interface WorkflowPhaseStartedEvent {
  type: 'workflow_phase_started';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
  phaseId: string;
  phase?: string;
}

export interface WorkflowPhaseCompletedEvent {
  type: 'workflow_phase_completed';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
  phaseId: string;
  phase?: string;
  output?: unknown;
}

export interface WorkflowExecutionCompletedEvent {
  type: 'workflow_execution_completed';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
  output?: unknown;
  duration?: number;
}

export interface WorkflowExecutionFailedEvent {
  type: 'workflow_execution_failed';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
  error?: string;
}

export interface WorkflowExecutionPausedEvent {
  type: 'workflow_execution_paused';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
}

export interface WorkflowExecutionResumedEvent {
  type: 'workflow_execution_resumed';
  timestamp: string;
  projectId: string;
  executionId: string;
  workflowId: string;
}

// Sandbox Event Types
export type SandboxEvent =
  | SandboxCreatedEvent
  | SandboxStartedEvent
  | SandboxStoppedEvent
  | SandboxErrorEvent;

export interface SandboxCreatedEvent {
  type: 'sandbox_created';
  timestamp: string;
  projectId: string;
  sandboxId: string;
  image?: string;
}

export interface SandboxStartedEvent {
  type: 'sandbox_started';
  timestamp: string;
  projectId: string;
  sandboxId: string;
}

export interface SandboxStoppedEvent {
  type: 'sandbox_stopped';
  timestamp: string;
  projectId: string;
  sandboxId: string;
  exitCode?: number;
}

export interface SandboxErrorEvent {
  type: 'sandbox_error';
  timestamp: string;
  projectId: string;
  sandboxId: string;
  error?: string;
}

// ProgressClient Types
export interface ProgressClient {
  connect(projectId: string): Promise<void>;
  disconnect(projectId: string): void;
  disconnectAll(): void;
  isConnected(projectId: string): boolean;
  getConnectionState(projectId: string): string;
  onConnectionState(projectId: string, callback: (event: ConnectionStateEvent) => void): () => void;
  subscribeToTask(options: TaskProgressOptions): Promise<ProgressSubscription>;
  subscribeToWorkflow(options: WorkflowProgressOptions): Promise<ProgressSubscription>;
  subscribeToSandbox(options: SandboxProgressOptions): Promise<ProgressSubscription>;
}

export interface ConnectionStateEvent {
  type: 'connected' | 'disconnected' | 'error';
  reason?: string;
  willReconnect?: boolean;
  error?: string;
}

export interface ProgressSubscription {
  unsubscribe: () => void;
}

export interface TaskProgressOptions {
  projectId: string;
  taskId?: string;
  onEvent: (event: TaskEvent) => void;
  onComplete?: (event: TaskCompletedEvent) => void;
  onFailed?: (event: TaskFailedEvent) => void;
}

export interface WorkflowProgressOptions {
  projectId: string;
  workflowId?: string;
  executionId?: string;
  onEvent: (event: WorkflowEvent) => void;
  onComplete?: (event: WorkflowExecutionCompletedEvent) => void;
  onFailed?: (event: WorkflowExecutionFailedEvent) => void;
}

export interface SandboxProgressOptions {
  projectId: string;
  sandboxId?: string;
  onEvent: (event: SandboxEvent) => void;
}

declare module '@aintandem/sdk-core' {
  export class HttpClient {
    get<T>(url: string): Promise<T>;
    post<T>(url: string, body?: any): Promise<T>;
    put<T>(url: string, body?: any): Promise<T>;
    patch<T>(url: string, body?: any): Promise<T>;
    delete<T>(url: string): Promise<T>;
  }

  export class AInTandemClient {
    constructor(config: { baseURL: string });
    readonly workflows: any;
    readonly tasks: any;
    readonly sandboxes: any;
    readonly context: any;
    readonly settings: any;
    readonly workspaces: any;

    // Advanced usage methods
    getHttpClient(): HttpClient;

    // Progress methods
    getProgress(): ProgressClient;
    subscribeToTask(
      projectId: string,
      taskId?: string,
      onEvent?: (event: TaskEvent) => void,
      onComplete?: (event: TaskCompletedEvent) => void,
      onFailed?: (event: TaskFailedEvent) => void
    ): Promise<() => void>;
    subscribeToWorkflow(
      projectId: string,
      onEvent?: (event: WorkflowEvent) => void,
      workflowId?: string,
      executionId?: string,
      onComplete?: (event: WorkflowExecutionCompletedEvent) => void,
      onFailed?: (event: WorkflowExecutionFailedEvent) => void
    ): Promise<() => void>;
    subscribeToSandbox(
      projectId: string,
      onEvent?: (event: SandboxEvent) => void,
      sandboxId?: string
    ): Promise<() => void>;
  }

  export type AInTandemClientConfig = {
    baseURL: string;
  };
}

declare module '@aintandem/sdk-react' {
  import { AInTandemClient } from '@aintandem/sdk-core';

  export function useAInTandem(): {
    client: AInTandemClient;
    isLoading: boolean;
    error: Error | null;
    isAuthenticated: boolean;
    user: any;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
  };

  export function AInTandemProvider(props: {
    children: React.ReactNode;
    config: { baseURL: string };
    onAuthSuccess?: (user: any) => void;
    onAuthError?: (error: any) => void;
  }): JSX.Element;

  export const WorkflowService: any;
  export const TaskService: any;
  export const SandboxService: any;
  export const ContextService: any;
  export const SettingsService: any;
  export const WorkspaceService: any;
}
