/**
 * Realtime Progress Hook
 *
 * Custom hook for subscribing to real-time progress updates via WebSocket.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import type { TaskEvent, WorkflowEvent, SandboxEvent } from '@/types/sdk';
import { getClient } from '@/lib/api/api-helpers';

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'disconnecting';

export interface UseRealtimeTaskProgressOptions {
  projectId: string;
  taskId?: string;
  onEvent?: (event: TaskEvent) => void;
  onComplete?: (event: TaskEvent) => void;
  onFailed?: (event: TaskEvent) => void;
  enabled?: boolean;
}

export interface UseRealtimeWorkflowProgressOptions {
  projectId: string;
  workflowId?: string;
  executionId?: string;
  onEvent?: (event: WorkflowEvent) => void;
  onComplete?: (event: WorkflowEvent) => void;
  onFailed?: (event: WorkflowEvent) => void;
  enabled?: boolean;
}

export interface UseRealtimeSandboxProgressOptions {
  projectId: string;
  sandboxId?: string;
  onEvent?: (event: SandboxEvent) => void;
  enabled?: boolean;
}

export interface RealtimeProgressState {
  isConnected: boolean;
  connectionState: ConnectionState;
  error: Error | null;
}

/**
 * Hook for subscribing to real-time task progress
 *
 * @example
 * ```tsx
 * const { isConnected, connectionState, error } = useRealtimeTaskProgress({
 *   projectId: 'project-123',
 *   taskId: 'task-456',
 *   onEvent: (event) => console.log('Task event:', event),
 *   onComplete: (event) => console.log('Task completed:', event.output),
 *   onFailed: (event) => console.log('Task failed:', event.error),
 *   enabled: true,
 * });
 * ```
 */
export function useRealtimeTaskProgress(options: UseRealtimeTaskProgressOptions): RealtimeProgressState {
  const { projectId, taskId, onEvent, onComplete, onFailed, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setConnectionState('connecting');
      setError(null);

      const client = getClient();
      const progress = client.getProgress();

      // Subscribe to connection state changes
      const stateUnsubscribe = progress.onConnectionState?.(projectId, (event: any) => {
        if (event.type === 'connected') {
          setIsConnected(true);
          setConnectionState('connected');
        } else if (event.type === 'disconnected') {
          setIsConnected(false);
          setConnectionState('disconnected');
        } else if (event.type === 'error') {
          setError(new Error(event.error || 'WebSocket error'));
        }
      });

      // Subscribe to task progress
      unsubscribeRef.current = await client.subscribeToTask(
        projectId,
        taskId,
        (event: any) => {
          onEvent?.(event as TaskEvent);

          // Handle completion callbacks
          if (event.type === 'task_completed') {
            onComplete?.(event as TaskEvent);
          } else if (event.type === 'task_failed') {
            onFailed?.(event as TaskEvent);
          }
        }
      );

      // Combine unsubscribes
      if (stateUnsubscribe) {
        const originalUnsubscribe = unsubscribeRef.current;
        unsubscribeRef.current = () => {
          stateUnsubscribe();
          originalUnsubscribe?.();
        };
      }

      setIsConnected(true);
      setConnectionState('connected');
    } catch (err) {
      console.error('Failed to subscribe to task progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to subscribe'));
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [enabled, projectId, taskId, onEvent, onComplete, onFailed]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return { isConnected, connectionState, error };
}

/**
 * Hook for subscribing to real-time workflow progress
 *
 * @example
 * ```tsx
 * const { isConnected, connectionState, error } = useRealtimeWorkflowProgress({
 *   projectId: 'project-123',
 *   workflowId: 'workflow-456',
 *   onEvent: (event) => console.log('Workflow event:', event),
 *   onComplete: (event) => console.log('Workflow completed:', event.output),
 *   onFailed: (event) => console.log('Workflow failed:', event.error),
 *   enabled: true,
 * });
 * ```
 */
export function useRealtimeWorkflowProgress(options: UseRealtimeWorkflowProgressOptions): RealtimeProgressState {
  const { projectId, workflowId, executionId, onEvent, onComplete, onFailed, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setConnectionState('connecting');
      setError(null);

      const client = getClient();
      const progress = client.getProgress();

      // Subscribe to connection state changes
      const stateUnsubscribe = progress.onConnectionState?.(projectId, (event: any) => {
        if (event.type === 'connected') {
          setIsConnected(true);
          setConnectionState('connected');
        } else if (event.type === 'disconnected') {
          setIsConnected(false);
          setConnectionState('disconnected');
        } else if (event.type === 'error') {
          setError(new Error(event.error || 'WebSocket error'));
        }
      });

      // Subscribe to workflow progress
      unsubscribeRef.current = await client.subscribeToWorkflow(
        projectId,
        (event: any) => {
          onEvent?.(event as WorkflowEvent);

          // Handle completion callbacks
          if (event.type === 'workflow_execution_completed') {
            onComplete?.(event as WorkflowEvent);
          } else if (event.type === 'workflow_execution_failed') {
            onFailed?.(event as WorkflowEvent);
          }
        },
        workflowId,
        executionId
      );

      // Combine unsubscribes
      if (stateUnsubscribe) {
        const originalUnsubscribe = unsubscribeRef.current;
        unsubscribeRef.current = () => {
          stateUnsubscribe();
          originalUnsubscribe?.();
        };
      }

      setIsConnected(true);
      setConnectionState('connected');
    } catch (err) {
      console.error('Failed to subscribe to workflow progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to subscribe'));
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [enabled, projectId, workflowId, executionId, onEvent, onComplete, onFailed]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return { isConnected, connectionState, error };
}

/**
 * Hook for subscribing to real-time sandbox progress
 *
 * @example
 * ```tsx
 * const { isConnected, connectionState, error } = useRealtimeSandboxProgress({
 *   projectId: 'project-123',
 *   sandboxId: 'sandbox-456',
 *   onEvent: (event) => console.log('Sandbox event:', event),
 *   enabled: true,
 * });
 * ```
 */
export function useRealtimeSandboxProgress(options: UseRealtimeSandboxProgressOptions): RealtimeProgressState {
  const { projectId, sandboxId, onEvent, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setConnectionState('connecting');
      setError(null);

      const client = getClient();
      const progress = client.getProgress();

      // Subscribe to connection state changes
      const stateUnsubscribe = progress.onConnectionState?.(projectId, (event: any) => {
        if (event.type === 'connected') {
          setIsConnected(true);
          setConnectionState('connected');
        } else if (event.type === 'disconnected') {
          setIsConnected(false);
          setConnectionState('disconnected');
        } else if (event.type === 'error') {
          setError(new Error(event.error || 'WebSocket error'));
        }
      });

      // Subscribe to sandbox progress
      unsubscribeRef.current = await client.subscribeToSandbox(
        projectId,
        (event: any) => {
          onEvent?.(event as SandboxEvent);
        },
        sandboxId
      );

      // Combine unsubscribes
      if (stateUnsubscribe) {
        const originalUnsubscribe = unsubscribeRef.current;
        unsubscribeRef.current = () => {
          stateUnsubscribe();
          originalUnsubscribe?.();
        };
      }

      setIsConnected(true);
      setConnectionState('connected');
    } catch (err) {
      console.error('Failed to subscribe to sandbox progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to subscribe'));
      setConnectionState('disconnected');
      setIsConnected(false);
    }
  }, [enabled, projectId, sandboxId, onEvent]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Subscribe on mount and when dependencies change
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  return { isConnected, connectionState, error };
}
