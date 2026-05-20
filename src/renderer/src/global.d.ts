import type { ApiFilesBridge } from '../../preload/preload';

declare global {
  interface Window {
    apiFiles: ApiFilesBridge;
  }
}
