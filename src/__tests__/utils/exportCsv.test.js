import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportResourcesCsv, buildExportFilename } from '../../utils/exportCsv';

// Helper to capture the CSV string passed to Blob
const captureLastCsv = () => {
  const calls = global.Blob.mock?.calls;
  if (!calls || calls.length === 0) return null;
  const lastCall = calls[calls.length - 1];
  return lastCall[0][0]; // first arg is array of parts; first part is the csv string
};

describe('exportResourcesCsv', () => {
  let createObjectURLMock;
  let revokeObjectURLMock;
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;
  let BlobSpy;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => 'blob:mock-url');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    clickSpy = vi.fn();
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    // Mock createElement to capture link behaviour
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    BlobSpy = vi.spyOn(global, 'Blob');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates header row + one data row per resource', () => {
    const resources = [
      { id: '1', title: 'Resource A', url: 'https://a.com', publisher: 'Pub A', description: 'Desc A', barrier_category: 'theme-a', barriers: ['b1'], personas: ['Project'], country: ['GB'], evidence_type: 'guidance', date: '2024-01-01' },
      { id: '2', title: 'Resource B', url: 'https://b.com', publisher: 'Pub B', description: 'Desc B', barrier_category: 'theme-b', barriers: ['b2'], personas: ['Business'], country: ['US'], evidence_type: 'framework', date: '2024-02-01' },
    ];

    exportResourcesCsv(resources, 'test-export');

    const csv = captureLastCsv();
    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[0]).toBe('Title,URL,Publisher,Description,Barrier Theme,Barriers,Personas,Country,Evidence Type,Date');
  });

  it('joins array fields with pipe delimiter', () => {
    const resources = [
      { title: 'R', url: '', publisher: '', description: '', barrier_category: '', barriers: ['b1', 'b2', 'b3'], personas: ['Project', 'Programme'], country: ['GB', 'US'], evidence_type: '', date: '' },
    ];

    exportResourcesCsv(resources, 'test');

    const csv = captureLastCsv();
    const dataLine = csv.replace(/^\uFEFF/, '').split('\r\n')[1];
    expect(dataLine).toContain('b1|b2|b3');
    expect(dataLine).toContain('Project|Programme');
    expect(dataLine).toContain('GB|US');
  });

  it('escapes double quotes in description and wraps cell in quotes', () => {
    const resources = [
      { title: 'Test', url: '', publisher: '', description: 'He said "hello", she replied', barrier_category: '', barriers: [], personas: [], country: [], evidence_type: '', date: '' },
    ];

    exportResourcesCsv(resources, 'test');

    const csv = captureLastCsv();
    const dataLine = csv.replace(/^\uFEFF/, '').split('\r\n')[1];
    // The description cell should be wrapped in quotes with internal quotes doubled
    expect(dataLine).toContain('"He said ""hello"", she replied"');
  });

  it('starts with UTF-8 BOM character', () => {
    exportResourcesCsv([], 'test');

    const csv = captureLastCsv();
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('produces only header row when given empty array', () => {
    exportResourcesCsv([], 'test');

    const csv = captureLastCsv();
    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Title');
  });

  it('triggers a file download by clicking a temporary link', () => {
    exportResourcesCsv([{ title: 'A', url: '', publisher: '', description: '', barrier_category: '', barriers: [], personas: [], country: [], evidence_type: '', date: '' }], 'my-file');

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('buildExportFilename', () => {
  it('returns "toolkit-export-all-<date>" when no filters are active', () => {
    const result = buildExportFilename({});
    expect(result).toMatch(/^toolkit-export-all-\d{4}-\d{2}-\d{2}$/);
  });

  it('includes theme slug when theme is selected', () => {
    const result = buildExportFilename({ theme: 'risk-ethics-and-assurance' });
    expect(result).toContain('risk-ethics-and-assurance');
    expect(result).not.toContain('all');
  });

  it('includes persona names when personas are selected', () => {
    const result = buildExportFilename({ personas: ['Programme', 'Project'] });
    expect(result).toContain('programme');
    expect(result).toContain('project');
    expect(result).not.toContain('all');
  });

  it('includes both theme and personas', () => {
    const result = buildExportFilename({ theme: 'skill-and-culture-gaps', personas: ['Business'] });
    expect(result).toContain('skill-and-culture-gaps');
    expect(result).toContain('business');
  });

  it('always ends with a date in YYYY-MM-DD format', () => {
    const result = buildExportFilename({ theme: 'some-theme', personas: ['Project'] });
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}$/);
  });

  it('starts with "toolkit-export"', () => {
    const result = buildExportFilename({ theme: 'anything' });
    expect(result.startsWith('toolkit-export-')).toBe(true);
  });
});
