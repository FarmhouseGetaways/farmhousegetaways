/**
 * The clock.
 *
 * Netlify runs this every hour, on its own, whether or not anybody has the app
 * open — which is the entire reason a reminder can arrive on a phone that is
 * face down on a kitchen counter.
 *
 * Once an hour rather than once a day because the hour that matters is a LOCAL
 * hour, and two devices can be in two places. The decision about whether any
 * particular phone is owed something is made in _lib/remind.mjs, and it is
 * mostly "no".
 */
import { runReminders } from "./_lib/tick.mjs";

export const config = { schedule: "0 * * * *" };

export default async () => {
  const report = await runReminders();
  // Shows up in the function log, which is where somebody looks when a
  // reminder did not arrive.
  console.log("reminder tick:", JSON.stringify(report));
  return new Response(JSON.stringify(report), { headers: { "content-type": "application/json" } });
};
