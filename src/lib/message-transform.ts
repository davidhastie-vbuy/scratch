/**
 * Transforms the "accepted in principle" system message
 * from provider-facing next-steps to customer-facing next-steps.
 */
export function transformAcceptedMessageForCustomer(body: string): string {
  if (!body.includes("Terms accepted in principle")) return body;

  return body
    .replace(
      /⏳ Next steps:\n1\. Please set up payment milestones for this job\.\n2\. Once the customer pays the first milestone deposit, you can start work based on the agreed schedule\.\n\n💡 The job is fully confirmed once the customer makes the first milestone payment\./,
      "⏳ Next steps:\n1. Your provider will now set up payment milestones for this job.\n💡 2. Please pay the deposit milestone as soon as possible to fully confirm the job and ensure work starts on time."
    );
}
