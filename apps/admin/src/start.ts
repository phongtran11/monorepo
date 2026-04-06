import { createStart } from '@tanstack/react-start';

/**
 * TanStack Start entry point.
 * Registers global server function middleware applied to every server function.
 */
export const startInstance = createStart(() => ({
  functionMiddleware: [],
  requestMiddleware: [],
}));
