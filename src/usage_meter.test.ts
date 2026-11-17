import assert from "node:assert/strict";
import { meterMatter } from "./usage_meter.ts";

const result = meterMatter({ customerId: "firm-7", matterId: "m-9", signedDocumentCount: 3, deadlineFollowUpCount: 2 });
assert.deepEqual(result, { customerId: "firm-7", matterId: "m-9", units: 6 });
console.log("meterMatter counts intake, signed delivery, and deadline follow-up units");
