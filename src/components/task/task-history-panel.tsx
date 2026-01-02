import { useState, useEffect } from 'react';
import type { TaskExecution } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Play, CheckCircle, XCircle, Clock, MinusCircle } from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';

interface TaskHistoryPanelProps {
  projectId: string;
}

export function TaskHistoryPanel({ projectId }: TaskHistoryPanelProps) {
  const [tasks, setTasks] = useState<TaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getClient();
      const tasksData = await client.tasks.listTaskHistory(projectId) as any[];
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Set up a timer to refresh tasks periodically
    const interval = setInterval(fetchTasks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [projectId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running': return <Play className="h-4 w-4 text-blue-500" />;
    case 'queued': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'pending': return <MinusCircle className="h-4 w-4 text-gray-500" />;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Task History</CardTitle>
        <Button size="sm" variant="ghost" onClick={fetchTasks} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
            Error: {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No tasks executed yet</p>
            <p className="text-xs mt-1">Execute a workflow step to see task history here</p>
          </div>
        ) : (
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-md bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{task.stepId}</span>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <span className="capitalize">{task.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {task.prompt.substring(0, 60)}{task.prompt.length > 60 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Started: {formatDate(task.startTime)}</span>
                        <span>Ended: {formatDate(task.endTime)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {task.result && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Result:</p>
                      <div className="text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto">
                        {task.result.substring(0, 200)}{task.result.length > 200 ? '...' : ''}
                      </div>
                    </div>
                  )}
              
                  {task.error && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-destructive mb-1">Error:</p>
                      <div className="text-xs bg-destructive/10 text-destructive p-2 rounded">
                        {task.error.substring(0, 100)}{task.error.length > 100 ? '...' : ''}
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