import type { Config } from "@netlify/functions";
import { json, retryFailedNotifications } from "./_intake-shared.mjs";

export default async () => {
  const retried = await retryFailedNotifications();
  return json({ ok: true, retried: retried.length });
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
