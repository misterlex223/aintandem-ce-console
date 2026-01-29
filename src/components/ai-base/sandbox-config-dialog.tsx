import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSandboxImagesQuery } from '@/services/sandbox-query-hooks';
import type { FolderMapping, EnvironmentVariable, PortMapping, SandboxImage } from '@/lib/types';

interface SandboxConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: any) => void;
  initialConfig?: any;
}

interface AIWindowConfig {
  type: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface SandboxConfig {
  aiWindows: AIWindowConfig[];
  enableDockerOutofDocker: boolean;
  folderMappings?: FolderMapping[];
  portMappings?: PortMapping[];
  environmentVariables?: EnvironmentVariable[];
  imageName?: string;
}

export function SandboxConfigDialog({ open, onOpenChange, onSave, initialConfig }: SandboxConfigDialogProps) {
  const [config, setConfig] = useState<SandboxConfig>(() => {
    const aiWindows = () => {
      if (initialConfig && initialConfig.aiWindows) {
        // Use initial config if provided
        const configWindows = initialConfig.aiWindows;
        // Pad with empty windows if less than 5
        const paddedWindows = [...configWindows];
        while (paddedWindows.length < 5) {
          paddedWindows.push({ type: 'none', apiKey: '', model: '', baseUrl: '' });
        }
        return paddedWindows;
      } else {
        // Default: 5 empty windows
        return Array(5).fill(null).map(() => ({
          type: 'none', // Use 'none' instead of '' to match the Select component requirements
          apiKey: '',
          model: '',
          baseUrl: ''
        }));
      }
    };

    const folderMappings = () => {
      if (initialConfig && initialConfig.folderMappings) {
        // Use initial config if provided
        return [...initialConfig.folderMappings];
      } else {
        // Default: start with an empty mapping for a clean slate
        return [];
      }
    };

    const portMappings = () => {
      if (initialConfig && initialConfig.portMappings) {
        // Use initial config if provided
        return [...initialConfig.portMappings];
      } else {
        // Default: start with an empty array for port mappings
        return [];
      }
    };

    const environmentVariables = () => {
      if (initialConfig && initialConfig.environmentVariables) {
        // Use initial config if provided
        return [...initialConfig.environmentVariables];
      } else {
        // Default: start with an empty array for environment variables
        return [];
      }
    };

    return {
      aiWindows: aiWindows(),
      enableDockerOutofDocker: initialConfig?.enableDockerOutofDocker || false,
      folderMappings: folderMappings(),
      portMappings: portMappings(),
      environmentVariables: environmentVariables(),
      imageName: initialConfig?.imageName,
    };
  });

  // Fetch sandbox images
  const { data: imagesData, isLoading: imagesLoading } = useSandboxImagesQuery();

  const aiTypes = [
    { value: 'none', label: 'None (bash shell)' },
    { value: 'qwen', label: 'Qwen Code' },
    { value: 'claude', label: 'Claude Code' },
    { value: 'gemini', label: 'Gemini CLI' },
    { value: 'codex', label: 'OpenAI Codex' }
  ];

  const handleTypeChange = (index: number, value: string) => {
    const newAiWindows = [...config.aiWindows];
    // Convert 'none' back to empty string for the type field
    newAiWindows[index] = { ...newAiWindows[index], type: value === 'none' ? '' : value };
    setConfig({ ...config, aiWindows: newAiWindows });
  };

  const handleInputChange = (index: number, field: keyof AIWindowConfig, value: string) => {
    const newAiWindows = [...config.aiWindows];
    newAiWindows[index] = { ...newAiWindows[index], [field]: value };
    setConfig({ ...config, aiWindows: newAiWindows });
  };

  const handleDockerOutofDockerChange = (checked: boolean) => {
    setConfig({ ...config, enableDockerOutofDocker: checked });
  };

  const handleAddFolderMapping = () => {
    const newFolderMappings = [...(config.folderMappings || [])];
    newFolderMappings.push({ hostPath: '', containerPath: '' });
    setConfig({ ...config, folderMappings: newFolderMappings });
  };

  const handleRemoveFolderMapping = (index: number) => {
    const newFolderMappings = [...(config.folderMappings || [])];
    newFolderMappings.splice(index, 1);
    setConfig({ ...config, folderMappings: newFolderMappings });
  };

  const handleFolderMappingChange = (index: number, field: keyof FolderMapping, value: string) => {
    const newFolderMappings = [...(config.folderMappings || [])];
    newFolderMappings[index] = { ...newFolderMappings[index], [field]: value };
    setConfig({ ...config, folderMappings: newFolderMappings });
  };

  const handleAddEnvironmentVariable = () => {
    const newEnvironmentVariables = [...(config.environmentVariables || [])];
    newEnvironmentVariables.push({ name: '', value: '' });
    setConfig({ ...config, environmentVariables: newEnvironmentVariables });
  };

  const handleRemoveEnvironmentVariable = (index: number) => {
    const newEnvironmentVariables = [...(config.environmentVariables || [])];
    newEnvironmentVariables.splice(index, 1);
    setConfig({ ...config, environmentVariables: newEnvironmentVariables });
  };

  const handleEnvironmentVariableChange = (index: number, field: keyof EnvironmentVariable, value: string) => {
    const newEnvironmentVariables = [...(config.environmentVariables || [])];
    newEnvironmentVariables[index] = { ...newEnvironmentVariables[index], [field]: value };
    setConfig({ ...config, environmentVariables: newEnvironmentVariables });
  };

  const handleAddPortMapping = () => {
    const newPortMappings = [...(config.portMappings || [])];
    newPortMappings.push({ hostPort: 0, containerPort: 0 });
    setConfig({ ...config, portMappings: newPortMappings });
  };

  const handleRemovePortMapping = (index: number) => {
    const newPortMappings = [...(config.portMappings || [])];
    newPortMappings.splice(index, 1);
    setConfig({ ...config, portMappings: newPortMappings });
  };

  const handlePortMappingChange = (index: number, field: keyof PortMapping, value: string) => {
    const newPortMappings = [...(config.portMappings || [])];
    const numericValue = field === 'hostPort' || field === 'containerPort' ? parseInt(value) || 0 : value;
    newPortMappings[index] = { ...newPortMappings[index], [field]: numericValue };
    setConfig({ ...config, portMappings: newPortMappings });
  };

  const handleSave = () => {
    // Don't filter - send all windows so the backend can process them appropriately
    // Empty windows will be ignored by the backend during container creation
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Sandbox</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="ai-windows" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="ai-windows">AI Windows</TabsTrigger>
            <TabsTrigger value="folder-mappings">Folder Mappings</TabsTrigger>
            <TabsTrigger value="port-mappings">Port Mappings</TabsTrigger>
            <TabsTrigger value="env-vars">Env. Variables</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-windows" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure AI tools for tmux windows 1-5. Window 0 will remain as the user terminal.
              </p>

              {config.aiWindows.map((window, index) => (
                <Card key={index + 1} className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Window {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`type-${index + 1}`}>AI Tool Type</Label>
                      <Select value={window.type} onValueChange={(value) => handleTypeChange(index, value)}>
                        <SelectTrigger id={`type-${index + 1}`}>
                          <SelectValue placeholder="Select AI tool" />
                        </SelectTrigger>
                        <SelectContent>
                          {aiTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {window.type && window.type !== 'none' && (
                      <>
                        <div>
                          <Label htmlFor={`apiKey-${index + 1}`}>API Key</Label>
                          <Input
                            id={`apiKey-${index + 1}`}
                            type="password"
                            value={window.apiKey}
                            onChange={(e) => handleInputChange(index, 'apiKey', e.target.value)}
                            placeholder={`Enter ${window.type} API key`}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`model-${index + 1}`}>Model (optional)</Label>
                          <Input
                            id={`model-${index + 1}`}
                            value={window.model}
                            onChange={(e) => handleInputChange(index, 'model', e.target.value)}
                            placeholder="e.g., gpt-4, claude-3-opus, etc."
                          />
                        </div>

                        <div>
                          <Label htmlFor={`baseUrl-${index + 1}`}>Base URL (optional)</Label>
                          <Input
                            id={`baseUrl-${index + 1}`}
                            value={window.baseUrl}
                            onChange={(e) => handleInputChange(index, 'baseUrl', e.target.value)}
                            placeholder="e.g., https://api.openai.com/v1"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="folder-mappings" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Folder Mappings</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFolderMapping}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Mapping
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config.folderMappings && config.folderMappings.length > 0 ? (
                    config.folderMappings.map((mapping, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`hostPath-${index}`}>Host Path</Label>
                          <Input
                            id={`hostPath-${index}`}
                            value={mapping.hostPath}
                            onChange={(e) => handleFolderMappingChange(index, 'hostPath', e.target.value)}
                            placeholder="/path/on/host"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`containerPath-${index}`}>Container Path</Label>
                          <Input
                            id={`containerPath-${index}`}
                            value={mapping.containerPath}
                            onChange={(e) => handleFolderMappingChange(index, 'containerPath', e.target.value)}
                            placeholder="/path/in/container"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveFolderMapping(index)}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No folder mappings added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="port-mappings" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Port Mappings</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPortMapping}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Mapping
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config.portMappings && config.portMappings.length > 0 ? (
                    config.portMappings.map((mapping, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`hostPort-${index}`}>Host Port</Label>
                          <Input
                            id={`hostPort-${index}`}
                            type="number"
                            value={mapping.hostPort || ''}
                            onChange={(e) => handlePortMappingChange(index, 'hostPort', e.target.value)}
                            placeholder="0-65535"
                            min="0"
                            max="65535"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`containerPort-${index}`}>Container Port</Label>
                          <Input
                            id={`containerPort-${index}`}
                            type="number"
                            value={mapping.containerPort || ''}
                            onChange={(e) => handlePortMappingChange(index, 'containerPort', e.target.value)}
                            placeholder="0-65535"
                            min="0"
                            max="65535"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemovePortMapping(index)}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No port mappings added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="env-vars" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Environment Variables</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEnvironmentVariable}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variable
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config.environmentVariables && config.environmentVariables.length > 0 ? (
                    config.environmentVariables.map((envVar, index) => (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`envVarName-${index}`}>Variable Name</Label>
                          <Input
                            id={`envVarName-${index}`}
                            value={envVar.name}
                            onChange={(e) => handleEnvironmentVariableChange(index, 'name', e.target.value)}
                            placeholder="MY_VARIABLE"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`envVarValue-${index}`}>Value</Label>
                          <Input
                            id={`envVarValue-${index}`}
                            value={envVar.value}
                            onChange={(e) => handleEnvironmentVariableChange(index, 'value', e.target.value)}
                            placeholder="variable_value"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveEnvironmentVariable(index)}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No environment variables added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sandbox Image</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the Docker image to use for this sandbox. If not specified, the default image will be used.
                </p>
              </CardHeader>
              <CardContent>
                {imagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading images...</span>
                  </div>
                ) : imagesData && imagesData.images.length > 0 ? (
                  <div className="space-y-3">
                    <Select
                      value={config.imageName || imagesData.defaultImageId || ''}
                      onValueChange={(value) => setConfig({ ...config, imageName: value })}
                    >
                      <SelectTrigger id="image-select">
                        <SelectValue placeholder="Select an image" />
                      </SelectTrigger>
                      <SelectContent>
                        {imagesData.images.map((image: SandboxImage) => (
                          <SelectItem key={image.id} value={image.id}>
                            <div className="flex items-center gap-2">
                              <span>{image.name}</span>
                              {image.isDefault && (
                                <span className="text-xs text-muted-foreground">(default)</span>
                              )}
                              {image.tags && image.tags.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {image.tags.join(', ')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {config.imageName && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Selected: </span>
                        <span className="font-medium">
                          {imagesData.images.find((img: SandboxImage) => img.id === config.imageName)?.name || config.imageName}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No images available. Using default image.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4 max-h-96 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Docker-out-of-Docker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-docker-outof-docker"
                    checked={config.enableDockerOutofDocker}
                    onCheckedChange={(checked) => handleDockerOutofDockerChange(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="enable-docker-outof-docker">Enable Docker-out-of-Docker</Label>
                    <p className="text-sm text-muted-foreground">
                      Mount /var/run/docker.sock to allow Docker commands inside the container
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}