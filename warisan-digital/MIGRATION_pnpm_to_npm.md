# Migration Guide: pnpm → npm

## Summary

All references to `pnpm` have been successfully converted to `npm`. The project now uses **npm workspaces** (native npm feature available in Node.js 18+) instead of pnpm.

## Changes Made

### 1. Root Configuration Files

#### ✅ `package.json`
- Updated all workspace scripts from `pnpm --filter` to `npm --workspace=`
- Kept `"workspaces"` array (npm native feature)
- Commands changed:
  ```bash
  # Before: pnpm --filter @warisan-digital/contracts run build
  # After:  npm --workspace=@warisan-digital/contracts run build
  ```

#### ✅ `.gitignore`
- Removed `pnpm-lock.yaml`
- Kept `package-lock.json` (npm lock file)
- Removed `pnpm-debug.log*` references

#### ✅ `pnpm-workspace.yaml`
- **DELETED** - No longer needed as npm has native workspace support
- npm workspaces are configured via `package.json` `"workspaces"` field

### 2. Documentation

#### ✅ `README.md`
All command examples updated:

| Task | Before | After |
|------|--------|-------|
| Install | `pnpm install` | `npm install` |
| Dev | `pnpm dev` | `npm run dev` |
| Specific workspace | `pnpm --filter @warisan-digital/api run dev` | `npm --workspace=@warisan-digital/api run dev` |
| Build | `pnpm build` | `npm run build` |
| Tests | `pnpm contracts:test` | `npm run contracts:test` |
| Database | `pnpm db:generate` | `npm run db:generate` |

#### ✅ Prerequisites section
- Updated from "pnpm 8+" to "Node.js 18+ (includes npm)"

### 3. Package.json Files

#### ✅ `packages/shared/package.json`
- Already correct (no workspace dependencies)

#### ✅ `packages/contracts/package.json`
- Already correct (no workspace dependencies)

#### ✅ `apps/api/package.json`
- Changed: `"@warisan-digital/shared": "workspace:*"` → `"@warisan-digital/shared": "*"`

#### ✅ `apps/web/package.json`
- Changed: `"@warisan-digital/shared": "workspace:*"` → `"@warisan-digital/shared": "*"`

## Quick Reference: npm vs pnpm Commands

### Installation & Setup
```bash
# Install dependencies
npm install

# Add package to workspace
npm install <package>

# Install in specific workspace
npm --workspace=@warisan-digital/api install <package>
```

### Development
```bash
# Run all dev servers
npm run dev

# Run specific workspace
npm --workspace=@warisan-digital/api run dev
npm --workspace=@warisan-digital/web run dev

# Run from specific directory
cd apps/api && npm run dev
```

### Build & Deploy
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm --workspace=@warisan-digital/contracts run compile

# Deploy contracts
npm run contracts:deploy

# Database operations
npm run db:generate
npm run db:push
npm run db:migrate
```

### Testing
```bash
# Test all workspaces
npm run test

# Test specific workspace
npm --workspace=@warisan-digital/contracts run test

# View coverage
npm run test:coverage
```

### Linting & Type Checking
```bash
# Run all linters
npm run lint

# Type check all
npm run typecheck

# Specific workspace
npm --workspace=@warisan-digital/api run lint
npm --workspace=@warisan-digital/contracts run lint
```

## npm Workspaces Benefits

✅ **Native to Node.js** - No external package manager needed
✅ **Better performance** - Unified lockfile with deduplicated dependencies
✅ **Simplified setup** - Just configure in `package.json`
✅ **Full npm compatibility** - All npm commands work as expected
✅ **Easier CI/CD** - No need to install additional tools
✅ **Smaller footprint** - No pnpm binary installation

## npm Workspaces Requirements

- ✅ **Node.js 16.13.0+** (full npm workspace support in 16.13.0 and later)
- ✅ **npm 7.0.0+** (recommended: npm 8.5.0+)

Check your version:
```bash
node --version   # Should be v16.13.0+
npm --version    # Should be 7.0.0+
```

Update if needed:
```bash
npm install -g npm@latest
```

## Installation Instructions (Updated)

```bash
# 1. Clone and navigate
git clone <repo-url>
cd warisan-digital

# 2. Install dependencies with npm (NOT pnpm!)
npm install

# 3. Setup environment
cp .env.example .env.local
nano .env.local

# 4. Start development
npm run dev

# 5. Deploy contracts
npm run contracts:deploy

# 6. Setup database
npm run db:generate
npm run db:push
```

## Troubleshooting

### "npm ERR! code EWORKSPACECYCLE"
- This means circular dependencies detected
- Review workspace references in your `package.json` files

### "npm ERR! Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that workspace package names in `package.json` are correct

### "Package not found in workspace"
- Verify the workspace is listed in root `package.json` `"workspaces"` array
- Ensure the package has a valid `package.json` with `"name"` field

### Lock file issues
- Delete `package-lock.json` and run `npm install` again
- For CI/CD, always commit `package-lock.json`

## Migration Checklist

- ✅ Updated root `package.json` scripts
- ✅ Removed `pnpm-workspace.yaml`
- ✅ Updated `.gitignore` (removed pnpm references)
- ✅ Updated all workspace dependency versions to `"*"`
- ✅ Updated `README.md` with npm commands
- ✅ Verified all package.json files are valid
- ✅ Tested `npm install` works correctly
- ✅ Confirmed `npm --workspace=` commands work

## Notes for Developers

1. **Always use npm** - Don't accidentally use `pnpm` or `yarn`
2. **Workspace syntax** - Use `npm --workspace=<name>` instead of `pnpm --filter`
3. **Dependencies** - When adding deps to workspace, specify which workspace
4. **Lock file** - Commit `package-lock.json` to version control

---

**Migration completed successfully! ✅**

The project is now fully using npm workspaces and no longer depends on pnpm.
