# Publishing SpotClean for n8n Cloud

n8n Cloud only installs **verified** community nodes. Follow this once the package builds cleanly.

## 1. GitHub + npm package

1. Create the GitHub repo `LHCTech/n8n-nodes-spotclean` (or update `package.json` `repository.url`).
2. Push this folder to `main`.
3. On npmjs.com, create/claim the package name `n8n-nodes-spotclean`.
4. Under package **Publish access → Trusted Publishers**, add GitHub Actions:
   - Repository owner / name matching GitHub
   - Workflow name: `publish.yml`
5. (Fallback) Or set repo secret `NPM_TOKEN` (granular publish token).

## 2. Release

Use **Node 22** locally and in CI (pinned in workflows; `lts/*` / Node 24+ breaks `n8n-node lint`).

```bash
npm run lint
npm run build
npm run release   # bumps version, tags, pushes → triggers publish.yml
```

Tags must match `*.*.*` (e.g. `0.1.0`) per [`.github/workflows/publish.yml`](.github/workflows/publish.yml). After a successful publish, bump again before re-running — npm rejects republishing the same version.

Auth: Trusted Publisher (OIDC) **or** repo secret `NPM_TOKEN` (mapped to `NODE_AUTH_TOKEN` in `publish.yml`).

## 3. Creator Portal

1. Sign in to the [n8n Creator Portal](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/).
2. Submit `n8n-nodes-spotclean` for verification.
3. After approval, Cloud workspace owners can install SpotClean from the Nodes panel.

## Checklist before submit

- [ ] `npm run lint` and `npm run build` pass
- [ ] No runtime `dependencies` in `package.json`
- [ ] Credential test hits `GET /api/integrations/v1/me`
- [ ] Trigger subscribe/unsubscribe against `/hooks`
- [ ] README documents Settings → Integrations → n8n token
