import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SandboxLayout } from '@/components/layout/sandbox-layout';
import { TasksTabView } from '@/components/task/tasks-tab-view';
import { getClient } from '@/lib/api/api-helpers';

export function SandboxPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'shell';

  const [projectId, setProjectId] = useState<string | null>(null);
  const terminalIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchSandboxData = async () => {
      if (!id) return;

      // Get project ID for this sandbox
      try {
        const client = getClient();
        const sandboxes = await client.sandboxes.listSandboxes() as any;
        const currentSandbox = sandboxes.find((s: any) => s.id === id);
        if (currentSandbox?.projectId) {
          setProjectId(currentSandbox.projectId);
        }
      } catch (error) {
        console.error('Failed to fetch sandbox data:', error);
      }
    };

    fetchSandboxData();
  }, [id]);

  // Function to switch tmux window by sending keyboard commands
  const switchTmuxWindow = (windowIndex: number) => {
    const iframe = terminalIframeRef.current;
    if (!iframe || !iframe.contentWindow) {
      console.warn('Terminal iframe not ready');
      return;
    }

    // Send Ctrl+b followed by the window number
    // ttyd uses xterm.js which listens to keyboard events
    const ctrlEvent = new KeyboardEvent('keydown', {
      key: 'Control',
      code: 'ControlLeft',
      keyCode: 17,
      ctrlKey: true,
      bubbles: false,
    });
    const ctrlBEvent = new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      keyCode: 66,
      ctrlKey: true,
      bubbles: false,
    });

    const numberEvent = new KeyboardEvent('keydown', {
      key: windowIndex.toString(),
      code: `Digit${windowIndex}`,
      keyCode: 48 + windowIndex,
      bubbles: false,
    });

    try {
      // Try to dispatch to the iframe's terminal
      iframe.contentWindow.postMessage({
        type: 'tmux-switch-window',
        window: windowIndex,
      }, '*');

      // Also try direct keyboard event dispatch (may not work due to CORS)
      iframe.contentWindow.dispatchEvent(ctrlEvent);
      iframe.contentWindow.dispatchEvent(ctrlBEvent);
      setTimeout(() => {
        iframe.contentWindow?.dispatchEvent(numberEvent);
      }, 100);
    } catch (error) {
      console.error('Failed to send tmux command:', error);
    }
  };

  return id ? (
    <SandboxLayout id={id} activeTab={activeTab} terminalIframeRef={terminalIframeRef as React.RefObject<HTMLIFrameElement>} switchTmuxWindow={switchTmuxWindow}>
      {/* Tasks tab content - passed as children to SandboxLayout */}
      <div className="h-[calc(100vh-3.5rem)] w-full overflow-y-auto">
        {projectId ? (
          <TasksTabView projectId={projectId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>No project associated with this sandbox</p>
              <p className="text-sm mt-2">Tasks are only available for project-based sandboxes</p>
            </div>
          </div>
        )}
      </div>
    </SandboxLayout>
  ) : (
    <div>Loading...</div>
  );
}
