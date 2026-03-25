import { Link } from '@web/components/atoms/link';

/**
 * Page (Server Component) — STATIC
 * ─────────────────────────────────────────────
 * Strategy: All data is known at build time.
 *           No params, no searchParams, no cookies.
 *           Next.js will pre-render this as static HTML.
 *
 * Flow: Page → Template → Organism → Molecule → Atom
 *
 * @see /products/[slug]/page.tsx for DYNAMIC page strategy
 */
export default function HomePage() {
  return null;
}
