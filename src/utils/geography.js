/**
 * Geography utilities for internationalised resource filtering.
 * Provides country-to-region mapping, country names, and flag emojis.
 */

export const REGIONS = [
  "Europe",
  "Asia-Pacific",
  "North America",
  "Middle East & Africa",
  "Latin America",
  "International",
];

export const EVIDENCE_TYPES = [
  "policy",
  "case-study",
  "framework",
  "research",
  "guidance",
  "tool",
  "standard",
];

export const MATURITY_SIGNALS = [
  "emerging",
  "established",
  "proven-at-scale",
];

/**
 * Maps ISO 3166-1 alpha-2 country codes (and INTL) to region strings.
 * @type {Object.<string, string>}
 */
export const COUNTRY_REGION_MAP = {
  // Europe
  GB: "Europe",
  DE: "Europe",
  FR: "Europe",
  NL: "Europe",
  SE: "Europe",
  NO: "Europe",
  DK: "Europe",
  FI: "Europe",
  CH: "Europe",
  IE: "Europe",
  IT: "Europe",
  ES: "Europe",
  PT: "Europe",
  BE: "Europe",
  AT: "Europe",
  PL: "Europe",
  EU: "Europe",

  // Asia-Pacific
  AU: "Asia-Pacific",
  NZ: "Asia-Pacific",
  SG: "Asia-Pacific",
  JP: "Asia-Pacific",
  KR: "Asia-Pacific",
  CN: "Asia-Pacific",
  IN: "Asia-Pacific",
  HK: "Asia-Pacific",
  TW: "Asia-Pacific",
  MY: "Asia-Pacific",
  TH: "Asia-Pacific",
  ID: "Asia-Pacific",

  // North America
  US: "North America",
  CA: "North America",
  MX: "North America",

  // Latin America
  BR: "Latin America",
  CL: "Latin America",
  AR: "Latin America",
  CO: "Latin America",
  PE: "Latin America",

  // Middle East & Africa
  AE: "Middle East & Africa",
  SA: "Middle East & Africa",
  ZA: "Middle East & Africa",
  KE: "Middle East & Africa",
  NG: "Middle East & Africa",
  EG: "Middle East & Africa",
  QA: "Middle East & Africa",

  // International
  INTL: "International",
};

/**
 * Human-readable country names keyed by ISO alpha-2 code (or INTL).
 * @type {Object.<string, string>}
 */
const COUNTRY_NAMES = {
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  CH: "Switzerland",
  IE: "Ireland",
  IT: "Italy",
  ES: "Spain",
  PT: "Portugal",
  BE: "Belgium",
  AT: "Austria",
  PL: "Poland",
  EU: "European Union",
  AU: "Australia",
  NZ: "New Zealand",
  SG: "Singapore",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  HK: "Hong Kong",
  TW: "Taiwan",
  MY: "Malaysia",
  TH: "Thailand",
  ID: "Indonesia",
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  CL: "Chile",
  AR: "Argentina",
  CO: "Colombia",
  PE: "Peru",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  ZA: "South Africa",
  KE: "Kenya",
  NG: "Nigeria",
  EG: "Egypt",
  QA: "Qatar",
  INTL: "International",
};

/**
 * Returns the deduplicated list of regions for the given country codes.
 * Unknown codes are silently ignored.
 * @param {string[]} countryCodes - Array of ISO alpha-2 codes or 'INTL'.
 * @returns {string[]} Deduplicated array of region strings.
 */
export const getRegionsForCountries = (countryCodes) => {
  if (!Array.isArray(countryCodes) || countryCodes.length === 0) return [];
  const seen = new Set();
  const result = [];
  for (const code of countryCodes) {
    const region = COUNTRY_REGION_MAP[code];
    if (region && !seen.has(region)) {
      seen.add(region);
      result.push(region);
    }
  }
  return result;
};

/**
 * Returns the human-readable name for a country code.
 * Falls back to the raw code if not found.
 * @param {string} code - ISO alpha-2 code or 'INTL'.
 * @returns {string} Human-readable country name.
 */
export const getCountryName = (code) => COUNTRY_NAMES[code] || code;

/**
 * Returns the flag emoji for a country code.
 * INTL returns the globe emoji (🌐).
 * EU returns the EU flag (🇪🇺).
 * Unknown codes return an empty string.
 * @param {string} code - ISO alpha-2 code or 'INTL'.
 * @returns {string} Flag emoji or empty string.
 */
export const getCountryFlag = (code) => {
  if (!code) return "";
  if (code === "INTL") return "🌐";
  if (code === "EU") return "🇪🇺";

  // ISO alpha-2 -> regional indicator symbols (A=0x1F1E6)
  if (/^[A-Z]{2}$/.test(code)) {
    const offset = 0x1F1E6 - 65; // 'A'.charCodeAt(0) === 65
    return (
      String.fromCodePoint(code.charCodeAt(0) + offset) +
      String.fromCodePoint(code.charCodeAt(1) + offset)
    );
  }
  return "";
};
