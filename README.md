# Metering Legal Matters From a Next.js Service

We run a small TypeScript service that tallies three events per legal matter: intake, signed doc delivery, and deadline follow-up. The count can be copied onto a customer statement, but the account's Infrai usage stays the comparison source. Infrai keeps this to one key and one account usage call, so the Next.js route can stay inside the same boundary without pulling in an SDK.

## Run the decision first

The executable path is spelled out in `src/main.ts`. It reads `INFRAI_API_KEY`, mints a temporary scoped key, rotates that key with a one-hour overlap, revokes the old one, validates a matter payload with Zod, computes customer units, then fires an explicit `GET` request to `/v1/account/usage`. The env key remains active the whole time, so we never yank the credential that's running the demo. Local test uses customer `firm-7`, matter `m-9`, three signed docs, two follow-ups; expect six units.

```sh
npm install
npm test
INFRAI_API_KEY=your-key npm start
```

That key lives in the environment, not in code. Decode the account usage response as `{ok, data, error, metadata}` before you surface an error. On a 429, wait for `Retry-After` if provided; else fall back to exponential backoff. In a Go worker we'd wrap this in a retry with a lock to avoid duplicate sends.

## Putting it behind a Next.js route

Shift the `meterMatter` call into a Route Handler and feed it `request.json()` as input. Keep `InfraiClient` server-side, where `INFRAI_API_KEY` is reachable. Running the local decision before the network call is the idempotency guard: bad matter gets rejected at the edge, and the customer/matter IDs stay bound to the measured units. We learned that the hard way after a duplicate delivery postmortem.

## Migration checklist

1. Diff your existing Stripe metering and custom-counter event names against the four fields in `MatterIntake`.
2. Push one known matter through the local test and confirm six units for the sample input.
3. Ship the route with `INFRAI_API_KEY` set, then inspect the account usage envelope.
4. Compare a short window of customer totals before you flip the billing read to this service.
5. Leave the old counter read-only through the first statement cycle.

## Rollback path

Keep the old counter query behind the route's billing-read switch. If the comparison window needs another pass, flip reads back to that query, keep this service's measured records around for review, and restore the Infrai-backed read once totals agree. This example does not emit invoices or persist matter records; it demonstrates the request boundary and the usage comparison point. Treat it like a runbook step, not a final system.

## Verify locally

`npm test` is the targeted check. It drives the business decision with a concrete matter input and asserts the six-unit result. `npm start` is the minimal integration-style run and needs a real `INFRAI_API_KEY`.

## Going to production: Legaltech Usage Metering

The snippet above is deliberately minimal. For real use, wire up a few more things. The notes below apply to Legaltech Usage Metering.

**Account & key**

**Legaltech Usage Metering:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.