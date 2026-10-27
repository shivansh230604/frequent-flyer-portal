/**
 * Logs telemetry for primary portal actions.
 * Format: "[Analytics] User interacted with End-to-End Frequent Flyer Portal: <action_name>"
 */
export function logTelemetry(actionName: string, payload?: unknown): void {
  const message = `[Analytics] User interacted with End-to-End Frequent Flyer Portal: ${actionName}`;
  console.log(message, payload ?? {});
}
