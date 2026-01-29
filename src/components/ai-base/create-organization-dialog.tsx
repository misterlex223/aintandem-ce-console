import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderSelectionDialog } from './folder-selection-dialog';
import { FolderOpen } from 'lucide-react';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  folderPath: string;
  onNameChange: (name: string) => void;
  onFolderPathChange: (path: string) => void;
  onCreate: () => void;
  trigger?: React.ReactNode;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  name,
  folderPath,
  onNameChange,
  onFolderPathChange,
  onCreate,
  trigger,
}: CreateOrganizationDialogProps) {
  const [showFolderSelection, setShowFolderSelection] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              An organization is the root folder containing workspace folders.
              Folder path is relative to the base directory (KAI_BASE_ROOT).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="org-name" className="text-right">Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="col-span-3"
                placeholder="My Organization"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="org-path" className="text-right">Folder Name</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="org-path"
                  value={folderPath}
                  onChange={(e) => onFolderPathChange(e.target.value)}
                  className="flex-1"
                  placeholder="my-org"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFolderSelection(true)}
                  title="Select existing folder"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FolderSelectionDialog
        open={showFolderSelection}
        onOpenChange={setShowFolderSelection}
        title="Select Organization Folder"
        description="Select an existing folder at the base directory level. Only one level is shown to maintain hierarchy structure."
        apiEndpoint="/folders/organizations"
        onSelect={onFolderPathChange}
      />
    </>
  );
}
