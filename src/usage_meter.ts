import { z } from "zod";

export const intakeSchema = z.object({
  customerId: z.string().min(1),
  matterId: z.string().min(1),
  signedDocumentCount: z.number().int().nonnegative(),
  deadlineFollowUpCount: z.number().int().nonnegative()
});

export type MatterIntake = z.infer<typeof intakeSchema>;

export function meterMatter(input: unknown) {
  const matter = intakeSchema.parse(input);
  const units = 1 + matter.signedDocumentCount + matter.deadlineFollowUpCount;
  return { customerId: matter.customerId, matterId: matter.matterId, units };
}
