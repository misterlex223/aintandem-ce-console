/**
 * File Import Dialog Component
 * Dialog for importing documents and folders into the context system
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { X, Plus, Upload, Folder, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { MemoryScope, MemoryVisibility, ImportResult } from '../../types/context';
import { MEMORY_VISIBILITY_INFO } from '../../types/context';
import { importDocument, importFolder } from '../../lib/context-api';
import { getClient } from '../../lib/api/api-helpers';
import type { Organization, Workspace, Project } from '../../lib/types';

interface FileImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: { type: MemoryScope; id: string };
  onImportComplete?: (result: ImportResult) => void;
}

type ImportMode = 'file' | 'folder';

export function FileImportDialog({
  open,
  onOpenChange,
  defaultScope,
  onImportComplete,
}: FileImportDialogProps) {
  const [importMode, setImportMode] = useState<ImportMode>('file');
  const [filePath, setFilePath] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [memoryType, setMemoryType] = useState('documentation');
  const [visibility, setVisibility] = useState<MemoryVisibility>('workspace');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Scope selection (when no defaultScope provided)
  const [selectedScopeType, setSelectedScopeType] = useState<MemoryScope>('project');
  const [selectedScopeId, setSelectedScopeId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  // Folder-specific options
  const [recursive, setRecursive] = useState(true);
  const [fileExtensions, setFileExtensions] = useState<string[]>(['.md', '.txt']);
  const [extensionInput, setExtensionInput] = useState('');

  // File-specific options
  const [chunkContent, setChunkContent] = useState(true);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load hierarchy data when dialog opens and no defaultScope provided
  useEffect(() => {
    if (open && !defaultScope) {
      loadHierarchyData();
    }
  }, [open, defaultScope]);

  const loadHierarchyData = async () => {
    try {
      const client = getClient();
      const orgs = await client.workspaces.listOrganizations() as any;
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  // Load workspaces when organization changes
  useEffect(() => {
    if (selectedOrgId && !defaultScope) {
      loadWorkspaces(selectedOrgId);
    }
  }, [selectedOrgId, defaultScope]);

  const loadWorkspaces = async (orgId: string) => {
    try {
      const client = getClient();
      const ws = await client.workspaces.listWorkspaces(orgId) as any;
      setWorkspaces(ws);
      if (ws.length > 0) {
        setSelectedWorkspaceId(ws[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  // Load projects when workspace changes
  useEffect(() => {
    if (selectedWorkspaceId && !defaultScope) {
      loadProjects(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, defaultScope]);

  const loadProjects = async (workspaceId: string) => {
    try {
      const client = getClient();
      const projs = await client.workspaces.listProjects(workspaceId) as any;
      setProjects(projs);
      if (projs.length > 0 && selectedScopeType === 'project') {
        setSelectedScopeId(projs[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  // Update selectedScopeId when scope type changes
  useEffect(() => {
    if (defaultScope) return;

    switch (selectedScopeType) {
    case 'organization':
      setSelectedScopeId(selectedOrgId);
      break;
    case 'workspace':
      setSelectedScopeId(selectedWorkspaceId);
      break;
    case 'project':
      setSelectedScopeId(projects.length > 0 ? projects[0].id : '');
      break;
    }
  }, [selectedScopeType, selectedOrgId, selectedWorkspaceId, projects, defaultScope]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddExtension = () => {
    const ext = extensionInput.trim();
    if (ext && !fileExtensions.includes(ext)) {
      // Ensure extension starts with dot
      const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
      setFileExtensions([...fileExtensions, normalizedExt]);
      setExtensionInput('');
    }
  };

  const handleRemoveExtension = (ext: string) => {
    setFileExtensions(fileExtensions.filter((e) => e !== ext));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImportResult(null);

    // Determine scope to use
    const scopeType = defaultScope?.type || selectedScopeType;
    const scopeId = defaultScope?.id || selectedScopeId;

    if (!scopeId) {
      setError('Please select a valid scope (organization, workspace, or project).');
      return;
    }

    const path = importMode === 'file' ? filePath : folderPath;
    if (!path.trim()) {
      setError('Please enter a file or folder path.');
      return;
    }

    setIsImporting(true);

    try {
      let result: ImportResult;

      if (importMode === 'file') {
        result = await importDocument({
          file_path: filePath,
          scope: scopeType,
          scope_id: scopeId,
          memory_type: memoryType,
          visibility,
          tags,
          chunk_content: chunkContent,
        });
      } else {
        result = await importFolder({
          folder_path: folderPath,
          scope: scopeType,
          scope_id: scopeId,
          recursive,
          file_extensions: fileExtensions.length > 0 ? fileExtensions : undefined,
          tags,
        });
      }

      setImportResult(result);
      onImportComplete?.(result);

      // Auto-close dialog after 3 seconds on success
      if (!result.errors || result.errors.length === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import';
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after close animation
    setTimeout(() => {
      setFilePath('');
      setFolderPath('');
      setMemoryType('documentation');
      setVisibility('workspace');
      setTags([]);
      setTagInput('');
      setRecursive(true);
      setFileExtensions(['.md', '.txt']);
      setExtensionInput('');
      setChunkContent(true);
      setImportResult(null);
      setError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Files to Context
          </DialogTitle>
          <DialogDescription>
            Import documents or folders to create searchable memories.
            {defaultScope && (
              <span className="block mt-1 text-xs">
                Importing to: <strong>{defaultScope.type}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Import Result */}
        {importResult && (
          <Alert className={importResult.errors && importResult.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Import completed!</p>
                <div className="text-sm space-y-1">
                  <p>Files imported: {importResult.files_imported}</p>
                  <p>Memories created: {importResult.memories_created}</p>
                  {importResult.chunks_created > 0 && (
                    <p>Chunks created: {importResult.chunks_created}</p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-yellow-600">Errors:</p>
                      <ul className="list-disc list-inside text-xs">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scope Selection (only if no defaultScope) */}
          {!defaultScope && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="scopeType">Import Scope *</Label>
                <Select value={selectedScopeType} onValueChange={(value: MemoryScope) => setSelectedScopeType(value)}>
                  <SelectTrigger id="scopeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">🏢 Organization</SelectItem>
                    <SelectItem value="workspace">💼 Workspace</SelectItem>
                    <SelectItem value="project">📁 Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Selector */}
              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Workspace Selector (for workspace/project scope) */}
              {(selectedScopeType === 'workspace' || selectedScopeType === 'project') && (
                <div className="space-y-2">
                  <Label htmlFor="workspace">Workspace *</Label>
                  <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                    <SelectTrigger id="workspace">
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map(ws => (
                        <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Project Selector (for project scope) */}
              {selectedScopeType === 'project' && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select project" />
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
          )}

          {/* Import Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={importMode === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('file')}
              className="flex-1"
            >
              <File className="h-4 w-4 mr-2" />
              Single File
            </Button>
            <Button
              type="button"
              variant={importMode === 'folder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('folder')}
              className="flex-1"
            >
              <Folder className="h-4 w-4 mr-2" />
              Folder
            </Button>
          </div>

          {/* File/Folder Path */}
          <div className="space-y-2">
            <Label htmlFor="path">
              {importMode === 'file' ? 'File Path' : 'Folder Path'} *
            </Label>
            <Input
              id="path"
              required
              value={importMode === 'file' ? filePath : folderPath}
              onChange={(e) =>
                importMode === 'file' ? setFilePath(e.target.value) : setFolderPath(e.target.value)
              }
              placeholder={
                importMode === 'file'
                  ? '/path/to/document.md'
                  : '/path/to/folder'
              }
            />
            <p className="text-xs text-muted-foreground">
              Absolute path to the {importMode === 'file' ? 'file' : 'folder'} to import
            </p>
          </div>

          {/* Memory Type */}
          {importMode === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="memoryType">Memory Type</Label>
              <Select value={memoryType} onValueChange={setMemoryType}>
                <SelectTrigger id="memoryType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documentation">📄 Documentation</SelectItem>
                  <SelectItem value="specification">📋 Specification</SelectItem>
                  <SelectItem value="knowledge">🧠 Knowledge</SelectItem>
                  <SelectItem value="configuration">⚙️ Configuration</SelectItem>
                  <SelectItem value="requirement">✓ Requirement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value: MemoryVisibility) => setVisibility(value)}
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEMORY_VISIBILITY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {MEMORY_VISIBILITY_INFO[visibility]?.description}
            </p>
          </div>

          {/* Folder Options */}
          {importMode === 'folder' && (
            <>
              {/* Recursive */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recursive"
                  checked={recursive}
                  onCheckedChange={(checked) => setRecursive(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="recursive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Recursive Import
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Include files from subdirectories
                  </p>
                </div>
              </div>

              {/* File Extensions */}
              <div className="space-y-2">
                <Label htmlFor="extensions">File Extensions</Label>
                <div className="flex gap-2">
                  <Input
                    id="extensions"
                    value={extensionInput}
                    onChange={(e) => setExtensionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExtension();
                      }
                    }}
                    placeholder=".md, .txt, .pdf"
                  />
                  <Button type="button" onClick={handleAddExtension} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {fileExtensions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fileExtensions.map((ext) => (
                      <Badge key={ext} variant="secondary" className="gap-1">
                        {ext}
                        <button
                          type="button"
                          onClick={() => handleRemoveExtension(ext)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to import all file types
                </p>
              </div>
            </>
          )}

          {/* File-specific Options */}
          {importMode === 'file' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chunkContent"
                checked={chunkContent}
                onCheckedChange={(checked) => setChunkContent(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="chunkContent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Chunk Content
                </Label>
                <p className="text-xs text-muted-foreground">
                  Split large files into smaller chunks for better search
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
