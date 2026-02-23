import React, { useEffect, useMemo, useState } from "react";
import RESOURCES from "./data/resources.json";
import THEMES_RAW from "./data/barrier_themes.json";
import BARRIERS_RAW from "./data/barriers.json";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { lighten } from "./utils/colors";
import { normalizeResource } from "./utils/dataTransform";
import { parseURLParams, updateBrowserURL } from "./utils/urlState";
import { logMemoryUsage, logWebVitals, checkPerformanceBudget } from "./utils/performanceMonitor";
import VirtualizedResourceList from "./components/VirtualizedResourceList";
import { register as registerServiceWorker } from "./utils/serviceWorkerRegistration";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { REGIONS, EVIDENCE_TYPES, getRegionsForCountries, getCountryFlag } from "./utils/geography";
import { exportResourcesCsv, buildExportFilename } from "./utils/exportCsv";
import { SUGGEST_FORM_URL } from "./constants";

const PERSONAS = ["Project", "Programme", "Business"];
const ARMM_LEVELS = [
  "Experimenting",
  "Supervised",
  "Reliable",
  "Resilient",
  "Mission-Critical"
];
const RAD = Math.PI / 180;

// No need for memoized cell components - we'll render cells inline

// --- Memoized Resource Item Component ---
const ResourceItem = React.memo(({ resource, BARRIERS, THEME_COLORS, lighten, getCountryFlag }) => {
  const armmLevelNames = ["Experimenting", "Supervised", "Reliable", "Resilient", "Mission-Critical"];
  const armmLevelColors = ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"]; // Slate shades from light to dark

  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-tortoise p-6 mb-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-secondary flex-1">{resource.title}</h3>
        {resource.armm_levels && resource.armm_levels.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {resource.armm_levels.map((level) => (
              <div
                key={level}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                style={{ backgroundColor: armmLevelColors[level] }}
                title={`ARMM Level ${level}: ${armmLevelNames[level]}`}
              >
                {level}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-secondary/80 mt-1 line-clamp-3">{resource.description}</p>
      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {(resource.personas || []).map((p) => <span key={p} className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-slate-100 text-slate-700">{p}</span>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {(resource.barriers || []).map((b) => {
          const barrier = BARRIERS.find(x => x.id === b);
          const label = barrier?.name || b;
          const color = barrier ? lighten(THEME_COLORS[barrier.themeId] || "#64748b", 0.6) : "#e5e7eb";
          return (
            <span key={b} style={{ background: color }} className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5">
              {label}
            </span>
          );
        })}
      </div>
      {/* Country flags and evidence type */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {(resource.country || []).map((c) => {
          const flag = getCountryFlag(c);
          return flag ? (
            <span key={c} className="text-base leading-none" title={c} aria-label={c}>
              {flag}
            </span>
          ) : null;
        })}
        {resource.evidence_type && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-primary/10 text-primary font-medium">
            {resource.evidence_type}
          </span>
        )}
      </div>
      <a className="mt-3 inline-flex text-sm font-medium rounded-lg px-6 py-3 bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-transform duration-tortoise" href={resource.url} target="_blank" rel="noreferrer">
        Open resource
      </a>
    </article>
  );
});
ResourceItem.displayName = 'ResourceItem';

// --- Branding palette (aligned with Tortoise style guide) ---
const THEME_COLORS = {
  "leadership-and-alignment": "#7C3AED", // Violet (governance & strategy)
  "data-pooling-and-interoperability": "#0EA5E9", // Sky (connectivity & sharing)
  "digital-and-tech-constraints": "#334155", // Slate (technical & infrastructure)
  "skill-and-culture-gaps": "#10B981", // Green (growth & development)
  "procurement-and-commercial-models": "#F59E0B", // Amber (process & caution)
  "risk-ethics-and-assurance": "#D946EF", // Magenta (critical & important)
};


export default function App() {
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(null); // string | null
  const [selectedBarrier, setSelectedBarrier] = useState(null); // string | null (single)
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [armmRange, setArmmRange] = useState([0, 4]); // [min, max]
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState([]);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState(null); // 'theme' | 'barrier' | null
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [linkCopied, setLinkCopied] = useState(false);

  // Tracks temporary "move the opposite thumb" behavior while dragging from an overlapped state.
  const armmBridgeModeRef = React.useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const updateMatch = () => setIsDesktop(media.matches);
    updateMatch();
    if (media.addEventListener) {
      media.addEventListener('change', updateMatch);
    } else {
      media.addListener(updateMatch);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', updateMatch);
      } else {
        media.removeListener(updateMatch);
      }
    };
  }, []);

  // URL ↔ state
  useEffect(() => {
    const params = parseURLParams();
    if (params.search) setSearch(params.search);
    if (params.theme) setSelectedTheme(params.theme);
    if (params.barrier) setSelectedBarrier(params.barrier);
    if (params.personas.length) setSelectedPersonas(params.personas);
    if (params.armmRange) setArmmRange(params.armmRange);
    if (params.regions.length) setSelectedRegions(params.regions);
    if (params.countries.length) setSelectedCountries(params.countries);
    if (params.evidenceTypes.length) setSelectedEvidenceTypes(params.evidenceTypes);
  }, []);
  useEffect(() => {
    updateBrowserURL({
      search,
      theme: selectedTheme,
      barrier: selectedBarrier,
      personas: selectedPersonas,
      armmRange: armmRange,
      regions: selectedRegions,
      countries: selectedCountries,
      evidenceTypes: selectedEvidenceTypes,
    });
  }, [search, selectedTheme, selectedBarrier, selectedPersonas, armmRange, selectedRegions, selectedCountries, selectedEvidenceTypes]);

  // Performance monitoring on mount (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Log initial performance metrics after component mounts
      const timer = setTimeout(() => {
        console.log('=== Project Delivery Toolkit Performance Report ===');
        logWebVitals();
        logMemoryUsage();
        checkPerformanceBudget();
      }, 2000); // Wait 2s for page to fully load

      return () => clearTimeout(timer);
    }
  }, []);

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker({
      onSuccess: () => console.log('✅ App cached for offline use'),
      onUpdate: () => console.log('🔄 New version available'),
      enableInDev: false // Disable in development
    });
  }, []);

  // SINGLE-SELECTION behaviour - memoize callbacks to prevent unnecessary re-renders
  const toggleTheme = React.useCallback((id) => {
    console.log('toggleTheme clicked:', id);
    setSelectedTheme((curr) => {
      const newValue = curr === id ? null : id;
      console.log('selectedTheme changed from', curr, 'to', newValue);
      return newValue;
    });
    setSelectedBarrier(null); // clear barrier when picking a theme
  }, []);
  const toggleBarrier = React.useCallback((id, _themeId) => {
    console.log('toggleBarrier clicked:', id, 'themeId:', _themeId);
    setSelectedBarrier((curr) => {
      const newValue = curr === id ? null : id;
      console.log('selectedBarrier changed from', curr, 'to', newValue);
      return newValue;
    });
    setSelectedTheme(null); // clear theme when picking a barrier
  }, []);
  const togglePersona = React.useCallback((id) => setSelectedPersonas((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])), []);
  const toggleRegion = React.useCallback((id) => setSelectedRegions((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])), []);
  const toggleCountry = React.useCallback((id) => setSelectedCountries((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])), []);
  const toggleEvidenceType = React.useCallback((id) => setSelectedEvidenceTypes((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id])), []);
  const clearAll = React.useCallback(() => { setSearch(""); setSelectedTheme(null); setSelectedBarrier(null); setSelectedPersonas([]); setArmmRange([0, 4]); setSelectedRegions([]); setSelectedCountries([]); setSelectedEvidenceTypes([]); }, []);
  const clearArmmBridgeMode = React.useCallback(() => {
    armmBridgeModeRef.current = null;
  }, []);
  const copyShareLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, []);
  const handleArmmMinChange = React.useCallback((e) => {
    const newMin = Number(e.target.value);
    setArmmRange((prev) => {
      const [prevMin, prevMax] = prev;

      // A direct min-thumb interaction should cancel any max-thumb bridge mode.
      if (armmBridgeModeRef.current === 'min-via-max') {
        armmBridgeModeRef.current = null;
      }

      if (prevMin === prevMax && newMin > prevMin) {
        armmBridgeModeRef.current = 'max-via-min';
        return [prevMin, newMin];
      }

      if (armmBridgeModeRef.current === 'max-via-min') {
        if (newMin >= prevMax) {
          return [prevMin, newMin];
        }
        armmBridgeModeRef.current = null;
      }

      return [Math.min(newMin, prevMax), prevMax];
    });
  }, []);
  const handleArmmMaxChange = React.useCallback((e) => {
    const newMax = Number(e.target.value);
    setArmmRange((prev) => {
      const [prevMin, prevMax] = prev;

      // A direct max-thumb interaction should cancel any min-thumb bridge mode.
      if (armmBridgeModeRef.current === 'max-via-min') {
        armmBridgeModeRef.current = null;
      }

      if (prevMin === prevMax && newMax < prevMax) {
        armmBridgeModeRef.current = 'min-via-max';
        return [newMax, prevMax];
      }

      if (armmBridgeModeRef.current === 'min-via-max') {
        if (newMax <= prevMin) {
          return [newMax, prevMax];
        }
        armmBridgeModeRef.current = null;
      }

      return [prevMin, Math.max(newMax, prevMin)];
    });
  }, []);

  // Memoize hover handlers to prevent creating new functions on every render
  const handleMouseEnterTheme = React.useCallback(() => setHoveredLayer('theme'), []);
  const handleMouseEnterBarrier = React.useCallback(() => setHoveredLayer('barrier'), []);
  const handleMouseLeave = React.useCallback(() => setHoveredLayer(null), []);

  const DATA_RESOURCES = useMemo(() => RESOURCES.map(normalizeResource), []);
  const THEMES = useMemo(() => [...THEMES_RAW].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)), []);
  const BARRIERS = useMemo(() => BARRIERS_RAW.map(b => ({ ...b, themeId: b.themeId || b.categoryId })), []);

  // Base filter (affects counts & ring): search + personas + ARMM range + region + evidenceType
  // Memoize to prevent cascading recalculations
  const baseFilter = React.useCallback((r) => {
    const q = search.trim().toLowerCase();
    const matchesText = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchesPersonas = !selectedPersonas.length || r.personas.some((p) => selectedPersonas.includes(p));
    // Check if resource has any ARMM level within the selected range
    const [minLevel, maxLevel] = armmRange;
    const isDefaultRange = minLevel === 0 && maxLevel === 4;
    const matchesARMM = isDefaultRange
      ? true // Show all resources (including those without ARMM data) when range is default
      : (r.armm_levels && r.armm_levels.length > 0 && r.armm_levels.some((level) => level >= minLevel && level <= maxLevel));
    // Region: match against stored region array or compute from country
    const matchesRegion = !selectedRegions.length ||
      (r.region && r.region.some(reg => selectedRegions.includes(reg))) ||
      getRegionsForCountries(r.country || []).some(reg => selectedRegions.includes(reg));
    const matchesCountry = !selectedCountries.length ||
      (r.country && r.country.some(c => selectedCountries.includes(c)));
    const matchesEvidenceType = !selectedEvidenceTypes.length ||
      selectedEvidenceTypes.includes(r.evidence_type);
    return matchesText && matchesPersonas && matchesARMM && matchesRegion && matchesCountry && matchesEvidenceType;
  }, [search, selectedPersonas, armmRange, selectedRegions, selectedCountries, selectedEvidenceTypes]);

  // ---- Build aligned data ----
  const barrierValues = useMemo(() => {
    return BARRIERS.map(b => ({
      id: b.id,
      name: b.name,
      themeId: b.themeId,
      value: DATA_RESOURCES.filter((r) => baseFilter(r) && r.barriers.includes(b.id)).length,
    }));
  }, [BARRIERS, DATA_RESOURCES, baseFilter]);

  const barriersByTheme = useMemo(() => {
    const lookup = new Map();
    THEMES.forEach(t => lookup.set(t.id, []));
    barrierValues.forEach(b => { if (lookup.has(b.themeId)) lookup.get(b.themeId).push(b); });
    // keep stable ordering by name
    THEMES.forEach(t => lookup.get(t.id).sort((a, b) => a.name.localeCompare(b.name)));
    return THEMES.map(t => ({ theme: t, items: lookup.get(t.id) || [] }));
  }, [THEMES, barrierValues]);

  // Inner ring sizing must align with the sum of its barriers so the wedges line up.
  // We still show UNIQUE resource counts in the tooltip via `displayCount`.
  const themeData = useMemo(() => {
    // 1) Sum barrier values per theme (these already honor baseFilter)
    const sums = new Map();
    THEMES.forEach((t) => sums.set(t.id, 0));
    barrierValues.forEach((b) => {
      sums.set(b.themeId, (sums.get(b.themeId) || 0) + (b.value || 0));
    });

    // 2) Unique count by barrier_category for tooltip display
    const uniqueByTheme = new Map();
    THEMES.forEach((t) => uniqueByTheme.set(t.id, 0));
    THEMES.forEach((t) => {
      const c = DATA_RESOURCES.filter((r) => baseFilter(r) && r.barrier_category === t.id).length;
      uniqueByTheme.set(t.id, c);
    });

    return THEMES.map((t) => {
      const sum = sums.get(t.id) || 0;
      return {
        id: t.id,
        name: t.name,
        value: sum === 0 ? 0.0001 : sum, // epsilon keeps the slice visible while aligning with outer ring
        displayCount: uniqueByTheme.get(t.id) || 0,
      };
    });
  }, [THEMES, barrierValues, DATA_RESOURCES, baseFilter]);
  // Outer ring flattened, in the exact grouped order
  const barrierData = useMemo(() => barriersByTheme.flatMap(g => g.items), [barriersByTheme]);

  // Sum of theme values for angle calculations (for label visibility)
  const themeTotal = useMemo(() => themeData.reduce((a, b) => a + (b.value || 0), 0), [themeData]);

  // Render theme labels along the arc with optional two lines, upright on both halves of the circle.
  // Uses polyline paths instead of SVG Arc flags to avoid sweep-direction quirks across browsers.
  // Memoized to prevent recreating function on every render (reduces memory churn)
  // Currently unused but kept for potential future use
  const _renderInnerThemeLabel = React.useCallback((props) => {
    const {
      cx, cy, startAngle, endAngle, innerRadius, outerRadius, payload,
    } = props;

    if (!themeTotal) return null;

    // Trim arc ends a tiny bit so text doesn't clip into the strokes.
    const pad = 3; // degrees
    // Preserve original direction (Recharts gives clockwise for our config: startAngle > endAngle)
    const sA = startAngle > endAngle ? startAngle - pad : startAngle + pad;
    const eA = startAngle > endAngle ? endAngle + pad : endAngle - pad;
    const rawAngle = Math.abs(eA - sA);
    if (rawAngle < 12) return null; // too small to show a label

    const ir = Number(innerRadius);
    const or = Number(outerRadius);
    if (!Number.isFinite(ir) || !Number.isFinite(or)) return null;

    // Helper to convert chart degrees → screen XY.
    const RAD = Math.PI / 180;
    const toXY = (deg, r) => {
      // Recharts angles increase clockwise; SVG y is downward, so negate.
      const rad = (-deg) * RAD;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };

    // Midpoint Y to determine whether slice is on the bottom half visually.
    const midDeg = (sA + eA) / 2;
    const [_mx, my] = toXY(midDeg, (ir + or) / 2);
    const isBottom = my > cy;

    // Build a polyline-like path string from angle a0 → a1 at radius r.
    const buildPath = (a0, a1, r, steps = Math.max(10, Math.ceil(Math.abs(a1 - a0) / 6))) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = a0 + (a1 - a0) * t;
        const [x, y] = toXY(a, r);
        pts.push([x, y]);
      }
      // Path as M + L segments
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
      return d;
    };

    // We want text upright. On the bottom half, reverse the path direction so the text isn't upside-down.
    const a0 = isBottom ? eA : sA;
    const a1 = isBottom ? sA : eA;

    // Two concentric paths (for 1st and optional 2nd line).
    const r1 = (ir + or) / 2 - 1;
    const r2 = r1 - 12; // second line slightly inwards
    const d1 = buildPath(a0, a1, r1);
    const d2 = buildPath(a0, a1, r2);

    // Estimate arc length in px for fitting text
    const arcLenPx = r1 * Math.abs(a1 - a0) * RAD;

    // Prefer shorter theme names when we have them
    const shortMap = {
      'Procurement & Commercial Models': 'Procurement & Commercial',
      'Digital & Tech Constraints': 'Digital & Tech',
      'Data Pooling & Interoperability': 'Data Pooling & Interop',
      'Risk, Ethics & Assurance': 'Risk, Ethics & Assurance',
      'Leadership & Alignment': 'Leadership & Alignment',
      'Skill & Culture Gaps': 'Skill & Culture'
    };
    const fullLabel = shortMap[payload?.name] || payload?.name || '';

    // Fit utilities
    const pxPerCharAt12px = 6.5; // rough width at 12px
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ellipsize = (s, maxChars) => (s.length <= maxChars ? s : s.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…');

    // Decide max usable length per line (leave margin so it doesn't touch wedge edges)
    const maxSinglePx = Math.max(48, arcLenPx * 0.92);

    // First try single-line fit; if it won't fit, split into two lines.
    const singleFont = clamp(arcLenPx / Math.max(10, fullLabel.length * (pxPerCharAt12px / 12)), 9, 12);
    const singlePx = fullLabel.length * (pxPerCharAt12px * (singleFont / 12));
    const useTwoLines = singlePx > maxSinglePx;

    // Heuristic splitter for two lines
    const splitTwoLines = (s) => {
      const prefer = [' & ', ' - ', ' and '];
      for (const token of prefer) {
        const i = s.indexOf(token);
        if (i > 0 && i < s.length - token.length) {
          return [s.slice(0, i + token.trim().length), s.slice(i + token.length).trim()];
        }
      }
      const parts = s.split(' ');
      if (parts.length < 2) return [s];
      let acc = 0, bestIdx = -1, bestDiff = Infinity;
      const total = parts.join('').length;
      for (let i = 1; i < parts.length; i++) {
        acc += parts[i - 1].length;
        const diff = Math.abs(acc - total / 2);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      }
      return [parts.slice(0, bestIdx).join(' '), parts.slice(bestIdx).join(' ')];
    };

    let lines = useTwoLines ? splitTwoLines(fullLabel) : [fullLabel];

    // Compute fonts & ellipsis per line
    const baseFont = clamp(arcLenPx / Math.max(16, fullLabel.length * 0.7), 9, 12);
    const font1 = baseFont;
    const font2 = clamp(baseFont * 0.95, 8.5, 11.5);

    const maxPxLine1 = maxSinglePx;
    const maxPxLine2 = maxSinglePx * 0.92;

    const pxFor = (s, font) => s.length * (pxPerCharAt12px * (font / 12));

    // Ellipsize if needed
    if (lines.length === 1) {
      if (pxFor(lines[0], font1) > maxPxLine1) {
        const maxChars = Math.floor(maxPxLine1 / (pxPerCharAt12px * (font1 / 12)));
        lines[0] = ellipsize(lines[0], Math.max(3, maxChars));
      }
    } else {
      if (pxFor(lines[0], font1) > maxPxLine1) {
        const maxChars = Math.floor(maxPxLine1 / (pxPerCharAt12px * (font1 / 12)));
        lines[0] = ellipsize(lines[0], Math.max(3, maxChars));
      }
      if (pxFor(lines[1], font2) > maxPxLine2) {
        const maxChars = Math.floor(maxPxLine2 / (pxPerCharAt12px * (font2 / 12)));
        lines[1] = ellipsize(lines[1], Math.max(3, maxChars));
      }
    }

    const pathId1 = `themeLabelArc-${payload?.id}-1-${Math.round(sA)}-${Math.round(eA)}`;
    const pathId2 = `themeLabelArc-${payload?.id}-2-${Math.round(sA)}-${Math.round(eA)}`;

    return (
      <g style={{ pointerEvents: 'none' }}>
        <defs>
          <path id={pathId1} d={d1} fill="none" />
          {lines.length > 1 && <path id={pathId2} d={d2} fill="none" />}
        </defs>
        <text fill="#0f172a" fontSize={font1} textAnchor="middle" dominantBaseline="middle">
          <textPath href={`#${pathId1}`} startOffset="50%" method="align" spacing="auto">
            {lines[0]}
          </textPath>
        </text>
        {lines.length > 1 && (
          <text fill="#0f172a" fontSize={font2} textAnchor="middle" dominantBaseline="middle">
            <textPath href={`#${pathId2}`} startOffset="50%" method="align" spacing="auto">
              {lines[1]}
            </textPath>
          </text>
        )}
      </g>
    );
  }, [themeTotal]);

  // Render theme labels just **outside** the outer ring, colour-coded, following the arc.
  // Memoized to prevent recreating function on every render (reduces memory churn)
  const renderOuterThemeLabel = React.useCallback((props) => {
    const { cx, cy, startAngle, endAngle, innerRadius, outerRadius, payload } = props;
    if (!themeTotal) return null;

    // pad and angles
    const pad = 2;
    const sA = startAngle > endAngle ? startAngle - pad : startAngle + pad;
    const eA = startAngle > endAngle ? endAngle + pad : endAngle - pad;
    const rawAngle = Math.abs(eA - sA);
    if (rawAngle < 12) return null;

    const ir = Number(innerRadius);
    const or = Number(outerRadius);
    if (!Number.isFinite(ir) || !Number.isFinite(or)) return null;

    const RAD = Math.PI / 180;
    const toXY = (deg, r) => {
      const rad = (-deg) * RAD;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };

    const midDeg = (sA + eA) / 2;
    const [_mx2, my] = toXY(midDeg, (ir + or) / 2);
    const isBottom = my > cy;

    // place path slightly outside the actual outer ring
    const r = or + 5; // 8px outside the ring (reduced whitespace)
    const buildPath = (a0, a1, r, steps = Math.max(10, Math.ceil(Math.abs(a1 - a0) / 6))) => {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = a0 + (a1 - a0) * t;
        const rad = (-a) * RAD;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        pts.push([x, y]);
      }
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
      return d;
    };

    const a0 = isBottom ? eA : sA;
    const a1 = isBottom ? sA : eA;
    const d = buildPath(a0, a1, r);

    // fit
    const arcLenPx = r * Math.abs(a1 - a0) * RAD;
    const pxPerCharAt12px = 7.2;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const label = payload?.name || '';
    const maxPx = Math.max(64, arcLenPx * 0.9);
    let font = clamp(arcLenPx / Math.max(18, label.length * 0.85), 9.5, 12.5);
    const est = label.length * (pxPerCharAt12px * (font / 12));
    let text = label;
    if (est > maxPx) {
      const maxChars = Math.floor(maxPx / (pxPerCharAt12px * (font / 12)));
      text = (label.length <= maxChars) ? label : label.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
    }

    const color = THEME_COLORS[payload?.id] || '#334155';
    const pathId = `themeOuterArc-${payload?.id}-${Math.round(sA)}-${Math.round(eA)}`;

    // Dim labels when their theme isn't active (match ring behaviour)
    const activeThemeId = selectedTheme || (selectedBarrier ? (BARRIERS.find(b => b.id === selectedBarrier)?.themeId) : null);
    const dim = !!(activeThemeId && payload?.id !== activeThemeId);
    const labelOpacity = dim ? 0.3 : 1;

    // Make the label interactive: wrap in <g> (no pointerEvents: 'none'), add onClick to <text>, cursor pointer.
    return (
      <g>
        <defs>
          <path id={pathId} d={d} fill="none" />
        </defs>
        <text
          fill={color}
          fontSize={font}
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
          opacity={labelOpacity}
          style={{ cursor: "pointer" }}
          onClick={() => toggleTheme(payload?.id)}
        >
          <textPath href={`#${pathId}`} startOffset="50%" method="align" spacing="auto">
            {text}
          </textPath>
        </text>
      </g>
    );
  }, [themeTotal, selectedTheme, selectedBarrier, BARRIERS, toggleTheme]);

  // Results list filter (honours single-selection for theme/barrier plus all other filters)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const [minLevel, maxLevel] = armmRange;
    const isDefaultRange = minLevel === 0 && maxLevel === 4;
    const results = DATA_RESOURCES.filter((r) => {
      const matchesText = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (r.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchesPersonas = !selectedPersonas.length || r.personas.some((p) => selectedPersonas.includes(p));
      const matchesTheme = !selectedTheme || r.barrier_category === selectedTheme;
      const matchesBarrier = !selectedBarrier || r.barriers.includes(selectedBarrier);
      const matchesARMM = isDefaultRange
        ? true
        : (r.armm_levels && r.armm_levels.length > 0 && r.armm_levels.some((level) => level >= minLevel && level <= maxLevel));
      const matchesRegion = !selectedRegions.length ||
        (r.region && r.region.some(reg => selectedRegions.includes(reg))) ||
        getRegionsForCountries(r.country || []).some(reg => selectedRegions.includes(reg));
      const matchesCountry = !selectedCountries.length ||
        (r.country && r.country.some(c => selectedCountries.includes(c)));
      const matchesEvidenceType = !selectedEvidenceTypes.length ||
        selectedEvidenceTypes.includes(r.evidence_type);
      return matchesText && matchesPersonas && matchesTheme && matchesBarrier && matchesARMM && matchesRegion && matchesCountry && matchesEvidenceType;
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    console.log('Filtered results:', results.length, 'selectedBarrier:', selectedBarrier, 'selectedTheme:', selectedTheme);
    return results;
  }, [DATA_RESOURCES, search, selectedPersonas, selectedTheme, selectedBarrier, armmRange, selectedRegions, selectedCountries, selectedEvidenceTypes]);

  const hasActiveFilters = !!(selectedTheme || selectedBarrier || selectedPersonas.length > 0 || selectedRegions.length > 0 || selectedEvidenceTypes.length > 0);

  // Colours - memoize themeFill to prevent recreation
  const themeFill = React.useCallback((themeId, highlighted) => highlighted ? (THEME_COLORS[themeId] || "#334155") : lighten(THEME_COLORS[themeId] || "#94a3b8", 0.35), []);
  const barrierFills = useMemo(() => {
    const map = new Map();
    barriersByTheme.forEach(({ theme, items }) => {
      const base = THEME_COLORS[theme.id] || "#64748b";
      const n = Math.max(1, items.length);
      items.forEach((item, i) => {
        const shade = lighten(base, 0.6 - (i / (n - 1 || 1)) * 0.32);
        map.set(item.id, shade);
      });
    });
    return map;
  }, [barriersByTheme]);

  const _selectedThemeLabel = selectedTheme ? (THEMES.find((t) => t.id === selectedTheme) || {}).name : null;
  const selectedBarrierLabel = selectedBarrier ? (BARRIERS.find((b) => b.id === selectedBarrier) || {}).name : null;

  // selection highlighting for outer ring
  const _isBarrierActive = (b) => {
    if (selectedBarrier) return b.id === selectedBarrier;
    if (selectedTheme) return b.themeId === selectedTheme; // highlight all within theme
    return false;
  };
  const layoutHeight = 'calc(100svh - var(--hdr))';
  const mainStyle = isDesktop ? { height: layoutHeight } : { minHeight: layoutHeight };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ paddingTop: 'var(--hdr)' }}>
      <Header />

      {/* Main content */}
      <main
        className="max-w-7xl mx-auto px-4 py-2 grid lg:grid-cols-12 lg:grid-rows-[auto,1fr] gap-2"
        style={mainStyle}
      >
        {/* Filters card (search + personas + ARMM levels) spans above ring */}
        <section className="lg:col-span-8 lg:row-start-1 bg-white border border-slate-200 rounded-xl shadow-lg p-6">
          <div className="flex flex-col gap-4">
            {/* Search bar */}
            <div className="w-full">
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/40"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20 15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, description, tags…"
                  className="w-full rounded-lg border-2 border-secondary/20 bg-white pl-11 pr-28 py-3 text-sm placeholder-secondary/40 shadow-sm focus:outline-none focus:border-primary/20 focus:ring-2 focus:ring-primary/20 transition-all duration-tortoise"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center font-medium rounded-lg bg-secondary text-white hover:scale-[1.02] active:scale-[0.98] transition-transform duration-tortoise px-4 py-2 text-xs"
                  onClick={clearAll}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter groups */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Persona filter */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-secondary">Persona</h3>
                <div className="flex flex-wrap gap-2">
                  {PERSONAS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePersona(p)}
                      className={`inline-flex items-center gap-1 font-medium rounded-lg border-2 px-4 py-2 text-xs transition-all duration-tortoise hover:scale-[1.02] active:scale-[0.98] ${
                        selectedPersonas.includes(p)
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-secondary/20 text-secondary hover:border-primary/40"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* ARMM Maturity filter */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-secondary">ARMM Maturity Range</h3>
                <div className="px-1">
                  {/* Range display */}
                  <div className="flex justify-between items-center mb-2 gap-1">
                    <span className="text-[10px] font-medium text-primary truncate">
                      L{armmRange[0]}: {ARMM_LEVELS[armmRange[0]]}
                    </span>
                    <span className="text-[10px] text-secondary/60 shrink-0">to</span>
                    <span className="text-[10px] font-medium text-primary truncate">
                      L{armmRange[1]}: {ARMM_LEVELS[armmRange[1]]}
                    </span>
                  </div>

                  {/* Dual range slider */}
                  <div className="relative pt-1 pb-5">
                    {/* Track */}
                    <div className="absolute top-0.5 left-0 right-0 h-1.5 bg-secondary/10 rounded-full" />

                    {/* Active range highlight */}
                    <div
                      className="absolute top-0.5 h-1.5 bg-primary rounded-full transition-all duration-tortoise"
                      style={{
                        left: `${(armmRange[0] / 4) * 100}%`,
                        right: `${100 - (armmRange[1] / 4) * 100}%`
                      }}
                    />

                    {/* Min range input */}
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={armmRange[0]}
                      onChange={handleArmmMinChange}
                      onPointerDown={clearArmmBridgeMode}
                      onPointerUp={clearArmmBridgeMode}
                      onPointerCancel={clearArmmBridgeMode}
                      onBlur={clearArmmBridgeMode}
                      className="absolute top-0 left-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-tortoise hover:[&::-webkit-slider-thumb]:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-tortoise hover:[&::-moz-range-thumb]:scale-110"
                    />

                    {/* Max range input */}
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={armmRange[1]}
                      onChange={handleArmmMaxChange}
                      onPointerDown={clearArmmBridgeMode}
                      onPointerUp={clearArmmBridgeMode}
                      onPointerCancel={clearArmmBridgeMode}
                      onBlur={clearArmmBridgeMode}
                      className="absolute top-0 left-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-tortoise hover:[&::-webkit-slider-thumb]:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-tortoise hover:[&::-moz-range-thumb]:scale-110"
                    />

                    {/* Level markers */}
                    <div className="absolute top-4 left-0 right-0 flex justify-between">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div key={level} className="relative group flex flex-col items-center">
                          <span className="text-[9px] font-medium text-secondary/60">
                            {level}
                          </span>
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 px-1.5 py-0.5 bg-secondary text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-tortoise pointer-events-none z-10">
                            {ARMM_LEVELS[level]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Region filter */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-secondary">Region</h3>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() => toggleRegion(region)}
                      className={`inline-flex items-center gap-1 font-medium rounded-lg border-2 px-4 py-2 text-xs transition-all duration-tortoise hover:scale-[1.02] active:scale-[0.98] ${
                        selectedRegions.includes(region)
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-secondary/20 text-secondary hover:border-primary/40"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* More filters disclosure toggle */}
            <div>
              <button
                onClick={() => setMoreFiltersOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-secondary/60 hover:text-secondary transition-colors duration-tortoise"
                aria-expanded={moreFiltersOpen}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${moreFiltersOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
                {moreFiltersOpen ? 'Fewer filters' : 'More filters'}
              </button>

              {moreFiltersOpen && (
                <div className="grid md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-secondary/10">
                  {/* Evidence Type filter */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-secondary">Evidence Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {EVIDENCE_TYPES.map((et) => (
                        <button
                          key={et}
                          onClick={() => toggleEvidenceType(et)}
                          className={`inline-flex items-center gap-1 font-medium rounded-lg border-2 px-4 py-2 text-xs transition-all duration-tortoise hover:scale-[1.02] active:scale-[0.98] ${
                            selectedEvidenceTypes.includes(et)
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-secondary/20 text-secondary hover:border-primary/40"
                          }`}
                        >
                          {et}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country filter (derived from data; shows countries present in filtered results) */}
                  {/* TODO: future - add country search / flag-based picker here */}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Center: ring */}
        <section className="lg:col-span-8 lg:row-start-2 bg-white border border-slate-200 rounded-xl shadow-lg p-6 pb-0 h-[44vh] sm:h-[48vh] lg:h-full min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3 text-sm text-secondary/80 h-5">
            <div>
              <span className="hidden lg:inline">Click a theme (inner ring) or a barrier (outer ring) to filter.</span>
              <span className="lg:hidden">Tap a theme (inner) or barrier (outer); results are listed below.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="truncate max-w-[50vw] text-right">
                {selectedBarrier && <span>Selected: <span className="font-semibold text-primary">Barrier — {selectedBarrierLabel}</span></span>}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>
            <div className="relative w-full h-full" style={{ outline: 'none' }}>
              {/* Gradient overlay: keep as first absolute child */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    'radial-gradient(90% 90% at 50% 55%, rgba(2,6,23,0.035) 0%, rgba(2,6,23,0.02) 40%, transparent 70%)'
                }}
              />
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }} style={{ outline: 'none' }}>
                  {/* Inner ring: themes (exact sum of its barriers) */}
                  <Pie
                    data={themeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="32%"
                    outerRadius="48%"
                    startAngle={90}
                    endAngle={-270}  // clockwise
                    cx="50%"
                    cy="50%"
                    isAnimationActive={false}
                    label={false}
                    labelLine={false}
                    paddingAngle={0}  // ensure perfect alignment
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="hidden lg:block"
                  >
                    {themeData.map((d) => (
                      <Cell
                        key={d.id}
                        className="cursor-pointer"
                        style={{ outline: 'none' }}
                        fill={themeFill(d.id, selectedTheme === d.id)}
                        opacity={
                          selectedTheme
                            ? (selectedTheme === d.id ? 1 : 0.35)
                            : (selectedBarrier ? 0.35 : 1)
                        }
                        onClick={() => toggleTheme(d.id)}
                        onMouseEnter={() => setHoveredLayer('theme')}
                        onMouseLeave={() => setHoveredLayer(null)}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={themeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="78%"
                    outerRadius="83%"
                    startAngle={90}
                    endAngle={-270}
                    cx="50%"
                    cy="50%"
                    isAnimationActive={false}
                    label={renderOuterThemeLabel}
                    labelLine={false}
                    stroke="none"
                    fill="transparent"
                    pointerEvents="none"
                  />

                  {/* Outer ring: barriers ordered by theme so arcs align */}
                  <Pie
                    data={barrierData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="75%"
                    startAngle={90}
                    endAngle={-270}
                    cx="50%"
                    cy="50%"
                    isAnimationActive={false}
                    labelLine={false}
                    paddingAngle={0}  // ensure perfect alignment
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {barrierData.map((d) => (
                      <Cell
                        key={d.id}
                        className="cursor-pointer"
                        style={{ outline: 'none' }}
                        fill={
                          selectedBarrier === d.id
                            ? (THEME_COLORS[d.themeId] || "#334155")
                            : (barrierFills.get(d.id) || "#e5e7eb")
                        }
                        opacity={
                          selectedBarrier
                            ? (selectedBarrier === d.id ? 1 : 0.3)
                            : (selectedTheme ? (d.themeId === selectedTheme ? 1 : 0.3) : 1)
                        }
                        onClick={() => toggleBarrier(d.id, d.themeId)}
                        onMouseEnter={() => setHoveredLayer('barrier')}
                        onMouseLeave={() => setHoveredLayer(null)}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    followCursor
                    wrapperStyle={{ pointerEvents: 'none', transition: 'none' }}
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const pick = (hoveredLayer === 'barrier')
                        ? payload.find(e => e?.payload && e.payload.themeId)
                        : payload.find(e => e?.payload && !e.payload.themeId);
                      const entry = pick || payload[0];
                      const d = entry?.payload;
                      if (!d) return null;
                      const isBarrier = !!d.themeId;
                      const count = isBarrier ? d.value : (d.displayCount ?? d.value);
                      const themeName = isBarrier ? (THEMES.find(t => t.id === d.themeId)?.name || d.themeId) : d.name;
                      return (
                        <div style={{ background: 'white', border: '2px solid rgba(51, 65, 85, 0.1)', borderRadius: 12, boxShadow: '0 10px 40px rgba(217, 70, 239, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)', padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#334155', marginBottom: 4 }}>{d.name}</div>
                          <div style={{ fontSize: 13, color: 'rgba(51, 65, 85, 0.7)' }}>
                            <span style={{ fontWeight: 600, color: '#D946EF' }}>{count}</span> resources{isBarrier ? ` • ${themeName}` : ''}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Theme key removed */}
            </div>
          </div>
          
        </section>

        {/* Right: results */}
        <section className="lg:col-span-4 lg:row-span-2 flex min-h-[40vh] lg:min-h-0 lg:h-full">
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 w-full flex flex-col h-full min-h-[40vh] lg:min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0 sticky top-0 bg-white z-10 border-b border-slate-200 pb-3">
              <div className="text-base">
                <span className="font-semibold text-primary">{filtered.length}</span>
                <span className="text-secondary/80"> result{filtered.length === 1 ? "" : "s"}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Copy shareable link */}
                <button
                  onClick={copyShareLink}
                  className="p-1.5 rounded-lg text-secondary/60 hover:text-primary hover:bg-primary/5 transition-all duration-tortoise"
                  title={linkCopied ? "Link copied!" : "Copy shareable link"}
                >
                  {linkCopied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                </button>
                {/* Export filtered results as CSV */}
                {filtered.length > 0 && (
                  <button
                    onClick={() => exportResourcesCsv(filtered, buildExportFilename({ theme: selectedTheme, barrier: selectedBarrier, personas: selectedPersonas, regions: selectedRegions, evidenceTypes: selectedEvidenceTypes }))}
                    className="p-1.5 rounded-lg text-secondary/60 hover:text-primary hover:bg-primary/5 transition-all duration-tortoise"
                    title="Export filtered results as CSV"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 pr-1 overflow-hidden flex flex-col">
              {filtered.length > 0 && filtered.length < 5 && hasActiveFilters && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 shrink-0">
                  This area has limited coverage.{' '}
                  <a href={SUGGEST_FORM_URL} target="_blank" rel="noreferrer" className="font-medium underline hover:text-amber-900">
                    Help us improve it
                  </a>
                </div>
              )}
              {filtered.length > 0 ? (
                // Use virtualization for large lists (>50 items) for optimal performance
                filtered.length > 50 && isDesktop ? (
                  <VirtualizedResourceList
                    resources={filtered}
                    BARRIERS={BARRIERS}
                    THEME_COLORS={THEME_COLORS}
                    enableVirtualization={isDesktop}
                    height="100%"
                  />
                ) : (
                  // Small lists render normally
                  <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1 pb-2">
                    {filtered.map((r) => (
                      <ResourceItem
                        key={r.id}
                        resource={r}
                        BARRIERS={BARRIERS}
                        THEME_COLORS={THEME_COLORS}
                        lighten={lighten}
                        getCountryFlag={getCountryFlag}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 text-sm text-secondary/80 space-y-3">
                  <p>No resources match your current filters.</p>
                  <p>
                    <button onClick={clearAll} className="text-primary hover:underline font-medium">Clear all filters</button>
                    {' '}or{' '}
                    <a href={SUGGEST_FORM_URL} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                      suggest a resource
                    </a>
                    {' '}to help fill this gap.
                  </p>
                </div>
              )}
              {/* Suggest a resource - always visible at bottom */}
              <div className="shrink-0 pt-3 mt-auto border-t border-slate-200">
                <a
                  href={SUGGEST_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary/60 hover:text-primary transition-colors duration-tortoise"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Suggest a resource
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
} 
