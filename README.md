# oraclous-frontend

The TypeScript/React codebase for the Oraclous Platform's customer-facing surfaces: the console, the developer portal, and embeddable widgets.

> The working contract for any agent (or human) in this repo is [`CLAUDE.md`](./CLAUDE.md) — read it first.

## Git hooks setup

Commit-message policy is enforced by a hook in `.githooks/`. Activate once after cloning:

```bash
git config core.hooksPath .githooks
```

The hook rejects forbidden attribution trailers (`Co-Authored-By`, `Generated with/by`, `claude.ai`, `anthropic`, `🤖`). See `CLAUDE.md` for the expected commit format.
