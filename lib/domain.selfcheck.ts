// ponytail: no test runner installed; assert-based self-check for the risk/CSV logic.
// Run with: node --experimental-strip-types lib/domain.selfcheck.ts
import assert from "node:assert/strict";
import {
  buildOperationDocs,
  completionPct,
  daysUntil,
  missingDocs,
  riskScore,
  slugify,
  toCsv,
  withinDeadlineWindow,
} from "./domain.ts";

const now = new Date("2026-07-02T23:59:59");

const docs = buildOperationDocs("op-1", "importacion");
assert.equal(docs.length, 7, "importacion checklist has 7 docs");
assert.equal(missingDocs(docs).length, 7, "all docs missing by default");
assert.equal(completionPct(docs), 0, "0% complete with nothing received");

const firstDoc = docs[0];
assert.ok(firstDoc, "first doc exists");
firstDoc.received = true;
assert.equal(completionPct(docs), Math.round((1 / 7) * 100));

// Leave a single non-keyword doc missing so risk score doesn't saturate at 100.
for (const doc of docs) {
  if (doc.name !== "Packing list") doc.received = true;
}
assert.equal(missingDocs(docs).length, 1);

assert.equal(daysUntil("2026-07-09", now), 7);
assert.equal(daysUntil("2026-06-30", now), -2, "overdue dates are negative");

const overdueScore = riskScore(docs, "2026-06-30", now);
const futureScore = riskScore(docs, "2026-08-01", now);
assert.ok(overdueScore > futureScore, "overdue operations score higher risk");
assert.ok(overdueScore <= 100 && futureScore >= 0, "risk score stays within 0..100");

assert.equal(withinDeadlineWindow("2026-07-05", 7, now), true);
assert.equal(withinDeadlineWindow("2026-08-05", 7, now), false);
assert.equal(withinDeadlineWindow("2026-12-01", "all", now), true);

assert.equal(slugify("Metalúrgica Sur"), "metalurgica-sur");

const csv = toCsv([{ a: 1, b: "x,y" }]);
assert.equal(csv, `a,b\n"1","x,y"`);

console.log("domain.selfcheck: OK");
