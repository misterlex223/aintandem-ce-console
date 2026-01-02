import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, ArrowUp } from 'lucide-react';
import { browseDirectories } from '@/lib/api/api-helpers';

interface DirectoryBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPath: (path: string) => void;
}

export function DirectoryBrowser({ open, onOpenChange, onSelectPath }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [directories, setDirectories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectories = async (path: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use SDK's browseDirectories helper
      const data = await browseDirectories(path);
      setCurrentPath(data.currentPath);
      setDirectories(data.directories);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchDirectories(null); // Fetch home directory on open
    }
  }, [open]);

  const handleDirectoryClick = (dirName: string) => {
    const newPath = `${currentPath}/${dirName}`;
    void fetchDirectories(newPath);
  };

  const handleGoUp = () => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    void fetchDirectories(parentPath || null);
  };

  const handleSelect = () => {
    onSelectPath(currentPath);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Browse Host Directories</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{currentPath}</p>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border">
          <div className="p-4">
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : (
              <ul>
                <li key="up-dir" className="mb-1">
                  <Button variant="ghost" onClick={handleGoUp} className="w-full justify-start">
                    <ArrowUp className="mr-2 h-4 w-4" /> ..
                  </Button>
                </li>
                {directories.map(dir => (
                  <li key={dir} className="mb-1">
                    <Button variant="ghost" onClick={() => handleDirectoryClick(dir)} className="w-full justify-start">
                      <Folder className="mr-2 h-4 w-4" /> {dir}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSelect}>Select Current Directory</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
