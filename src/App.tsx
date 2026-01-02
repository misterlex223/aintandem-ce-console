import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AIBasePage } from '@/pages/ai-base-page';
import { SandboxesPage } from '@/pages/sandboxes-page';
import { SandboxPage } from '@/pages/sandbox-page';
import { ShellPage } from '@/pages/shell-page';
import { DocsPage } from '@/pages/docs-page';
import { WorkflowPage } from '@/pages/workflow-page';
import { WorkflowsPage } from '@/pages/workflows-page';
import { WorkflowEditorPage } from '@/pages/workflow-editor-page';
import ContextPage from '@/pages/context-page';
import SettingsPage from '@/pages/settings-page';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';
import { LoginPage } from '@/pages/auth/LoginPage';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { AInTandemProvider } from '@aintandem/sdk-react';

// Build API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function App() {
  return (
    <AInTandemProvider
      config={{
        baseURL: API_BASE_URL || window.location.origin,
      }}
      onAuthSuccess={(user) => {
        console.log('[AInTandemProvider] Auth success:', user);
      }}
      onAuthError={(error) => {
        console.error('[AInTandemProvider] Auth error:', error);
      }}
    >
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute children={<MainLayout />} />}>
            <Route path="/" element={<AIBasePage />} />
            <Route path="/sandboxes" element={<SandboxesPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/workflow/new" element={<WorkflowEditorPage />} />
            <Route path="/workflow/:id/edit" element={<WorkflowEditorPage />} />
            <Route path="/context" element={<ContextPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          {/* Full-width pages without MainLayout container - also protected */}
          <Route path="/sandbox/:id" element={
            <PrivateRoute children={<SandboxPage />} />
          } />
          <Route path="/project/:projectId/workflow" element={
            <PrivateRoute children={<WorkflowPage />} />
          } />
          {/* Keep old routes for backward compatibility - also protected */}
          <Route element={<PrivateRoute children={<MainLayout />} />}>
            <Route path="/shell/:id" element={<ShellPage />} />
            <Route path="/docs/:id" element={<DocsPage />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </AInTandemProvider>
  );
}

export default App;
