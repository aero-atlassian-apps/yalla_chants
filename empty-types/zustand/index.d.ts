declare module 'zustand' {
  // Minimal stub to satisfy type checking in environments without node_modules
  export type StateCreator<T> = (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T

  export function create<T>(initializer: StateCreator<T>): {
    (): T;
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
  } & T;
}

