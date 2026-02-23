import { describe, it, expect } from 'vitest';
import {
  COUNTRY_REGION_MAP,
  REGIONS,
  EVIDENCE_TYPES,
  MATURITY_SIGNALS,
  getRegionsForCountries,
  getCountryName,
  getCountryFlag,
} from '../../utils/geography';

describe('COUNTRY_REGION_MAP', () => {
  it('should map GB to Europe', () => {
    expect(COUNTRY_REGION_MAP.GB).toBe('Europe');
  });

  it('should map US to North America', () => {
    expect(COUNTRY_REGION_MAP.US).toBe('North America');
  });

  it('should map SG to Asia-Pacific', () => {
    expect(COUNTRY_REGION_MAP.SG).toBe('Asia-Pacific');
  });

  it('should map AU to Asia-Pacific', () => {
    expect(COUNTRY_REGION_MAP.AU).toBe('Asia-Pacific');
  });

  it('should map BR to Latin America', () => {
    expect(COUNTRY_REGION_MAP.BR).toBe('Latin America');
  });

  it('should map AE to Middle East & Africa', () => {
    expect(COUNTRY_REGION_MAP.AE).toBe('Middle East & Africa');
  });

  it('should map ZA to Middle East & Africa', () => {
    expect(COUNTRY_REGION_MAP.ZA).toBe('Middle East & Africa');
  });

  it('should map INTL to International', () => {
    expect(COUNTRY_REGION_MAP.INTL).toBe('International');
  });

  it('should map EU to Europe', () => {
    expect(COUNTRY_REGION_MAP.EU).toBe('Europe');
  });

  it('should include all specified minimum codes', () => {
    const required = ['GB', 'US', 'CA', 'AU', 'NZ', 'SG', 'JP', 'KR', 'CN', 'IN',
      'AE', 'SA', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH',
      'IE', 'BR', 'MX', 'CL', 'ZA', 'KE', 'NG'];
    for (const code of required) {
      expect(COUNTRY_REGION_MAP[code], `Missing mapping for ${code}`).toBeDefined();
    }
  });

  it('should only use values from REGIONS list', () => {
    for (const [code, region] of Object.entries(COUNTRY_REGION_MAP)) {
      expect(REGIONS, `${code} maps to unknown region "${region}"`).toContain(region);
    }
  });
});

describe('REGIONS', () => {
  it('should contain exactly the expected regions', () => {
    expect(REGIONS).toEqual([
      'Europe',
      'Asia-Pacific',
      'North America',
      'Middle East & Africa',
      'Latin America',
      'International',
    ]);
  });
});

describe('EVIDENCE_TYPES', () => {
  it('should contain the expected evidence types', () => {
    expect(EVIDENCE_TYPES).toContain('policy');
    expect(EVIDENCE_TYPES).toContain('case-study');
    expect(EVIDENCE_TYPES).toContain('framework');
    expect(EVIDENCE_TYPES).toContain('research');
    expect(EVIDENCE_TYPES).toContain('guidance');
    expect(EVIDENCE_TYPES).toContain('tool');
    expect(EVIDENCE_TYPES).toContain('standard');
  });
});

describe('MATURITY_SIGNALS', () => {
  it('should contain the expected maturity signals', () => {
    expect(MATURITY_SIGNALS).toContain('emerging');
    expect(MATURITY_SIGNALS).toContain('established');
    expect(MATURITY_SIGNALS).toContain('proven-at-scale');
  });
});

describe('getRegionsForCountries()', () => {
  it('should return the region for a single UK code', () => {
    expect(getRegionsForCountries(['GB'])).toEqual(['Europe']);
  });

  it('should return deduplicated regions for multiple European countries', () => {
    const result = getRegionsForCountries(['GB', 'DE', 'FR']);
    expect(result).toEqual(['Europe']);
  });

  it('should return multiple regions for a mixed set of countries', () => {
    const result = getRegionsForCountries(['GB', 'US', 'SG']);
    expect(result).toContain('Europe');
    expect(result).toContain('North America');
    expect(result).toContain('Asia-Pacific');
    expect(result).toHaveLength(3);
  });

  it('should return International for INTL code', () => {
    expect(getRegionsForCountries(['INTL'])).toEqual(['International']);
  });

  it('should silently ignore unknown country codes', () => {
    const result = getRegionsForCountries(['GB', 'XX']);
    expect(result).toEqual(['Europe']);
  });

  it('should return empty array for empty input', () => {
    expect(getRegionsForCountries([])).toEqual([]);
  });

  it('should return empty array for null input', () => {
    expect(getRegionsForCountries(null)).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(getRegionsForCountries(undefined)).toEqual([]);
  });

  it('should preserve insertion order (deduplicated)', () => {
    const result = getRegionsForCountries(['US', 'CA', 'GB']);
    expect(result).toEqual(['North America', 'Europe']);
  });
});

describe('getCountryName()', () => {
  it('should return United Kingdom for GB', () => {
    expect(getCountryName('GB')).toBe('United Kingdom');
  });

  it('should return United States for US', () => {
    expect(getCountryName('US')).toBe('United States');
  });

  it('should return Singapore for SG', () => {
    expect(getCountryName('SG')).toBe('Singapore');
  });

  it('should return International for INTL', () => {
    expect(getCountryName('INTL')).toBe('International');
  });

  it('should return European Union for EU', () => {
    expect(getCountryName('EU')).toBe('European Union');
  });

  it('should fall back to the raw code for unknown codes', () => {
    expect(getCountryName('XX')).toBe('XX');
  });
});

describe('getCountryFlag()', () => {
  it('should return globe emoji for INTL', () => {
    expect(getCountryFlag('INTL')).toBe('🌐');
  });

  it('should return EU flag for EU', () => {
    expect(getCountryFlag('EU')).toBe('🇪🇺');
  });

  it('should return GB flag emoji for GB', () => {
    expect(getCountryFlag('GB')).toBe('🇬🇧');
  });

  it('should return US flag emoji for US', () => {
    expect(getCountryFlag('US')).toBe('🇺🇸');
  });

  it('should return SG flag emoji for SG', () => {
    expect(getCountryFlag('SG')).toBe('🇸🇬');
  });

  it('should return AU flag emoji for AU', () => {
    expect(getCountryFlag('AU')).toBe('🇦🇺');
  });

  it('should return empty string for null input', () => {
    expect(getCountryFlag(null)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(getCountryFlag('')).toBe('');
  });

  it('should return empty string for invalid code', () => {
    expect(getCountryFlag('123')).toBe('');
  });

  it('should return a 2-character emoji string for valid alpha-2 codes', () => {
    const flag = getCountryFlag('GB');
    // Flag emoji is 2 regional indicator symbols, each is a surrogate pair (4 chars in JS string)
    expect([...flag]).toHaveLength(2);
  });
});
