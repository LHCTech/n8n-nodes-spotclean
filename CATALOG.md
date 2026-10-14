# SpotClean platform catalog (ops)

After deploying the SpotClean API change that adds `n8n` to `TOKEN_PROVIDER_KEYS`:

1. Sign in as **platform admin**.
2. Open **Platform → Integrations**.
3. Create a row:
   - **Key:** `n8n` (immutable after create)
   - **Name:** `n8n`
   - **Category:** OTHER
   - **Enabled in API:** on
   - **Visible to users:** on (or off first for beta-only testers)
   - **Logo:** upload n8n / SpotClean mark
   - **Description:** e.g. “Connect SpotClean to n8n Cloud workflows”
4. Confirm tenant **Settings → Integrations** shows **n8n** with Connect / Create token (`sc_live_…`).

Without this catalog row, the provider is wired in code but tenants will not see a card.

Order: deploy API → create catalog row → tenants create tokens → use in n8n credentials.
