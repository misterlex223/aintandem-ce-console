import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, RefreshCw } from 'lucide-react';
import { getClient } from '@/lib/api/api-helpers';

interface FolderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  apiEndpoint: string;
  onSelect: (folderName: string) => void;
}

export function FolderSelectionDialog({
  open,
  onOpenChange,
  title,
  description,
  apiEndpoint,
  onSelect,
}: FolderSelectionDialogProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getClient();
      // Use SDK's HttpClient to make the API call
      const data = await client.getHttpClient().get<{ folders: string[] }>(apiEndpoint);
      setFolders(data.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFolders();
      setSelectedFolder(null);
    }
  }, [open, apiEndpoint]);

  const handleSelect = () => {
    if (selectedFolder) {
      onSelect(selectedFolder);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? 'Loading folders...' : `${folders.length} folder(s) found`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFolders}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            {folders.length === 0 && !loading && !error && (
              <div className="p-8 text-center text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No folders found</p>
                <p className="text-xs mt-1">Create a folder on your filesystem first</p>
              </div>
            )}

            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full text-left px-4 py-3 hover:bg-accent border-b last:border-b-0 transition-colors flex items-center gap-3 ${
                  selectedFolder === folder ? 'bg-accent' : ''
                }`}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{folder}</span>
                {selectedFolder === folder && (
                  <span className="ml-auto text-xs text-primary font-medium">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedFolder}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
