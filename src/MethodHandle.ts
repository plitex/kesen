export interface MethodHandle<T> {
  readonly id: string;
  readonly resolve: (value?: T | PromiseLike<T> | undefined) => void;
  readonly reject: (reason?: any) => void;
}

export interface MethodHandleMap {
  [key: string]: MethodHandle<any>;
}
