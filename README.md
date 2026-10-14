# SpotClean for n8n

n8n community node for [SpotClean](https://spotclean.app) — automate clients, properties (houses), visits, and invoices, and react instantly when something changes in SpotClean.

Works on **n8n Cloud** after the package is published as a [verified community node](https://docs.n8n.io/integrations/community-nodes/installation/), and on self-hosted n8n via npm.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

### n8n Cloud (verified)

1. Open the Nodes panel → search **SpotClean**.
2. Install from **More from the community** (workspace owner).
3. Add **SpotClean API** credentials with your `sc_live_…` key.

### Self-hosted

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/), package name: `n8n-nodes-spotclean`.

## Credentials

1. Sign in to SpotClean (admin panel).
2. Go to **Settings → Integrations**.
3. Open **n8n**, create an API key (`sc_live_…`), and paste it into the n8n credential.
4. Optional: set **Base URL** (default `https://api.spotclean.app`) for staging.

You need an active SpotClean plan that includes Integrations.

## Nodes

### SpotClean Trigger

Starts the workflow when SpotClean publishes an event. Pick one event per trigger:

| Event | When it fires |
|-------|----------------|
| `client.created` / `client.updated` | Client is created or updated |
| `house.created` | Property is created |
| `visit.created` / `visit.changed` / `visit.canceled` / `visit.finished` | Visit lifecycle |
| `invoice.created` / `invoice.paid` | Invoice created or marked paid |

Uses SpotClean REST Hooks (`POST/DELETE /api/integrations/v1/hooks`).

### SpotClean (actions)

| Resource | Operations |
|----------|------------|
| Client | Get Many, Get, Create, Update, Delete |
| House | Get Many, Get, Create, Update, Delete |
| Visit | Get Many, Get, Create, Update, Cancel |
| Invoice | Get Many, Get, Create, Mark Paid, Delete |

Dropdowns cascade (Client → House → Visit / Invoice) so you do not need to copy IDs by hand.

## Typical workflows

- When a **visit is finished**, create a row in Google Sheets or notify Slack.
- When a **client is created**, sync them to your CRM.
- On a schedule, **Get Many visits** for the day and send a digest email.
- When an **invoice is paid**, update accounting.

## API docs

- Swagger UI: https://api.spotclean.app/api/docs/integrations
- SpotClean Integrations guide: see SpotClean API repo `docs/INTEGRATIONS.md`

## Development

```bash
npm install
npm run build
npm run lint
npm run dev   # local n8n with this package hot-reloaded
```

**Verified community node constraints:** no runtime `dependencies` (only `n8n-workflow` peer). Publish via GitHub Actions with provenance — see [PUBLISH.md](./PUBLISH.md).

## License

[MIT](./LICENSE.md)
