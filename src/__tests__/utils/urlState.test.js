import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseURLParams, generateURLParams, updateBrowserURL } from '../../utils/urlState';

describe('parseURLParams()', () => {
  describe('valid parameters', () => {
    it('should parse all parameters correctly', () => {
      const result = parseURLParams('?q=data&theme=leadership&barrier=barrier1&personas=Project,Programme');
      expect(result.search).toBe('data');
      expect(result.theme).toBe('leadership');
      expect(result.barrier).toBe('barrier1');
      expect(result.personas).toEqual(['Project', 'Programme']);
    });

    it('should parse search query parameter', () => {
      const result = parseURLParams('?q=test+query');
      expect(result.search).toBe('test query');
    });

    it('should parse theme parameter', () => {
      const result = parseURLParams('?theme=leadership-and-alignment');
      expect(result.theme).toBe('leadership-and-alignment');
    });

    it('should parse barrier parameter', () => {
      const result = parseURLParams('?barrier=barrier-id-123');
      expect(result.barrier).toBe('barrier-id-123');
    });

    it('should parse multiple personas', () => {
      const result = parseURLParams('?personas=Project,Programme,Business');
      expect(result.personas).toEqual(['Project', 'Programme', 'Business']);
    });

    it('should parse single persona', () => {
      const result = parseURLParams('?personas=Project');
      expect(result.personas).toEqual(['Project']);
    });
  });

  describe('missing parameters', () => {
    it('should return defaults when no parameters provided', () => {
      const result = parseURLParams('');
      expect(result.search).toBe('');
      expect(result.theme).toBeNull();
      expect(result.barrier).toBeNull();
      expect(result.personas).toEqual([]);
      expect(result.regions).toEqual([]);
      expect(result.countries).toEqual([]);
      expect(result.evidenceTypes).toEqual([]);
    });

    it('should return defaults for missing theme', () => {
      const result = parseURLParams('?q=test');
      expect(result.theme).toBeNull();
    });

    it('should return defaults for missing barrier', () => {
      const result = parseURLParams('?q=test');
      expect(result.barrier).toBeNull();
    });

    it('should return empty array for missing personas', () => {
      const result = parseURLParams('?q=test');
      expect(result.personas).toEqual([]);
    });

    it('should trim whitespace from search query', () => {
      const result = parseURLParams('?q=  test  ');
      expect(result.search).toBe('test');
    });
  });

  describe('empty URL', () => {
    it('should handle empty search string', () => {
      const result = parseURLParams('');
      expect(result.search).toBe('');
      expect(result.theme).toBeNull();
      expect(result.barrier).toBeNull();
      expect(result.personas).toEqual([]);
    });

    it('should handle just question mark', () => {
      const result = parseURLParams('?');
      expect(result.search).toBe('');
      expect(result.theme).toBeNull();
      expect(result.barrier).toBeNull();
      expect(result.personas).toEqual([]);
      expect(result.regions).toEqual([]);
      expect(result.countries).toEqual([]);
      expect(result.evidenceTypes).toEqual([]);
    });
  });

  describe('malformed parameters', () => {
    it('should handle empty persona parameter', () => {
      const result = parseURLParams('?personas=');
      expect(result.personas).toEqual([]);
    });

    it('should filter out empty personas from comma-separated list', () => {
      const result = parseURLParams('?personas=Project,,Programme');
      expect(result.personas).toEqual(['Project', 'Programme']);
    });

    it('should handle special characters in search query', () => {
      const result = parseURLParams('?q=test%20%26%20search');
      expect(result.search).toBe('test & search');
    });
  });

  describe('default parameter (window.location.search)', () => {
    beforeEach(() => {
      // Mock window.location.search
      delete window.location;
      window.location = { search: '?q=default&theme=test' };
    });

    it('should use window.location.search when no parameter provided', () => {
      const result = parseURLParams();
      expect(result.search).toBe('default');
      expect(result.theme).toBe('test');
    });
  });
});

describe('generateURLParams()', () => {
  describe('valid state objects', () => {
    it('should generate query string with all parameters', () => {
      const state = {
        search: 'data',
        theme: 'leadership',
        barrier: 'barrier1',
        personas: ['Project', 'Programme']
      };
      const result = generateURLParams(state);
      expect(result).toBe('?q=data&theme=leadership&barrier=barrier1&personas=Project%2CProgramme');
    });

    it('should generate query string with only search', () => {
      const state = {
        search: 'test query',
        theme: null,
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).toBe('?q=test+query');
    });

    it('should generate query string with only theme', () => {
      const state = {
        search: '',
        theme: 'leadership',
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).toBe('?theme=leadership');
    });

    it('should properly encode special characters', () => {
      const state = {
        search: 'test & search',
        theme: null,
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).toContain('test+%26+search');
    });
  });

  describe('empty or null values', () => {
    it('should return empty string when no values provided', () => {
      const state = {
        search: '',
        theme: null,
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).toBe('');
    });

    it('should exclude null theme', () => {
      const state = {
        search: 'test',
        theme: null,
        barrier: 'barrier1',
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).not.toContain('theme');
      expect(result).toContain('q=test');
    });

    it('should exclude empty personas array', () => {
      const state = {
        search: 'test',
        theme: 'leadership',
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).not.toContain('personas');
    });

    it('should exclude empty search string', () => {
      const state = {
        search: '',
        theme: 'leadership',
        barrier: null,
        personas: []
      };
      const result = generateURLParams(state);
      expect(result).not.toContain('q=');
    });
  });

  describe('personas parameter', () => {
    it('should join multiple personas with comma', () => {
      const state = {
        search: '',
        theme: null,
        barrier: null,
        personas: ['Project', 'Programme', 'Business']
      };
      const result = generateURLParams(state);
      expect(result).toBe('?personas=Project%2CProgramme%2CBusiness');
    });

    it('should handle single persona', () => {
      const state = {
        search: '',
        theme: null,
        barrier: null,
        personas: ['Project']
      };
      const result = generateURLParams(state);
      expect(result).toBe('?personas=Project');
    });
  });
});

describe('roundtrip testing', () => {
  it('should parse and generate the same state', () => {
    const originalParams = '?q=data&theme=leadership&barrier=barrier1&personas=Project,Programme';
    const parsed = parseURLParams(originalParams);
    const generated = generateURLParams(parsed);
    const reparsed = parseURLParams(generated);

    expect(reparsed).toEqual(parsed);
  });

  it('should handle empty state roundtrip', () => {
    const originalParams = '';
    const parsed = parseURLParams(originalParams);
    const generated = generateURLParams(parsed);

    expect(generated).toBe('');
  });

  it('should handle partial state roundtrip', () => {
    const originalParams = '?theme=leadership&personas=Project';
    const parsed = parseURLParams(originalParams);
    const generated = generateURLParams(parsed);
    const reparsed = parseURLParams(generated);

    expect(reparsed.theme).toBe('leadership');
    expect(reparsed.personas).toEqual(['Project']);
    expect(reparsed.search).toBe('');
    expect(reparsed.barrier).toBeNull();
  });
});

describe('updateBrowserURL()', () => {
  beforeEach(() => {
    // Mock window.history.replaceState
    window.history.replaceState = vi.fn();
    // Mock window.location.pathname
    delete window.location;
    window.location = { pathname: '/toolkit', search: '' };
  });

  it('should update browser URL with state', () => {
    const state = {
      search: 'test',
      theme: 'leadership',
      barrier: null,
      personas: []
    };

    updateBrowserURL(state);

    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/toolkit?q=test&theme=leadership'
    );
  });

  it('should use custom pathname if provided', () => {
    const state = {
      search: 'test',
      theme: null,
      barrier: null,
      personas: []
    };

    updateBrowserURL(state, '/custom-path');

    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/custom-path?q=test'
    );
  });

  it('should handle empty state', () => {
    const state = {
      search: '',
      theme: null,
      barrier: null,
      personas: []
    };

    updateBrowserURL(state);

    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/toolkit'
    );
  });
});

describe('internationalisation URL parameters', () => {
  describe('parseURLParams() - new fields', () => {
    it('should parse region parameter as array', () => {
      const result = parseURLParams('?region=Europe');
      expect(result.regions).toEqual(['Europe']);
    });

    it('should parse multiple regions', () => {
      const result = parseURLParams('?region=Europe,Asia-Pacific');
      expect(result.regions).toEqual(['Europe', 'Asia-Pacific']);
    });

    it('should return empty array for missing region', () => {
      const result = parseURLParams('?q=test');
      expect(result.regions).toEqual([]);
    });

    it('should parse country parameter as array', () => {
      const result = parseURLParams('?country=GB');
      expect(result.countries).toEqual(['GB']);
    });

    it('should parse multiple countries', () => {
      const result = parseURLParams('?country=GB,US,SG');
      expect(result.countries).toEqual(['GB', 'US', 'SG']);
    });

    it('should return empty array for missing country', () => {
      const result = parseURLParams('');
      expect(result.countries).toEqual([]);
    });

    it('should parse evidence_type parameter as array', () => {
      const result = parseURLParams('?evidence_type=case-study');
      expect(result.evidenceTypes).toEqual(['case-study']);
    });

    it('should parse multiple evidence types', () => {
      const result = parseURLParams('?evidence_type=case-study,research');
      expect(result.evidenceTypes).toEqual(['case-study', 'research']);
    });

    it('should return empty array for missing evidence_type', () => {
      const result = parseURLParams('');
      expect(result.evidenceTypes).toEqual([]);
    });

    it('should parse all new params together', () => {
      const result = parseURLParams('?region=Europe&country=GB&evidence_type=research');
      expect(result.regions).toEqual(['Europe']);
      expect(result.countries).toEqual(['GB']);
      expect(result.evidenceTypes).toEqual(['research']);
    });
  });

  describe('generateURLParams() - new fields', () => {
    it('should include region in output', () => {
      const state = { search: '', theme: null, barrier: null, personas: [],
        regions: ['Europe'], countries: [], evidenceTypes: [] };
      const result = generateURLParams(state);
      expect(result).toContain('region=Europe');
    });

    it('should join multiple regions with comma', () => {
      const state = { search: '', theme: null, barrier: null, personas: [],
        regions: ['Europe', 'Asia-Pacific'], countries: [], evidenceTypes: [] };
      const result = generateURLParams(state);
      expect(result).toContain('region=Europe%2CAsia-Pacific');
    });

    it('should omit region when empty', () => {
      const state = { search: '', theme: null, barrier: null, personas: [],
        regions: [], countries: [], evidenceTypes: [] };
      const result = generateURLParams(state);
      expect(result).not.toContain('region');
    });

    it('should include country in output', () => {
      const state = { search: '', theme: null, barrier: null, personas: [],
        regions: [], countries: ['GB'], evidenceTypes: [] };
      const result = generateURLParams(state);
      expect(result).toContain('country=GB');
    });

    it('should include evidence_type in output', () => {
      const state = { search: '', theme: null, barrier: null, personas: [],
        regions: [], countries: [], evidenceTypes: ['case-study'] };
      const result = generateURLParams(state);
      expect(result).toContain('evidence_type=case-study');
    });

    it('should omit evidence_type when empty', () => {
      const state = { search: 'test', theme: null, barrier: null, personas: [],
        regions: [], countries: [], evidenceTypes: [] };
      const result = generateURLParams(state);
      expect(result).not.toContain('evidence_type');
    });
  });

  describe('roundtrip - new fields', () => {
    it('should roundtrip region, country, and evidence_type', () => {
      const original = '?region=Europe,Asia-Pacific&country=GB,SG&evidence_type=case-study,research';
      const parsed = parseURLParams(original);
      const generated = generateURLParams(parsed);
      const reparsed = parseURLParams(generated);

      expect(reparsed.regions).toEqual(['Europe', 'Asia-Pacific']);
      expect(reparsed.countries).toEqual(['GB', 'SG']);
      expect(reparsed.evidenceTypes).toEqual(['case-study', 'research']);
    });
  });
});
