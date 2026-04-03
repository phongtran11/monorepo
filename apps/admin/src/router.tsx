import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getContext } from './integrations/tanstack-query/root-provider';

export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <div>404 - Not Found</div>,
    defaultErrorComponent: ({ error }) => (
      <div>
        <h1>500 - Server Error</h1>
        <p>{error.message}</p>
      </div>
    ),
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
