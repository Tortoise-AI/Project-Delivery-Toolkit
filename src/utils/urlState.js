/**
 * Parse URL search parameters and return state object
 * @param {string} searchString - URL search string (e.g., "?theme=X&barrier=Y")
 * @returns {Object} State object with theme, barrier, search query, personas, and armmRange
 */
export const parseURLParams = (searchString = window.location.search) => {
  const params = new URLSearchParams(searchString);

  const q = (params.get("q") || "").trim();
  const theme = params.get("theme") || null;
  const barrier = params.get("barrier") || null;
  const personasStr = params.get("personas") || "";
  const personas = personasStr.split(",").filter(Boolean);
  const armmRangeStr = params.get("armmRange") || "";
  const armmRange = armmRangeStr ? armmRangeStr.split(",").map(Number) : [0, 4];

  return {
    search: q,
    theme: theme,
    barrier: barrier,
    personas: personas,
    armmRange: armmRange
  };
};

/**
 * Generate URL search string from state object
 * @param {Object} state - State object with search, theme, barrier, personas, armmRange
 * @param {string} state.search - Search query string
 * @param {string|null} state.theme - Selected theme ID
 * @param {string|null} state.barrier - Selected barrier ID
 * @param {Array<string>} state.personas - Array of selected persona IDs
 * @param {Array<number>} state.armmRange - ARMM maturity range [min, max]
 * @returns {string} URL search string (e.g., "?theme=X&barrier=Y")
 */
export const generateURLParams = (state) => {
  const params = new URLSearchParams();

  if (state.search) {
    params.set("q", state.search);
  }

  if (state.theme) {
    params.set("theme", state.theme);
  }

  if (state.barrier) {
    params.set("barrier", state.barrier);
  }

  if (state.personas && state.personas.length > 0) {
    params.set("personas", state.personas.join(","));
  }

  // Only add to URL if range is not the default [0, 4]
  if (state.armmRange && (state.armmRange[0] !== 0 || state.armmRange[1] !== 4)) {
    params.set("armmRange", state.armmRange.join(","));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Update the browser URL without reloading the page
 * @param {Object} state - State object with search, theme, barrier, personas, armmRange
 * @param {string} pathname - Optional pathname (defaults to current pathname)
 */
export const updateBrowserURL = (state, pathname = window.location.pathname) => {
  const queryString = generateURLParams(state);
  const url = `${pathname}${queryString}`;
  window.history.replaceState({}, "", url);
};
