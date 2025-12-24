// Global type definitions for Electron environment
declare global {
  interface Window {
    __IN_AINTANDEM_DESKTOP__?: boolean;
    kai?: {
      apiProxy: {
        request: (options: {
          method?: string;
          path: string;
          headers?: Record<string, string>;
          body?: any;
        }) => Promise<any>;
      };
    };
    process?: {
      type?: string;
    };
  }
}

export {};