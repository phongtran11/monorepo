# @lam-thinh-ecommerce/eslint-config

Shared ESLint 9 flat-config base for all packages in the monorepo. Bundles Prettier integration and import sorting out of the box.

## What's included

- **Prettier** — `eslint-config-prettier` (disables conflicting rules) + `eslint-plugin-prettier` (reports formatting as lint errors)
- **Import sorting** — `eslint-plugin-simple-import-sort` (auto-fixable, alias-aware)
- **TypeScript** — configured for `typescript-eslint` (peer dependency)

## Usage

Extend the base config in each package's `eslint.config.mjs`:

```javascript
import base from '@lam-thinh-ecommerce/eslint-config/base.mjs';

export default [
  ...base,
  {
    // package-specific overrides
  },
];
```

## Peer Dependencies

```json
{
  "@eslint/js": ">=9.0.0",
  "eslint": ">=9.0.0",
  "prettier": ">=3.0.0",
  "typescript": ">=5.0.0",
  "typescript-eslint": ">=8.0.0"
}
```

All peer dependencies are already installed at the workspace root — individual packages do not need to install them separately.

## Import Order Convention

The sort order enforced across all packages:

1. External packages
2. Internal aliases — `@lam-thinh-ecommerce/...`, `@api/*`, `@admin/*`
3. Relative imports

Always prefer alias imports over relative paths when an alias covers the target.
