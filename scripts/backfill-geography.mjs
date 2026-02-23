// scripts/backfill-geography.mjs
// One-time migration script: back-populate country, region, language, evidence_type
// on existing resources.json entries based on publisher name heuristics.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getRegionsForCountries } from '../src/utils/geography.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCES_PATH = path.join(__dirname, '../src/data/resources.json');

// ---------------------------------------------------------------------------
// Publisher -> country mapping
// Keys are substrings of the publisher field (case-insensitive match).
// First match wins; list in descending specificity.
// ---------------------------------------------------------------------------
const PUBLISHER_COUNTRY_MAP = [
  // UK government bodies and public sector
  { match: "cabinet office",        country: ["GB"] },
  { match: "hm treasury",           country: ["GB"] },
  { match: "cddo",                   country: ["GB"] },
  { match: "gds",                    country: ["GB"] },
  { match: "gds / cddo",            country: ["GB"] },
  { match: "dsit",                   country: ["GB"] },
  { match: "ai safety institute",    country: ["GB"] },
  { match: "uk government",         country: ["GB"] },
  { match: "ipa",                    country: ["GB"] },
  { match: "citb",                   country: ["GB"] },
  { match: "rics",                   country: ["GB"] },
  { match: "institution of civil engineers", country: ["GB"] },
  { match: "ice",                    country: ["GB"] },
  { match: "association for project management", country: ["GB"] },
  { match: "apm",                    country: ["GB"] },
  { match: "chartered institute of building", country: ["GB"] },
  { match: "ciob",                   country: ["GB"] },
  { match: "civil engineering contractors", country: ["GB"] },
  { match: "geospatial commission",  country: ["GB"] },
  { match: "connected places catapult", country: ["GB"] },
  { match: "national grid",          country: ["GB"] },
  { match: "mace group",             country: ["GB"] },
  { match: "gleeds",                 country: ["GB"] },
  { match: "nec",                    country: ["GB"] },
  { match: "behavioural insights team", country: ["GB"] },
  { match: "iuk-business-connect",   country: ["GB"] },
  { match: "majorprojects.org",      country: ["GB"] },
  { match: "cbgmanagementcoaching",  country: ["GB"] },
  { match: "eprints.soton.ac.uk",    country: ["GB"] },
  { match: "fidic",                  country: ["INTL"] }, // FIDIC is international; partner with EY

  // US institutions
  { match: "openai",                 country: ["US"] },
  { match: "mit sloan",              country: ["US"] },
  { match: "national bureau of economic research", country: ["US"] },
  { match: "nber",                   country: ["US"] },
  { match: "stanford university",    country: ["US"] },
  { match: "harvard business review", country: ["US"] },
  { match: "booz allen hamilton",    country: ["US"] },
  { match: "gartner",                country: ["US"] },
  { match: "forrester",              country: ["US"] },
  { match: "ibm",                    country: ["US"] },
  { match: "amazon web services",    country: ["US"] },
  { match: "google cloud",           country: ["US"] },
  { match: "scaled agile",           country: ["US"] },
  { match: "o'reilly media",         country: ["US"] },
  { match: "oreilly",                country: ["US"] },
  { match: "project management institute", country: ["US"] },
  { match: "rsm us",                 country: ["US"] },
  { match: "arxiv.org",              country: ["US"] },
  { match: "thoughtworks",           country: ["US"] },
  { match: "agency4d",               country: ["US"] },
  { match: "aoresearch.com",         country: ["US"] },

  // EU bodies
  { match: "european commission",    country: ["EU"] },
  { match: "eu ai office",           country: ["EU"] },
  { match: "interoperable-europe",   country: ["EU"] },
  { match: "buildings performance institute europe", country: ["EU"] },

  // International organisations and global consultancies
  { match: "oecd",                   country: ["INTL"] },
  { match: "world bank",             country: ["INTL"] },
  { match: "world economic forum",   country: ["INTL"] },
  { match: "wef",                    country: ["INTL"] },
  { match: "broadband commission",   country: ["INTL"] },
  { match: "iso",                    country: ["INTL"] },
  { match: "ieee",                   country: ["INTL"] },
  { match: "buildingsmart",          country: ["INTL"] },
  { match: "buildsmart",             country: ["INTL"] },
  { match: "un ",                    country: ["INTL"] },
  { match: "united nations",         country: ["INTL"] },
  { match: "ey",                     country: ["INTL"] },
  { match: "pwc",                    country: ["INTL"] },
  { match: "mckinsey",               country: ["INTL"] },
  { match: "deloitte",               country: ["INTL"] },
  { match: "bcg",                    country: ["INTL"] },
  { match: "accenture",              country: ["INTL"] },
  { match: "celonis",                country: ["INTL"] },
  { match: "cb insights",            country: ["INTL"] },
  { match: "cbi",                    country: ["INTL"] },
  { match: "ifs",                    country: ["INTL"] },
  { match: "linkedin",               country: ["INTL"] },
  { match: "researchgate",           country: ["INTL"] },
];

/**
 * Infer country codes from a publisher name using substring matching.
 * @param {string} publisher
 * @returns {string[]}
 */
const inferCountry = (publisher) => {
  if (!publisher) return ["GB"];
  const lower = publisher.toLowerCase();
  for (const { match, country } of PUBLISHER_COUNTRY_MAP) {
    if (lower.includes(match)) return country;
  }
  // Default: UK (most existing resources are UK-sourced)
  return ["GB"];
};

// ---------------------------------------------------------------------------
// Type -> evidence_type mapping
// ---------------------------------------------------------------------------
const TYPE_TO_EVIDENCE_TYPE = {
  "report":     "research",
  "guidance":   "guidance",
  "article":    "research",
  "playbook":   "framework",
  "book":       "research",
  "case-study": "case-study",
  "doc":        "guidance",
};

const mapEvidenceType = (type) => TYPE_TO_EVIDENCE_TYPE[type] || type || "";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const raw = fs.readFileSync(RESOURCES_PATH, "utf8");
const resources = JSON.parse(raw);

let updated = 0;

const enriched = resources.map((r) => {
  // Skip if already populated (future-safe for re-runs)
  const country = (r.country && r.country.length) ? r.country : inferCountry(r.publisher);
  const region = (r.region && r.region.length) ? r.region : getRegionsForCountries(country);
  const language = r.language || "en";
  const evidence_type = r.evidence_type || mapEvidenceType(r.type);
  const maturity_signal = r.maturity_signal || "";

  const changed =
    JSON.stringify(r.country) !== JSON.stringify(country) ||
    JSON.stringify(r.region) !== JSON.stringify(region) ||
    r.language !== language ||
    r.evidence_type !== evidence_type;

  if (changed) updated++;

  return { ...r, country, region, language, evidence_type, maturity_signal };
});

fs.writeFileSync(RESOURCES_PATH, JSON.stringify(enriched, null, 2));
console.log(`✅ Backfill complete. ${updated} resources updated. Total: ${enriched.length}`);

// Summary stats
const byCountry = {};
const byRegion = {};
const byEvidenceType = {};
enriched.forEach(r => {
  r.country.forEach(c => { byCountry[c] = (byCountry[c] || 0) + 1; });
  r.region.forEach(reg => { byRegion[reg] = (byRegion[reg] || 0) + 1; });
  if (r.evidence_type) byEvidenceType[r.evidence_type] = (byEvidenceType[r.evidence_type] || 0) + 1;
});

console.log('\nCountry distribution:');
Object.entries(byCountry).sort((a,b) => b[1]-a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

console.log('\nRegion distribution:');
Object.entries(byRegion).sort((a,b) => b[1]-a[1]).forEach(([r, n]) => console.log(`  ${r}: ${n}`));

console.log('\nEvidence type distribution:');
Object.entries(byEvidenceType).sort((a,b) => b[1]-a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`));
