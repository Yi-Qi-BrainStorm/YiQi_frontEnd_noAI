export interface PendingPromise {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeoutId: number;
}
