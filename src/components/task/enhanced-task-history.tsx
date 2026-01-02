import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TaskExecution } from '@/lib/types';
import type { TaskEvent } from '@/types/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  MinusCircle,
  Search,
  FileText,
  ExternalLink,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';
import { useRealtimeTaskProgress } from '@/hooks/use-realtime-progress';

interface EnhancedTaskHistoryProps {
  projectId: string;
  onTaskClick?: (task: TaskExecution) => void;
}

// Map TaskEvent to TaskExecution
function mapTaskEventToTaskExecution(event: TaskEvent): Partial<TaskExecution> & { id: string; projectId: string } {
  const base: Partial<TaskExecution> & { id: string; projectId: string } = {
    id: event.taskId,
    projectId: event.projectId,
    stepId: '',
    sandboxId: '',
    prompt: '',
  };

  switch (event.type) {
  case 'task_queued':
    return {
      ...base,
      status: 'queued',
      title: event.task || 'Queued Task',
      prompt: (event.input?.prompt as string) || '',
      startTime: event.timestamp,
    };
  case 'task_started':
    return {
      ...base,
      status: 'running',
      title: event.task || 'Running Task',
      startTime: event.timestamp,
    };
  case 'step_progress':
    return {
      ...base,
      status: event.status === 'completed' ? 'completed' : event.status === 'failed' ? 'failed' : 'running',
      stepId: event.stepId || '',
      title: event.step || 'Task Step',
      startTime: event.timestamp,
    };
  case 'output':
    return {
      ...base,
      status: 'running',
      stepId: event.stepId || '',
      title: 'Task Output',
      terminalOutput: event.output,
      startTime: event.timestamp,
    };
  case 'artifact':
    return {
      ...base,
      status: 'running',
      title: 'Artifact Detected',
      artifacts: [{ path: event.artifact.path, type: event.artifact.type, size: 0, createdAt: event.timestamp }],
      startTime: event.timestamp,
    };
  case 'task_completed':
    return {
      ...base,
      status: 'completed',
      title: event.task || 'Completed Task',
      result: event.output as string,
      duration: event.duration,
      startTime: event.timestamp,
    };
  case 'task_failed':
    return {
      ...base,
      status: 'failed',
      title: event.task || 'Failed Task',
      error: event.error,
      result: event.output as string,
      startTime: event.timestamp,
    };
  case 'task_cancelled':
    return {
      ...base,
      status: 'cancelled',
      title: event.task || 'Cancelled Task',
      startTime: event.timestamp,
    };
  default:
    return {
      ...base,
      status: 'pending',
      title: 'Unknown Task',
    };
  }
}

export function EnhancedTaskHistory({ projectId, onTaskClick }: EnhancedTaskHistoryProps) {
  const [initialTasksLoaded, setInitialTasksLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasksMap, setTasksMap] = useState<Map<string, TaskExecution>>(new Map());

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'all' | 'workflow' | 'adhoc'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Realtime progress connection
  const { isConnected } = useRealtimeTaskProgress({
    projectId,
    onEvent: useCallback((event: TaskEvent) => {
      console.log('[EnhancedTaskHistory] Task event:', event);

      // Map TaskEvent to Partial<TaskExecution>
      const partialTask = mapTaskEventToTaskExecution(event);

      // Update tasks map with new event data
      setTasksMap(prev => {
        const updated = new Map(prev);
        const existing = updated.get(event.taskId);

        // Merge with existing task data to create a complete TaskExecution
        const merged: TaskExecution = {
          stepId: partialTask.stepId || existing?.stepId || '',
          sandboxId: existing?.sandboxId || '',
          prompt: partialTask.prompt || existing?.prompt || '',
          status: partialTask.status || existing?.status || 'pending',
          // Merge other fields
          ...existing,
          ...partialTask,
          // Preserve artifacts from previous events
          artifacts: event.type === 'artifact'
            ? [...(existing?.artifacts || []), ...(partialTask.artifacts || [])]
            : existing?.artifacts || partialTask.artifacts,
        };

        updated.set(event.taskId, merged);
        return updated;
      });
    }, []),
    enabled: !!projectId && initialTasksLoaded,
  });

  // Initial fetch of task history
  const fetchInitialTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const client = getClient();
      const tasksData = await client.tasks.listTaskHistory(projectId, {}) as any[];

      // Build tasks map
      const map = new Map<string, TaskExecution>();
      tasksData.forEach((task: TaskExecution) => {
        map.set(task.id, task);
      });
      setTasksMap(map);
      setInitialTasksLoaded(true);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchInitialTasks();
  }, [fetchInitialTasks]);

  // Convert map to array and apply filters
  const filteredTasks = useMemo(() => {
    const allTasks = Array.from(tasksMap.values());

    let filtered = allTasks;

    // Apply type filter client-side
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t: TaskExecution) =>
        typeFilter === 'adhoc' ? t.isAdhoc : !t.isAdhoc
      );
    }

    // Apply search filter client-side
    if (searchQuery.trim()) {
      filtered = filtered.filter((t: TaskExecution) =>
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by startTime (newest first)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.startTime || 0).getTime();
      const timeB = new Date(b.startTime || 0).getTime();
      return timeB - timeA;
    });
  }, [tasksMap, typeFilter, searchQuery]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchInitialTasks();
  }, [fetchInitialTasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running': return <Play className="h-4 w-4 text-blue-500" />;
    case 'queued': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'pending': return <MinusCircle className="h-4 w-4 text-gray-500" />;
    case 'cancelled': return <MinusCircle className="h-4 w-4 text-gray-400" />;
    default: return <MinusCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
    case 'completed': return 'default';
    case 'failed': return 'destructive';
    case 'running': return 'secondary';
    case 'queued': return 'secondary';
    case 'pending': return 'outline';
    default: return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Task History {filteredTasks.length > 0 && <span className="text-muted-foreground">({filteredTasks.length})</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Realtime connection indicator */}
            {isConnected ? (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400" title="Realtime updates connected">
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Live</span>
              </div>
            ) : initialTasksLoaded ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Realtime updates disconnected">
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">Polling</span>
              </div>
            ) : null}
            <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="adhoc">Ad-hoc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No tasks found</p>
            <p className="text-xs mt-1">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Execute a task to see history here'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 border rounded-md bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {task.title || task.stepId}
                        </span>
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <span className="capitalize">{task.status}</span>
                          </div>
                        </Badge>
                        {task.isAdhoc && (
                          <Badge variant="outline" className="text-xs">
                            Ad-hoc
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.prompt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Started: {formatDate(task.startTime)}</span>
                    {task.duration && <span>Duration: {formatDuration(task.duration)}</span>}
                  </div>

                  {/* Artifacts inline preview */}
                  {task.artifacts && task.artifacts.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                          Artifacts:
                        </span>
                        {task.artifacts.slice(0, 3).map((artifact, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {artifact.path.split('/').pop()}
                          </Badge>
                        ))}
                        {task.artifacts.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.artifacts.length - 3} more
                          </span>
                        )}
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  )}

                  {task.error && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-destructive mb-1">Error:</p>
                      <div className="text-xs bg-destructive/10 text-destructive p-2 rounded line-clamp-2">
                        {task.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
