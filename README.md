# Lestari

Digital inheritance prototype. The application workspace is in [`warisan-digital/`](warisan-digital/), not at the repository root.

## Repository map

- [`apps/web`](warisan-digital/apps/web/): Next.js frontend.
- [`apps/api`](warisan-digital/apps/api/): Fastify API.
- [`packages/contracts`](warisan-digital/packages/contracts/): Solidity contracts and contract tests.
- [`packages/shared`](warisan-digital/packages/shared/): shared TypeScript types, constants, and utilities.

The workspace [`package.json`](warisan-digital/package.json) defines npm workspaces and the development, build, and test commands. Run workspace commands from `warisan-digital/`. For example, after cloning this repository:

```sh
cd Lestari/warisan-digital
```

See the [workspace README](warisan-digital/README.md) for setup notes and the [npm migration notes](warisan-digital/MIGRATION_pnpm_to_npm.md) for package-manager context.

## Scope

Treat this repository as a prototype. The workspace documentation describes integrations and legal or security properties that are not independently verified by this repository overview. Do not infer legal validity, audited security, or working external services from those descriptions.
