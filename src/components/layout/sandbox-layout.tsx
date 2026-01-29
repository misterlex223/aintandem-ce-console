import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Info } from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';
import type { Sandbox, Organization, Workspace, Project } from '@/lib/types';
import { getExternalResourceUrl } from '@/lib/config';

interface SandboxLayoutProps {
  id: string;
  activeTab: string;
  terminalIframeRef?: React.RefObject<HTMLIFrameElement>;
  switchTmuxWindow?: (windowIndex: number) => void;
  children: React.ReactNode;
}

export function SandboxLayout({ id, activeTab, terminalIframeRef, switchTmuxWindow, children }: SandboxLayoutProps) {
  const navigate = useNavigate();

  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>();
  const [shellUrl, setShellUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [codeServerUrl, setCodeServerUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = getClient();
        const [sandboxData, orgData] = await Promise.all([
          client.sandboxes.listSandboxes() as any,
          client.workspaces.listOrganizations() as any,
        ]);

        // Fetch all workspaces and projects by hierarchy
        const workspaceData: Workspace[] = [];
        const projectData: Project[] = [];

        for (const org of orgData) {
          const orgWorkspaces = await client.workspaces.listWorkspaces(org.id) as any;
          workspaceData.push(...orgWorkspaces);

          for (const ws of orgWorkspaces) {
            const wsProjects = await client.workspaces.listProjects(ws.id) as any;
            projectData.push(...wsProjects);
          }
        }

        setSandboxes(sandboxData);
        setProjects(projectData);
        setWorkspaces(workspaceData);
        setOrganizations(orgData);

        // Find current project
        const currentSandbox = sandboxData.find((s: Sandbox) => s.id === id);
        if (currentSandbox?.projectId) {
          const proj = projectData.find(p => p.id === currentSandbox.projectId);
          setCurrentProject(proj);

          // Build URLs for iframes
          setShellUrl(getExternalResourceUrl(`/flexy/${id}/shell`));
          setDocsUrl(getExternalResourceUrl(`/flexy/${id}/docs/`));

          if (proj) {
            // Get workspace and organization for path construction
            const workspace = workspaceData.find(w => w.id === proj.workspaceId);
            if (workspace) {
              const organization = orgData.find((o: Organization) => o.id === workspace.organizationId);
              if (organization) {
                // Code-server only has access to /base-root (KAI_BASE_ROOT mount)
                // Path structure: /base-root/org/workspace/project
                const relativePath = `${organization.folderPath}/${workspace.folderPath}/${proj.folderPath}`;
                const codeServerPath = `/base-root/${relativePath}`;
                setCodeServerUrl(getExternalResourceUrl(`/code-server/?folder=${encodeURIComponent(codeServerPath)}`));
              }
            }
          }
        } else {
          // For non-project sandboxes, still set shell/docs URLs
          setShellUrl(getExternalResourceUrl(`/flexy/${id}/shell`));
          setDocsUrl(getExternalResourceUrl(`/flexy/${id}/docs/`));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    void fetchData();
  }, [id]);

  const handleTabChange = (value: string) => {
    if (id) {
      navigate(`/sandbox/${id}?tab=${value}`);
    }
  };

  const handleProjectChange = (sandboxId: string) => {
    navigate(`/sandbox/${sandboxId}?tab=${activeTab}`);
  };

  const handleOpenSource = () => {
    if (!currentProject) return;

    const workspace = workspaces.find(w => w.id === currentProject.workspaceId);
    if (!workspace) return;

    const organization = organizations.find(o => o.id === workspace.organizationId);
    if (!organization) return;

    // Code-server only has access to /base-root (KAI_BASE_ROOT mount)
    // Path structure: /base-root/org/workspace/project
    const relativePath = `${organization.folderPath}/${workspace.folderPath}/${currentProject.folderPath}`;
    const codeServerPath = `/base-root/${relativePath}`;

    const codeServerUrl = getExternalResourceUrl(`/code-server/?folder=${encodeURIComponent(codeServerPath)}`);
    window.open(codeServerUrl, '_blank');
  };

  const getProjectDisplayName = (sandbox: Sandbox) => {
    const project = projects.find(p => p.id === sandbox.projectId);
    const workspace = project ? workspaces.find(w => w.id === project.workspaceId) : undefined;
    const org = workspace ? organizations.find(o => o.id === workspace.organizationId) : undefined;

    if (project && workspace && org) {
      return `${org.name} / ${workspace.name} / ${project.name}`;
    }
    return sandbox.name;
  };

  const shellShortcuts = (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        <span className="font-medium">切換視窗:</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1 hover:bg-accent"
        onClick={() => switchTmuxWindow?.(0)}
      >
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border rounded shadow-sm">Ctrl+b 0</kbd>
        <span>🖥️ User</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1 hover:bg-accent"
        onClick={() => switchTmuxWindow?.(1)}
      >
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border rounded shadow-sm">Ctrl+b 1</kbd>
        <span>🤖 Claude</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1 hover:bg-accent"
        onClick={() => switchTmuxWindow?.(2)}
      >
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border rounded shadow-sm">Ctrl+b 2</kbd>
        <span>✨ Qwen</span>
      </Button>
    </div>
  );

  const loadingJSX = (
    <main className="flex-1 flex items-center justify-center">
      <div>Loading...</div>
    </main>
  );

  const tabContents = (
    <main className="flex-1">
      {/* Shell tab - only show if there's a shell URL */}
      <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col" style={{ display: activeTab === 'shell' ? 'flex' : 'none' }}>
        {/* Terminal iframe - single tmux session with multiple windows */}
        <iframe
          ref={terminalIframeRef}
          src={shellUrl}
          title="Terminal (Tmux)"
          className="h-full w-full border-0"
        />
      </div>

      {/* Docs tab - only show if there's a docs URL */}
      <div className="h-[calc(100vh-3.5rem)] w-full" style={{ display: activeTab === 'docs' ? 'block' : 'none' }}>
        <iframe
          src={docsUrl}
          title="Documentation"
          className="h-full w-full border-0"
        />
      </div>

      {/* Tasks tab - render children for this one */}
      <div style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
        {children}
      </div>

      {/* Code tab - only show if there's a code server URL */}
      <div className="h-[calc(100vh-3.5rem)] w-full" style={{ display: activeTab === 'code' ? 'block' : 'none' }}>
        <iframe
          src={codeServerUrl}
          title="Code Editor"
          className="h-full w-full border-0"
        />
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {/* Kai link */}
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block">Kai</span>
          </Link>

          {/* Project selector */}
          <Select value={id} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              {sandboxes
                .filter(s => s.status === 'running')
                .map(sandbox => (
                  <SelectItem key={sandbox.id} value={sandbox.id}>
                    {getProjectDisplayName(sandbox)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Shortcuts zone - dynamic content based on active tab */}
          <div className="flex items-center gap-2 ml-4">
            {/* Shortcuts will be rendered here based on active tab */}
            {activeTab === 'docs' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Docs shortcuts:</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+F</kbd>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+Click</kbd>
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Task shortcuts:</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+R</kbd>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+E</kbd>
              </div>
            )}
            {activeTab === 'shell' && (shellShortcuts)}
            {activeTab === 'code' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Code shortcuts:</span>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+S</kbd>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+P</kbd>
                <kbd className="px-2 py-1 text-xs bg-muted rounded">F1</kbd>
              </div>
            )}
          </div>

          {/* Tabs and external link */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="docs">Docs</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="shell">Shell</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* External Code Editor button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSource}
              disabled={!currentProject}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main section */}
      {((activeTab === 'shell' && !shellUrl) || (activeTab === 'code' && !codeServerUrl) || (activeTab === 'docs' && !docsUrl))
        ? (loadingJSX)
        : (tabContents)}
    </div>
  );
}
