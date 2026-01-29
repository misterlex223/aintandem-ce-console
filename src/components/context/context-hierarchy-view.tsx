/**
 * Context Hierarchy View Component
 * Displays memories organized by Organization → Workspace → Project hierarchy
 */

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { MemoryCard } from './memory-card';
import { useContextStore } from '../../stores/context-store';
import type { Memory, MemoryScope } from '../../types/context';
import { useAIBaseState } from '../../hooks/use-ai-base-state';
import type { Organization, Workspace, Project } from '../../lib/types';

interface ContextHierarchyViewProps {
  defaultScope?: { type: MemoryScope; id: string };
}

interface HierarchyNode {
  id: string;
  name: string;
  type: 'organization' | 'workspace' | 'project';
  scopeId: string;
  children: HierarchyNode[];
  memories: Memory[];
  isLoading: boolean;
  expanded: boolean;
}

export function ContextHierarchyView({ defaultScope: _defaultScope }: ContextHierarchyViewProps) {
  const {
    fetchMemories,
    searchMemories,
    memories,
    searchQuery,
    setFilters,
    setSearchQuery,
  } = useContextStore();
  
  const [aiBaseState] = useAIBaseState();
  const { organizations, workspaces, projects } = aiBaseState;
  
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ type: string; id: string } | null>(null);

  // Initialize hierarchy based on available data
  useEffect(() => {
    if (organizations.length > 0) {
      buildHierarchy();
    }
  }, [organizations, workspaces, projects]);

  const buildHierarchy = () => {
    const newHierarchy: HierarchyNode[] = organizations.map((org: Organization) => ({
      id: org.id,
      name: org.name,
      type: 'organization',
      scopeId: org.id,
      children: workspaces
        .filter(ws => ws.organizationId === org.id)
        .map((ws: Workspace) => ({
          id: ws.id,
          name: ws.name,
          type: 'workspace',
          scopeId: ws.id,
          children: projects
            .filter(p => p.workspaceId === ws.id)
            .map((p: Project) => ({
              id: p.id,
              name: p.name,
              type: 'project',
              scopeId: p.id,
              children: [],
              memories: [],
              isLoading: false,
              expanded: false,
            })),
          memories: [],
          isLoading: false,
          expanded: false,
        })),
      memories: [],
      isLoading: false,
      expanded: false,
    }));

    setHierarchy(newHierarchy);
  };

  const toggleNode = (nodeId: string, nodeType: string) => {
    setHierarchy(prevHierarchy => 
      updateNodeExpansion(prevHierarchy, nodeId, nodeType, true)
    );
  };

  const updateNodeExpansion = (nodes: HierarchyNode[], nodeId: string, nodeType: string, toggle: boolean): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId && node.type === nodeType) {
        return { ...node, expanded: toggle ? !node.expanded : true };
      }
      
      if (node.children.length > 0) {
        return { 
          ...node, 
          children: updateNodeExpansion(node.children, nodeId, nodeType, toggle) 
        };
      }
      
      return node;
    });
  };

  const loadNodeMemories = async (node: HierarchyNode) => {
    // Update node state to show loading
    setHierarchy(prevHierarchy => 
      updateNodeLoading(prevHierarchy, node.id, node.type, true)
    );
    
    try {
      // Set filters based on node scope
      setFilters({ types: [] });
      await fetchMemories({ type: node.type as MemoryScope, id: node.scopeId });
      
      // Update the node with loaded memories
      setHierarchy(prevHierarchy => 
        updateNodeMemories(prevHierarchy, node.id, node.type, [...memories])
      );
    } catch (error) {
      console.error(`Error loading memories for ${node.type} ${node.name}:`, error);
    } finally {
      // Update node state to show loading complete
      setHierarchy(prevHierarchy => 
        updateNodeLoading(prevHierarchy, node.id, node.type, false)
      );
    }
  };

  const updateNodeLoading = (nodes: HierarchyNode[], nodeId: string, nodeType: string, loading: boolean): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId && node.type === nodeType) {
        return { ...node, isLoading: loading };
      }
      
      if (node.children.length > 0) {
        return { 
          ...node, 
          children: updateNodeLoading(node.children, nodeId, nodeType, loading) 
        };
      }
      
      return node;
    });
  };

  const updateNodeMemories = (nodes: HierarchyNode[], nodeId: string, nodeType: string, memories: Memory[]): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId && node.type === nodeType) {
        return { ...node, memories };
      }
      
      if (node.children.length > 0) {
        return { 
          ...node, 
          children: updateNodeMemories(node.children, nodeId, nodeType, memories) 
        };
      }
      
      return node;
    });
  };

  const handleNodeClick = async (node: HierarchyNode) => {
    setSelectedNode({ type: node.type, id: node.id });
    
    // Load memories for this node if not already loaded
    if (node.memories.length === 0 && !node.isLoading) {
      await loadNodeMemories(node);
    }
    
    // Expand the node
    toggleNode(node.id, node.type);
  };

  const handleSearch = () => {
    if (localSearchQuery.trim() && selectedNode) {
      searchMemories({
        query: localSearchQuery,
        scope: selectedNode.type as MemoryScope,
        scope_id: selectedNode.id,
        include_inherited: true,
      });
      setSearchQuery(localSearchQuery);
    } else {
      setSearchQuery('');
      if (selectedNode) {
        fetchMemories({ type: selectedNode.type as MemoryScope, id: selectedNode.id });
      }
    }
  };

  const renderHierarchyNode = (node: HierarchyNode, depth = 0) => {
    const paddingLeft = `${depth * 24}px`;
    const hasChildren = node.children.length > 0;
    const hasMemories = searchQuery ? useContextStore.getState().searchResults : node.memories;
    const displayMemories = Array.isArray(hasMemories) ? hasMemories : [];

    return (
      <div key={node.id} className="border-b border-gray-100 last:border-b-0">
        {/* Node Header */}
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedNode?.id === node.id ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft }}
          onClick={() => handleNodeClick(node)}
        >
          <div className="flex items-center">
            {hasChildren ? (
              <button
                className="p-1 rounded hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id, node.type);
                }}
              >
                {node.expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {node.expanded ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />}
            <span className="font-medium">{node.name}</span>
            {node.memories.length > 0 && !searchQuery && (
              <Badge variant="secondary" className="text-xs">
                {node.memories.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {node.expanded && (
          <div className="ml-6">
            {/* Show loading state for this node */}
            {node.isLoading && (
              <div className="py-2 text-center text-sm text-gray-500">
                Loading memories...
              </div>
            )}

            {/* Show child nodes */}
            {hasChildren && (
              <div className="space-y-1">
                {node.children.map(child => renderHierarchyNode(child, depth + 1))}
              </div>
            )}

            {/* Show memories for this node */}
            {!node.isLoading && displayMemories.length > 0 && (
              <div className={`mt-2 ${hasChildren ? 'ml-4' : ''}`}>
                <div className="flex items-center gap-2 mb-2 ml-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Memories</span>
                </div>
                <div className="grid gap-2 ml-2">
                  {displayMemories.map(memory => (
                    <div key={memory.id} className="bg-gray-50 rounded p-2">
                      <MemoryCard memory={memory} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show empty state if no memories */}
            {!node.isLoading && displayMemories.length === 0 && !hasChildren && (
              <div className="py-2 text-center text-sm text-gray-500">
                No memories in this scope
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Stats */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Search results for: "{searchQuery}"
        </div>
      )}

      {/* Hierarchy Tree */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {hierarchy.length > 0 ? (
          hierarchy.map(node => renderHierarchyNode(node))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No organizations found. Please create an organization to view hierarchical context.
          </div>
        )}
      </div>
    </div>
  );
}