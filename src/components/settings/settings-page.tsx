import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAInTandem } from '@aintandem/sdk-react';
import { DOCKER_CONFIG } from '@/config/constants';

interface SettingsData {
  gitDisplayName?: string;
  gitEmail?: string;
  dockerImage?: string;
}

export function SettingsPage() {
  const { client } = useAInTandem();
  const [settings, setSettings] = useState<SettingsData>({
    gitDisplayName: '',
    gitEmail: '',
    dockerImage: DOCKER_CONFIG.DEFAULT_IMAGE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Fix SDK type incompatibility, remove any type assertion
      const fetchedSettings = await client.settings.getSettings() as SettingsData;
      setSettings({
        gitDisplayName: fetchedSettings.gitDisplayName || '',
        gitEmail: fetchedSettings.gitEmail || '',
        dockerImage: fetchedSettings.dockerImage || DOCKER_CONFIG.DEFAULT_IMAGE,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default values if loading fails
      setSettings({
        gitDisplayName: '',
        gitEmail: '',
        dockerImage: DOCKER_CONFIG.DEFAULT_IMAGE,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Fix SDK type incompatibility, remove any type assertion
      await client.settings.updateSettings(settings as unknown as any);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {saveStatus && (
        <div className={`mb-4 p-3 rounded ${saveStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {saveStatus.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Git Settings</CardTitle>
          <CardDescription>Configure your Git identity information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gitDisplayName">Git Display Name</Label>
            <Input
              id="gitDisplayName"
              value={settings.gitDisplayName || ''}
              onChange={(e) => handleChange('gitDisplayName', e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gitEmail">Git Email</Label>
            <Input
              id="gitEmail"
              type="email"
              value={settings.gitEmail || ''}
              onChange={(e) => handleChange('gitEmail', e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Docker Settings</CardTitle>
            <CardDescription>Configure Docker image for Flexy sandbox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dockerImage">Docker Image</Label>
              <Input
                id="dockerImage"
                value={settings.dockerImage || DOCKER_CONFIG.DEFAULT_IMAGE}
                onChange={(e) => handleChange('dockerImage', e.target.value)}
                placeholder="Enter Docker image name"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}