import { InfraiClient, infrai } from "./infrai_client.ts";
import { meterMatter } from "./usage_meter.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");

const client = new InfraiClient(key);
const temporary = await client.request<{ key_id: string; key?: string }>("POST", "/v1/account/keys/create", {
  name: "legal-matter-demo",
  scopes: ["account.usage"],
  idempotency_key: "legal-matter-demo-create"
});
if (!temporary.key_id) throw new Error("The temporary key response did not include a key_id");
const rotated = await client.request("POST", `/v1/account/keys/rotate/${temporary.key_id}`, {
  grace_hours: 1,
  idempotency_key: "legal-matter-demo-rotate"
});
await client.request("DELETE", `/v1/account/keys/revoke/${temporary.key_id}`);
const measured = meterMatter({
  customerId: process.env.CUSTOMER_ID ?? "acme-law",
  matterId: process.env.MATTER_ID ?? "matter-1042",
  signedDocumentCount: Number(process.env.SIGNED_DOCUMENTS ?? "2"),
  deadlineFollowUpCount: Number(process.env.DEADLINE_FOLLOW_UPS ?? "1")
});

const usage = await client.request("GET", "/v1/account/usage");
console.log(JSON.stringify({ capability: infrai.account.usage, measured, temporaryKeyRotated: Boolean(rotated), accountUsage: usage }, null, 2));
