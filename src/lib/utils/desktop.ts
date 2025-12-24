/**
 * Helper function to detect if running in Electron environment
 */
export function isElectron(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process?.type === 'renderer'
  ) || (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron')
  ) || (
    typeof window !== 'undefined' &&
    (window as any).__IN_AINTANDEM_DESKTOP__ !== undefined
  );
}
