#!/usr/bin/env node
/**
 * Security gate for CI: `npm audit --omit=dev` plus an explicit allowlist.
 *
 * npm has no way to ignore a single advisory, so a transitive vulnerability
 * with no published fix leaves only two options: downgrade the dependency that
 * pulls it in, or turn the audit off entirely. Neither is acceptable here, so
 * this script fails on every production advisory except the ones listed in
 * ALLOWLIST below, each of which must carry a reason and an expiry date.
 *
 * Every allowlist entry is a decision to revisit, not a permanent exemption:
 * an expired entry fails the build so the assessment gets redone.
 */

import { execFileSync } from "node:child_process";

/**
 * @typedef {object} AllowlistEntry
 * @property {string} id GHSA identifier, as it appears in the advisory URL.
 * @property {string} package Vulnerable package the advisory applies to.
 * @property {string} reason Why this is not exploitable in this project.
 * @property {string} expires ISO date (YYYY-MM-DD) to re-evaluate by.
 */

/** @type {AllowlistEntry[]} */
const ALLOWLIST = [
	{
		id: "GHSA-w3rx-r6r6-pgpr",
		package: "image-size",
		reason:
			"image-size <=2.0.2 has no patched release. It reaches us via " +
			"@astrojs/netlify > @netlify/blobs > @netlify/dev-utils, where the only " +
			"import sits in the package's test helpers (getImageResponseSize). " +
			"@netlify/blobs imports HTTPServer from that module and never calls the " +
			"parser, so no attacker-supplied image is ever decoded at build or " +
			"request time.",
		expires: "2026-11-30",
	},
	{
		id: "GHSA-5p2g-fcmc-qvqq",
		package: "image-size",
		reason: "Same package and code path as GHSA-w3rx-r6r6-pgpr.",
		expires: "2026-11-30",
	},
];

/**
 * Runs `npm audit` and returns the parsed report.
 *
 * npm exits non-zero whenever it finds anything, so a non-zero status is not
 * itself an error — but a report that npm never produced must never be read as
 * "nothing found", or a broken audit would silently pass the gate.
 *
 * @returns {object} Parsed `npm audit --json` output.
 */
function runAudit() {
	let stdout;
	let stderr = "";

	try {
		stdout = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
		});
	} catch (error) {
		stdout = error.stdout ?? "";
		stderr = error.stderr ?? "";
	}

	let report;
	try {
		report = JSON.parse(stdout);
	} catch {
		report = null;
	}

	if (!report?.metadata) {
		// In JSON mode npm reports its own failures as `{ error: { ... } }` on
		// stdout, which is more reliable than scraping stderr.
		const detail = report?.error?.summary ?? stderr.trim();
		console.error("error: `npm audit --omit=dev --json` produced no report.");
		if (detail) console.error(`\n${detail}`);
		process.exit(1);
	}

	return report;
}

/**
 * Flattens the audit report into one entry per advisory.
 *
 * @param {object} report Parsed `npm audit --json` output.
 * @returns {Map<string, object>} Advisories keyed by GHSA id.
 */
function collectAdvisories(report) {
	const advisories = new Map();

	for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
		for (const via of vulnerability.via ?? []) {
			// Strings point at another vulnerable package in the same chain; only
			// objects carry the advisory itself.
			if (typeof via !== "object") continue;

			const id = via.url?.split("/").pop();
			if (!id) continue;

			advisories.set(id, {
				id,
				package: via.name,
				severity: via.severity,
				title: via.title,
				url: via.url,
			});
		}
	}

	return advisories;
}

const report = runAudit();
const advisories = collectAdvisories(report);
const today = new Date().toISOString().slice(0, 10);

const allowed = new Map(ALLOWLIST.map((entry) => [entry.id, entry]));
const expired = ALLOWLIST.filter((entry) => entry.expires < today);
const stale = ALLOWLIST.filter((entry) => !advisories.has(entry.id));

const blocking = [...advisories.values()].filter((advisory) => {
	const entry = allowed.get(advisory.id);
	return !entry || entry.expires < today;
});

for (const entry of stale) {
	console.log(
		`note: allowlisted advisory ${entry.id} (${entry.package}) no longer ` +
			`appears in the audit — remove it from scripts/audit-ci.js.`,
	);
}

for (const entry of expired) {
	console.error(
		`error: allowlist entry ${entry.id} (${entry.package}) expired on ` +
			`${entry.expires} — re-assess it or extend the date.`,
	);
}

if (blocking.length > 0) {
	console.error(`\n${blocking.length} production advisory(ies) not allowed:\n`);
	for (const advisory of blocking) {
		console.error(
			`  [${advisory.severity}] ${advisory.package}: ${advisory.title}`,
		);
		console.error(`    ${advisory.url}\n`);
	}
	console.error("Run `npm audit --omit=dev` for the full dependency paths.");
	process.exit(1);
}

const allowedCount = advisories.size;
console.log(
	allowedCount === 0
		? "No production vulnerabilities."
		: `No unexpected production vulnerabilities (${allowedCount} allowlisted).`,
);
