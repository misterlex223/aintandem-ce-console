import { useMemo } from 'react';
import { useProjectCentricStore } from '@/stores/project-centric-store';
import { ProjectGridView } from './project-grid-view';
import { ProjectListView } from './project-list-view';
import type { ExtendedProject, Workflow } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/sandbox/search-bar';
import { 
  LayoutGrid, 
  List,
  Filter,
  X
} from 'lucide-react';

interface ProjectCentricViewProps {
  projects: ExtendedProject[];
  workflows: Workflow[];
  isDeleteLocked: boolean;
  onCreateSandbox: (projectId: string) => void;
  onDestroySandbox: (sandboxId: string) => void;
  onRecreateSandbox: (projectId: string, sandboxId: string) => void;
  onMove: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onChangeWorkflow: (projectId: string) => void;
  onProjectSelect: (projectId: string) => void;
}

export function ProjectCentricView({
  projects,
  workflows,
  isDeleteLocked,
  onCreateSandbox,
  onDestroySandbox,
  onRecreateSandbox,
  onMove,
  onDelete,
  onChangeWorkflow,
  onProjectSelect,
}: ProjectCentricViewProps) {
  const { 
    viewMode, 
    searchQuery, 
    workflowFilter, 
    statusFilter,
    sortBy,
    sortOrder,
    setViewMode,
    setSearchQuery,
    setWorkflowFilter,
    setStatusFilter,
    clearFilters
  } = useProjectCentricStore();

  // Filter and sort projects based on current filters
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.organizationName && project.organizationName.toLowerCase().includes(query)) ||
        (project.workspaceName && project.workspaceName.toLowerCase().includes(query))
      );
    }
    
    // Apply workflow filter
    if (workflowFilter !== 'all') {
      if (workflowFilter === 'none') {
        result = result.filter(project => !project.workflowId);
      } else {
        result = result.filter(project => {
          const projectWorkflow = workflows.find(w => w.id === project.workflowId);
          return projectWorkflow && projectWorkflow.name.toLowerCase().includes(workflowFilter);
        });
      }
    }
    
    // Apply status filter (this would depend on how you define "active" projects)
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter(project => project.sandboxId);
      } else {
        result = result.filter(project => !project.sandboxId);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'workflowPhase': {
        // This would need more complex logic based on your workflow implementation
        const workflowA = workflows.find(w => w.id === a.workflowId)?.name || '';
        const workflowB = workflows.find(w => w.id === b.workflowId)?.name || '';
        comparison = workflowA.localeCompare(workflowB);
        break; 
      }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [projects, workflows, searchQuery, workflowFilter, statusFilter, sortBy, sortOrder]);



  return (
    <div className="col-span-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Projects</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className="rounded-none border-0 border-l"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          
          {/* Filters Button */}
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search projects, organizations, or workspaces..."
        />
      </div>
      
      {/* Active Filters */}
      {(searchQuery || workflowFilter !== 'all' || statusFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {searchQuery && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <span>Search: "{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery('')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {workflowFilter !== 'all' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <span>Workflow: {workflowFilter === 'none' ? 'None' : workflowFilter}</span>
              <button 
                onClick={() => setWorkflowFilter('all')}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {statusFilter !== 'all' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <span>Status: {statusFilter}</span>
              <button 
                onClick={() => setStatusFilter('all')}
                className="hover:bg-yellow-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-sm h-8"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* View Content */}
      {viewMode === 'grid' ? (
        <ProjectGridView
          projects={filteredAndSortedProjects}
          workflows={workflows}
          isDeleteLocked={isDeleteLocked}
          onCreateSandbox={onCreateSandbox}
          onDestroySandbox={onDestroySandbox}
          onRecreateSandbox={onRecreateSandbox}
          onMove={onMove}
          onDelete={onDelete}
          onChangeWorkflow={onChangeWorkflow}
          onProjectSelect={onProjectSelect}
        />
      ) : (
        <ProjectListView
          projects={filteredAndSortedProjects}
          workflows={workflows}
          onCreateSandbox={onCreateSandbox}
          onDestroySandbox={onDestroySandbox}
          onProjectSelect={onProjectSelect}
        />
      )}
    </div>
  );
}