---
description: "Future idea: migrate standalone configurator into SaaS embed service with subscriptions and admin panel"
applyTo: "**"
---

# Idea: SaaS Embed Service (Future)

Status: idea-only  
Priority: high  
Execution policy: do not implement unless user explicitly asks for implementation

## Goal
Transform the current standalone configurator into a subscription-based SaaS widget embeddable on client websites.

## Current Constraint
- Keep current standalone app fully working.
- This document is only a future-plan instruction for AI agents.

## Target Product Shape
1. Client adds one embed script on their website.
2. Script mounts iframe with configurator hosted by SaaS.
3. Iframe fetches tenant-specific configuration from SaaS backend.
4. Admin panel controls options, branding, limits, and plan entitlements.

## Why Iframe First
1. Isolation from host CSS/JS conflicts.
2. Safer tenant boundary and origin control.
3. Easier rollout/versioning.
4. Simpler billing entitlement enforcement.

## Core Components
1. Embed Loader
- Lightweight JS loader
- Reads public tenant/widget ids
- Creates container and iframe

2. Widget Runtime
- Hosted on SaaS domain
- Runs full 3D configurator
- Uses postMessage contract

3. SaaS API
- Public config endpoint per widget
- Lead submission endpoint
- Subscription entitlement checks
- Allowed-domain validation

4. Admin Panel
- Tenant config editor
- Plan/feature management
- Domain allowlist management
- Publish/version flow

## Minimal Data Model
- Tenant
- Subscription
- Widget
- WidgetConfig
- AllowedDomain
- Lead
- AuditLog

## Security Requirements
1. No secrets inside embed script.
2. Short-lived signed bootstrap token for iframe.
3. Strict origin validation and allowed domains.
4. Rate limiting on public endpoints.
5. Hard tenant isolation in API and data access.

## Integration Events (postMessage)
- widget.ready
- widget.config.changed
- widget.lead.submitted
- widget.error

## Roadmap
1. Phase 1: Embed MVP
- Loader script
- Iframe runtime
- Public config endpoint
- Domain allowlist

2. Phase 2: Subscription
- Billing integration
- Entitlement middleware
- Graceful disabled mode for expired plans

3. Phase 3: Admin
- Config UI per tenant
- Publish/version history
- Audit trail

4. Phase 4: Integrations
- Webhooks
- CRM connectors
- Analytics exports

## MVP Definition of Done
1. Widget works via one script on external website.
2. Correct tenant config is fetched from backend.
3. Unknown domains are blocked.
4. Standalone app flow remains unchanged.
5. Basic operational logging is available.

## Agent Guidance
When user asks to start this initiative:
1. Start with architecture and contracts, not immediate coding.
2. Propose smallest reversible implementation step.
3. Preserve backward compatibility with standalone mode.
4. For each change, list security and tenant-impact checks.
5. Validate no regression in current configurator UX.

## Open Questions
1. Shared widget domain vs custom tenant domains?
2. White-label in v1 or paid tier only?
3. Required lead payload for CRM sync?
4. Self-serve onboarding scope for first release?
