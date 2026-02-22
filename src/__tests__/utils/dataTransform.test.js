import { describe, it, expect } from 'vitest';
import { toArray, normalizeResource, filterResources } from '../../utils/dataTransform';

describe('toArray()', () => {
  describe('pipe-delimited string input', () => {
    it('should split pipe-delimited string into array', () => {
      const result = toArray('persona1|persona2|persona3');
      expect(result).toEqual(['persona1', 'persona2', 'persona3']);
    });

    it('should trim whitespace from each item', () => {
      const result = toArray('  item1  |  item2  |  item3  ');
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should filter out empty strings', () => {
      const result = toArray('item1||item2|||item3');
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle single item without pipes', () => {
      const result = toArray('singleItem');
      expect(result).toEqual(['singleItem']);
    });

    it('should handle empty string and return empty array', () => {
      const result = toArray('');
      expect(result).toEqual([]);
    });

    it('should handle string with only pipes', () => {
      const result = toArray('|||');
      expect(result).toEqual([]);
    });

    it('should handle string with only whitespace', () => {
      const result = toArray('   ');
      expect(result).toEqual([]);
    });
  });

  describe('array input', () => {
    it('should return the same array if already an array', () => {
      const input = ['item1', 'item2', 'item3'];
      const result = toArray(input);
      expect(result).toBe(input);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle empty array', () => {
      const result = toArray([]);
      expect(result).toEqual([]);
    });
  });

  describe('invalid input types', () => {
    it('should return empty array for null', () => {
      const result = toArray(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      const result = toArray(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for number', () => {
      const result = toArray(123);
      expect(result).toEqual([]);
    });

    it('should return empty array for object', () => {
      const result = toArray({ key: 'value' });
      expect(result).toEqual([]);
    });
  });
});

describe('normalizeResource()', () => {
  describe('complete resource objects', () => {
    it('should normalize a complete resource with all fields', () => {
      const input = {
        id: '1',
        title: 'Test Resource',
        personas: 'Project|Programme',
        barriers: 'barrier1|barrier2',
        tags: 'tag1|tag2',
        barrier_category: 'leadership-and-alignment',
        country: 'GB',
        region: 'Europe',
        language: 'en',
        evidence_type: 'research',
        maturity_signal: 'established',
      };
      const result = normalizeResource(input);
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Resource');
      expect(result.personas).toEqual(['Project', 'Programme']);
      expect(result.barriers).toEqual(['barrier1', 'barrier2']);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.barrier_category).toBe('leadership-and-alignment');
      expect(result.country).toEqual(['GB']);
      expect(result.region).toEqual(['Europe']);
      expect(result.language).toBe('en');
      expect(result.evidence_type).toBe('research');
      expect(result.maturity_signal).toBe('established');
    });

    it('should preserve other fields not explicitly normalized', () => {
      const input = {
        id: '1',
        title: 'Test',
        url: 'https://example.com',
        date: '2024-01-01',
        description: 'A test resource',
        personas: 'Project',
        barriers: 'barrier1',
        tags: 'tag1',
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.url).toBe('https://example.com');
      expect(result.date).toBe('2024-01-01');
      expect(result.description).toBe('A test resource');
    });
  });

  describe('missing fields', () => {
    it('should handle missing personas field', () => {
      const input = {
        id: '1',
        title: 'Test',
        barriers: 'barrier1',
        tags: 'tag1',
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.personas).toEqual([]);
    });

    it('should handle missing barriers field', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: 'Project',
        tags: 'tag1',
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.barriers).toEqual([]);
    });

    it('should handle missing tags field', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: 'Project',
        barriers: 'barrier1',
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.tags).toEqual([]);
    });

    it('should use barrier_theme as fallback for barrier_category', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: 'Project',
        barriers: 'barrier1',
        tags: 'tag1',
        barrier_theme: 'theme-from-alt-field'
      };
      const result = normalizeResource(input);
      expect(result.barrier_category).toBe('theme-from-alt-field');
    });

    it('should prefer barrier_category over barrier_theme', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: 'Project',
        barriers: 'barrier1',
        tags: 'tag1',
        barrier_category: 'primary-theme',
        barrier_theme: 'alt-theme'
      };
      const result = normalizeResource(input);
      expect(result.barrier_category).toBe('primary-theme');
    });

    it('should default barrier_category to empty string if both missing', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: 'Project',
        barriers: 'barrier1',
        tags: 'tag1'
      };
      const result = normalizeResource(input);
      expect(result.barrier_category).toBe('');
    });
  });

  describe('already-array fields', () => {
    it('should handle personas already as array', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: ['Project', 'Programme'],
        barriers: 'barrier1',
        tags: 'tag1',
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.personas).toEqual(['Project', 'Programme']);
    });

    it('should handle all fields already as arrays', () => {
      const input = {
        id: '1',
        title: 'Test',
        personas: ['Project'],
        barriers: ['barrier1', 'barrier2'],
        tags: ['tag1', 'tag2', 'tag3'],
        barrier_category: 'theme1'
      };
      const result = normalizeResource(input);
      expect(result.personas).toEqual(['Project']);
      expect(result.barriers).toEqual(['barrier1', 'barrier2']);
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('internationalisation fields', () => {
    it('should default country to ["GB"] when missing', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '' };
      const result = normalizeResource(input);
      expect(result.country).toEqual(['GB']);
    });

    it('should default country to ["GB"] when empty string', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', country: '' };
      const result = normalizeResource(input);
      expect(result.country).toEqual(['GB']);
    });

    it('should parse pipe-delimited country string', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', country: 'US|CA' };
      const result = normalizeResource(input);
      expect(result.country).toEqual(['US', 'CA']);
    });

    it('should accept country already as array', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', country: ['SG', 'AU'] };
      const result = normalizeResource(input);
      expect(result.country).toEqual(['SG', 'AU']);
    });

    it('should parse pipe-delimited region string', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', region: 'Europe|Asia-Pacific' };
      const result = normalizeResource(input);
      expect(result.region).toEqual(['Europe', 'Asia-Pacific']);
    });

    it('should default region to empty array when missing', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '' };
      const result = normalizeResource(input);
      expect(result.region).toEqual([]);
    });

    it('should default language to "en" when missing', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '' };
      const result = normalizeResource(input);
      expect(result.language).toBe('en');
    });

    it('should preserve explicit language value', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', language: 'fr' };
      const result = normalizeResource(input);
      expect(result.language).toBe('fr');
    });

    it('should default evidence_type to empty string when missing', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '' };
      const result = normalizeResource(input);
      expect(result.evidence_type).toBe('');
    });

    it('should preserve explicit evidence_type value', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', evidence_type: 'case-study' };
      const result = normalizeResource(input);
      expect(result.evidence_type).toBe('case-study');
    });

    it('should default maturity_signal to empty string when missing', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '' };
      const result = normalizeResource(input);
      expect(result.maturity_signal).toBe('');
    });

    it('should preserve explicit maturity_signal value', () => {
      const input = { id: '1', title: 'Test', personas: '', barriers: '', tags: '', maturity_signal: 'proven-at-scale' };
      const result = normalizeResource(input);
      expect(result.maturity_signal).toBe('proven-at-scale');
    });
  });
});

describe('filterResources()', () => {
  const sampleResources = [
    {
      id: '1',
      title: 'Data Strategy Guide',
      description: 'A comprehensive guide to data strategy',
      tags: ['strategy', 'planning'],
      personas: ['Project', 'Programme'],
      barriers: ['barrier1']
    },
    {
      id: '2',
      title: 'Technical Implementation',
      description: 'Best practices for technical implementation',
      tags: ['technical', 'implementation'],
      personas: ['Project'],
      barriers: ['barrier2']
    },
    {
      id: '3',
      title: 'Business Case Development',
      description: 'How to develop a strong business case',
      tags: ['business', 'planning'],
      personas: ['Business'],
      barriers: ['barrier3']
    }
  ];

  describe('text search filtering', () => {
    it('should filter by title match', () => {
      const result = filterResources(sampleResources, 'strategy');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by description match', () => {
      const result = filterResources(sampleResources, 'technical implementation');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by tag match', () => {
      const result = filterResources(sampleResources, 'planning');
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['1', '3']);
    });

    it('should be case-insensitive', () => {
      const result = filterResources(sampleResources, 'DATA');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should trim search query', () => {
      const result = filterResources(sampleResources, '  strategy  ');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return all resources for empty search', () => {
      const result = filterResources(sampleResources, '');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for no matches', () => {
      const result = filterResources(sampleResources, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('persona filtering', () => {
    it('should filter by single persona', () => {
      const result = filterResources(sampleResources, '', ['Project']);
      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['1', '2']);
    });

    it('should filter by multiple personas (OR logic)', () => {
      const result = filterResources(sampleResources, '', ['Project', 'Business']);
      expect(result).toHaveLength(3);
    });

    it('should return all resources when no personas selected', () => {
      const result = filterResources(sampleResources, '', []);
      expect(result).toHaveLength(3);
    });
  });

  describe('combined filtering', () => {
    it('should filter by both search and persona', () => {
      const result = filterResources(sampleResources, 'planning', ['Project']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should require both conditions to match', () => {
      const result = filterResources(sampleResources, 'business', ['Project']);
      expect(result).toHaveLength(0);
    });
  });

  describe('default parameters', () => {
    it('should work with only resources parameter', () => {
      const result = filterResources(sampleResources);
      expect(result).toHaveLength(3);
    });

    it('should work with only resources and search', () => {
      const result = filterResources(sampleResources, 'strategy');
      expect(result).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty resources array', () => {
      const result = filterResources([], 'search');
      expect(result).toHaveLength(0);
    });

    it('should handle resources with missing tags', () => {
      const resources = [{ id: '1', title: 'Test', description: 'Desc', personas: ['Project'] }];
      const result = filterResources(resources, 'test');
      expect(result).toHaveLength(1);
    });

    it('should handle resources with empty personas', () => {
      const resources = [{ id: '1', title: 'Test', description: 'Desc', personas: [], tags: [] }];
      const result = filterResources(resources, '', ['Project']);
      expect(result).toHaveLength(0);
    });
  });
});
