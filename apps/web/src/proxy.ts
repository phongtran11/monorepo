import { authAdminProxy } from '@web/lib/proxy';
import type { NextRequest } from 'next/server';

/** Proxies incoming requests through the admin auth layer. */
export function proxy(request: NextRequest) {
  return authAdminProxy(request);
}

/** Route matcher config — excludes API routes, Next.js internals, and static assets. */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
