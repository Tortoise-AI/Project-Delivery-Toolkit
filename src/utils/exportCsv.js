/**
 * Convert an array of resource objects to a CSV string and trigger a download.
 * @param {Array<Object>} resources - filtered resource array
 * @param {string} filename - download filename (without .csv extension)
 */
export const exportResourcesCsv = (resources, filename = 'toolkit-export') => {
  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'url', header: 'URL' },
    { key: 'publisher', header: 'Publisher' },
    { key: 'description', header: 'Description' },
    { key: 'barrier_category', header: 'Barrier Theme' },
    { key: 'barriers', header: 'Barriers' },
    { key: 'personas', header: 'Personas' },
    { key: 'country', header: 'Country' },
    { key: 'evidence_type', header: 'Evidence Type' },
    { key: 'date', header: 'Date' },
  ];

  const ARRAY_KEYS = new Set(['barriers', 'personas', 'country']);

  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Wrap in quotes if the value contains commas, quotes, or newlines
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerRow = columns.map(c => escapeCell(c.header)).join(',');

  const dataRows = resources.map(r => {
    return columns.map(({ key }) => {
      const val = r[key];
      if (ARRAY_KEYS.has(key)) {
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        return escapeCell(arr.join('|'));
      }
      return escapeCell(val ?? '');
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Build a filename from active filter state.
 * @param {Object} filterState - { theme, barrier, personas, regions, evidenceTypes }
 * @returns {string} filename without extension
 */
export const buildExportFilename = (filterState = {}) => {
  const { theme, barrier, personas = [], regions = [], evidenceTypes = [] } = filterState;

  const slugify = (str) =>
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const parts = ['toolkit-export'];

  if (theme) {
    parts.push(slugify(theme));
  } else if (barrier) {
    parts.push(slugify(barrier));
  }

  if (personas.length > 0) {
    parts.push(personas.map(slugify).join('-'));
  }

  if (parts.length === 1) {
    // No active filters added
    parts.push('all');
  }

  // Append date
  const today = new Date().toISOString().slice(0, 10);
  parts.push(today);

  return parts.join('-');
};
