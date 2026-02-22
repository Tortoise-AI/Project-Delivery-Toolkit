// scripts/build-data.mjs
import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import fetch from 'node-fetch';
import { getRegionsForCountries } from '../src/utils/geography.js';

const urls = {
  resources: process.env.RESOURCES_CSV_URL,
  barrierThemes: process.env.BARRIER_THEMES_CSV_URL,
  barriers: process.env.BARRIERS_CSV_URL,
};

if (!urls.resources || !urls.barrierThemes || !urls.barriers) {
  console.error("Missing CSV env vars. Set RESOURCES_CSV_URL, BARRIER_THEMES_CSV_URL, BARRIERS_CSV_URL");
  process.exit(1);
}

const csvToJson = async (url) => {
  const text = await (await fetch(url)).text();
  return parse(text, { columns: true, skip_empty_lines: true, bom: true });
};

const splitPipes = (s) => (s ? s.split('|').map(v => v.trim()).filter(Boolean) : []);

// Expected CSV column headers (new columns are backward-compatible with defaults):
// id,title,url,date,description,personas,barriers,barrier_theme,tags,publisher,type,
// featured,country,region,language,evidence_type,maturity_signal

const main = async () => {
  const [resources, barrierThemes, barriers] = await Promise.all([
    csvToJson(urls.resources),
    csvToJson(urls.barrierThemes),
    csvToJson(urls.barriers),
  ]);

  const normalizedResources = resources.map(r => {
    const country = splitPipes(r.country || 'GB');
    // Auto-compute region from country when the CSV region column is absent or blank
    const regionFromCsv = splitPipes(r.region);
    const region = regionFromCsv.length ? regionFromCsv : getRegionsForCountries(country);

    return {
      id: r.id,
      title: r.title,
      url: r.url,
      date: r.date || '',
      description: r.description || '',
      personas: splitPipes(r.personas),
      barriers: splitPipes(r.barriers),
      barrier_category: r.barrier_theme,   // required field name in app
      tags: splitPipes(r.tags),
      armm_level: r['ARMM maturity'] || r.armm_level || '',
      publisher: r.publisher || '',
      type: r.type || '',
      // Internationalisation fields
      country,
      region,
      language: r.language || 'en',
      evidence_type: r.evidence_type || r.type || '',
      maturity_signal: r.maturity_signal || '',
    };
  });

  fs.mkdirSync('src/data', { recursive: true });
  fs.writeFileSync('src/data/resources.json', JSON.stringify(normalizedResources, null, 2));
  fs.writeFileSync('src/data/barrier_themes.json', JSON.stringify(barrierThemes, null, 2));
  fs.writeFileSync('src/data/barriers.json', JSON.stringify(barriers, null, 2));
  console.log('✅ Wrote src/data/*.json');
};

main();
