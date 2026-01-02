/**
 * Context Page
 * Main page for browsing and managing memories
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Brain, TrendingUp, Upload, Building2, Briefcase, FolderOpen } from 'lucide-react';
import { ContextBrowser } from '../components/context/context-browser';
import { FileImportDialog } from '../components/context/file-import-dialog';
import { useContextStore } from '../stores/context-store';
import { getClient } from '../lib/api/api-helpers';
import type { Organization, Workspace, Project } from '../lib/types';
import type { MemoryScope } from '../types/context';

export default function ContextPage() {
  const { stats, fetchMemoryStats } = useContextStore();
  const [activeTab, setActiveTab] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Scope selection
  const [scopeType, setScopeType] = useState<MemoryScope>('project');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);

  // Compute effective scope for API calls
  const getScopeId = () => {
    switch (scopeType) {
    case 'organization':
      return selectedOrgId;
    case 'workspace':
      return selectedWorkspaceId;
    case 'project':
      return selectedProjectId;
    default:
      return '';
    }
  };

  const scopeId = getScopeId();
  const effectiveScope = scopeId ? {
    type: scopeType,
    id: scopeId
  } : undefined;

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoadingHierarchy(true);
    try {
      const client = getClient();
      const orgs = await client.workspaces.listOrganizations() as any;
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  // Load workspaces when organization changes
  useEffect(() => {
    if (selectedOrgId) {
      loadWorkspaces(selectedOrgId);
    }
  }, [selectedOrgId]);

  const loadWorkspaces = async (orgId: string) => {
    try {
      const client = getClient();
      const ws = await client.workspaces.listWorkspaces(orgId) as any;
      setWorkspaces(ws);
      if (ws.length > 0) {
        setSelectedWorkspaceId(ws[0].id);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  // Load projects when workspace changes
  useEffect(() => {
    if (selectedWorkspaceId) {
      loadProjects(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  const loadProjects = async (workspaceId: string) => {
    try {
      const client = getClient();
      const projs = await client.workspaces.listProjects(workspaceId) as any;
      setProjects(projs);
      if (projs.length > 0 && scopeType === 'project') {
        setSelectedProjectId(projs[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // Fetch stats when scope changes
  useEffect(() => {
    if (effectiveScope) {
      fetchMemoryStats(effectiveScope);
    }
  }, [effectiveScope?.type, effectiveScope?.id]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Context Manager
          </h1>
          <p className="text-muted-foreground">
            Manage contextual knowledge across AI task sessions, specifications, workflow insights, and organizational knowledge.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Files
          </Button>
        </div>
      </div>

      {/* Scope Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Viewing Scope
          </CardTitle>
          <CardDescription>
            Select the organizational scope to view memories from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Scope Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Scope Level</label>
              <Select value={scopeType} onValueChange={(value: MemoryScope) => setScopeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization
                    </div>
                  </SelectItem>
                  <SelectItem value="workspace">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Workspace
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Project
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organization Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId} disabled={isLoadingHierarchy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workspace Selector */}
            {(scopeType === 'workspace' || scopeType === 'project') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace</label>
                <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId} disabled={!selectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Project Selector */}
            {scopeType === 'project' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!selectedWorkspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(proj => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Current Scope Badge */}
          {effectiveScope && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current scope:</span>
              <Badge variant="secondary" className="capitalize">
                {scopeType === 'organization' && organizations.find(o => o.id === selectedOrgId)?.name}
                {scopeType === 'workspace' && workspaces.find(w => w.id === selectedWorkspaceId)?.name}
                {scopeType === 'project' && projects.find(p => p.id === selectedProjectId)?.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {scopeType}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Total Memories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                In current scope
              </p>
            </CardContent>
          </Card>

          {/* By Type */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">By Type</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>💬 Dialogs:</span>
                  <span className="font-medium">{stats.by_type?.['task-dialog'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>📋 Specs:</span>
                  <span className="font-medium">{stats.by_type?.['specification'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>💡 Insights:</span>
                  <span className="font-medium">{stats.by_type?.['workflow-insight'] || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>🏢 Knowledge:</span>
                  <span className="font-medium">{stats.by_type?.['org-knowledge'] || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content - Tabs */}
      {!effectiveScope && isLoadingHierarchy ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading organizations and projects...</p>
        </div>
      ) : !effectiveScope ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects available. Please create a project first.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Memories</TabsTrigger>
            <TabsTrigger value="dialogs">Task Dialogs</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="insights">Workflow Insights</TabsTrigger>
            <TabsTrigger value="knowledge">Org Knowledge</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            <ContextBrowser scope={effectiveScope} />
          </TabsContent>

          <TabsContent value="dialogs" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Dialogs</CardTitle>
                <CardDescription>
                  AI conversation history and debugging sessions from task executions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContextBrowser scope={effectiveScope} memoryTypes={['task-dialog']} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>
                  Requirements, design documents, and API specifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContextBrowser scope={effectiveScope} memoryTypes={['specification']} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Insights</CardTitle>
                <CardDescription>
                  Execution patterns and optimization learnings from workflow runs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContextBrowser scope={effectiveScope} memoryTypes={['workflow-insight']} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Organizational Knowledge</CardTitle>
                <CardDescription>
                  Team conventions, architectural decisions, and best practices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContextBrowser scope={effectiveScope} memoryTypes={['org-knowledge']} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Global File Import Dialog */}
      <FileImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        defaultScope={effectiveScope}
        onImportComplete={() => {
          // Refresh stats and memories after import
          if (effectiveScope) {
            fetchMemoryStats(effectiveScope);
          }
        }}
      />
    </div>
  );
}
