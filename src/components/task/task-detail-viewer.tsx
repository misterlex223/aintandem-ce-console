import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Play,
  Clock,
  MinusCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  FileText,
  Terminal,
  Folder,
  Database,
} from 'lucide-react';
import type { TaskExecution } from '@/lib/types';
import { rerunTask } from '@/lib/api/api-helpers';
import { toast } from 'sonner';
import { TaskContextPanel } from './task-context-panel';

interface TaskDetailViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskExecution | null;
  projectId: string;
  onTaskRerun?: () => void;
}

export function TaskDetailViewer({
  open,
  onOpenChange,
  task,
  projectId,
  onTaskRerun,
}: TaskDetailViewerProps) {
  const [isRerunning, setIsRerunning] = useState(false);

  if (!task) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'running':
      return <Play className="h-5 w-5 text-blue-500" />;
    case 'queued':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <MinusCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'running':
    case 'queued':
      return 'secondary';
    default:
      return 'outline';
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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRerun = async () => {
    try {
      setIsRerunning(true);
      await rerunTask(task.id);
      toast.success('Task re-run initiated');
      if (onTaskRerun) {
        onTaskRerun();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to re-run task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to re-run task');
    } finally {
      setIsRerunning(false);
    }
  };

  const handleOpenInCodeServer = (artifactPath: string) => {
    // Build the code-server URL with the artifact file pre-selected
    const url = `/code-server/?folder=/base-root&file=${artifactPath}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(task.status)}
              <div>
                <DialogTitle>{task.title || task.stepId}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status}
                  </Badge>
                  {task.isAdhoc && (
                    <Badge variant="outline">Ad-hoc Task</Badge>
                  )}
                  {!task.isAdhoc && (
                    <Badge variant="outline">Workflow Task</Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={isRerunning}
            >
              {isRerunning ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
                  Re-running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Re-run
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="artifacts">
              Artifacts {task.artifacts && `(${task.artifacts.length})`}
            </TabsTrigger>
            <TabsTrigger value="context">
              <Database className="h-3 w-3 mr-1" />
              Context
              {task.contextUsage && task.contextUsage.injected > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {task.contextUsage.injected}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-4">
            <TabsContent value="overview" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Task ID</div>
                      <div className="text-sm font-mono">{task.id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Step ID</div>
                      <div className="text-sm font-mono">{task.stepId}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Started</div>
                      <div className="text-sm">{formatDate(task.startTime)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Ended</div>
                      <div className="text-sm">{formatDate(task.endTime)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Duration</div>
                      <div className="text-sm">{formatDuration(task.duration)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div className="text-sm capitalize">{task.status}</div>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Description
                      </div>
                      <div className="text-sm bg-muted p-3 rounded-md">
                        {task.description}
                      </div>
                    </div>
                  )}

                  {/* Parameters */}
                  {task.parameters && Object.keys(task.parameters).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Parameters
                      </div>
                      <div className="bg-muted p-3 rounded-md space-y-1">
                        {Object.entries(task.parameters).map(([key, value]) => (
                          <div key={key} className="text-sm font-mono">
                            <span className="text-muted-foreground">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {task.result && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Result</div>
                      <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                        {task.result}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {task.error && (
                    <div>
                      <div className="text-sm font-medium text-destructive mb-1">Error</div>
                      <div className="text-sm bg-destructive/10 text-destructive p-3 rounded-md whitespace-pre-wrap">
                        {task.error}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="prompt" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground">Full Prompt</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(task.prompt)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap font-mono">{task.prompt}</pre>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="output" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Terminal Output
                    </div>
                    {task.terminalOutput && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(task.terminalOutput!)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs">
                    {task.terminalOutput ? (
                      <pre className="whitespace-pre-wrap">{task.terminalOutput}</pre>
                    ) : (
                      <div className="text-muted-foreground">No terminal output captured</div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="artifacts" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
                  {task.artifacts && task.artifacts.length > 0 ? (
                    <div className="space-y-2">
                      {task.artifacts.map((artifact, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{artifact.path}</div>
                              <div className="text-xs text-muted-foreground">
                                {artifact.type} • {(artifact.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenInCodeServer(artifact.path)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No artifacts generated</p>
                      <p className="text-xs mt-1">This task did not create any new files</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Context Tab */}
            <TabsContent value="context" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TaskContextPanel
                    task={task}
                    projectId={projectId}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
