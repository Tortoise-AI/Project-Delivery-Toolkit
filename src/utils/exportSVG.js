const DEFAULT_EXPORT_MARGIN = 5;

function ensureExtension(filename, extension) {
  if (!filename) return extension.startsWith('.') ? `export${extension}` : `export.${extension}`;
  const normalized = filename.trim();
  if (!extension) return normalized;
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  return normalized.toLowerCase().endsWith(ext) ? normalized : `${normalized}${ext}`;
}

export function serializeSvgNode(svgNode) {
  if (!svgNode) return "";
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgNode);
}

function parseNumericAttr(value, fallback) {
  if (value == null) return fallback;
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

function baseSvgDimensions(svgNode) {
  const viewBox = svgNode?.viewBox?.baseVal;
  const vbWidth = parseNumericAttr(viewBox?.width, null);
  const vbHeight = parseNumericAttr(viewBox?.height, null);
  const width = vbWidth ?? parseNumericAttr(svgNode?.width?.baseVal?.value, null) ?? parseNumericAttr(svgNode?.getAttribute?.("width"), null) ?? svgNode?.clientWidth ?? 2000;
  const height = vbHeight ?? parseNumericAttr(svgNode?.height?.baseVal?.value, null) ?? parseNumericAttr(svgNode?.getAttribute?.("height"), null) ?? svgNode?.clientHeight ?? 2000;
  return { width, height };
}

function prepareSvgForExport(svgNode, marginPx = 0) {
  const { width: baseWidth, height: baseHeight } = baseSvgDimensions(svgNode);
  const margin = Math.max(0, Number.isFinite(marginPx) ? marginPx : 0);
  const serializeOriginal = () => ({ svgString: serializeSvgNode(svgNode), width: baseWidth, height: baseHeight });
  if (!margin || typeof svgNode?.getBBox !== "function") {
    return serializeOriginal();
  }
  try {
    const bbox = svgNode.getBBox();
    if (!bbox || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height)) {
      return serializeOriginal();
    }
    const w = Math.max(1, bbox.width + margin * 2);
    const h = Math.max(1, bbox.height + margin * 2);
    const x = bbox.x - margin;
    const y = bbox.y - margin;
    const clone = svgNode.cloneNode(true);
    clone.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    return { svgString: serializeSvgNode(clone), width: w, height: h };
  } catch (err) {
    return serializeOriginal();
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCurrentSvg(svgNode, filename = "pdatf_ring.svg") {
  if (!svgNode) return;
  const { svgString } = prepareSvgForExport(svgNode, DEFAULT_EXPORT_MARGIN);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, ensureExtension(filename, ".svg"));
}

export function exportSvg(svgNode, filename = "pdatf_ring.svg") {
  downloadCurrentSvg(svgNode, filename);
}

export async function exportRaster(svgNode, {
  filename = "pdatf_ring",
  format = "png",
  scale = 2,
  background = "transparent",
} = {}) {
  if (!svgNode) return;
  const fmt = (format || "png").toLowerCase();
  const rasterExt = fmt === "jpeg" ? ".jpg" : fmt === "jpg" ? ".jpg" : ".png";
  const { svgString, width: contentWidth, height: contentHeight } = prepareSvgForExport(svgNode, DEFAULT_EXPORT_MARGIN);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    const width = contentWidth;
    const height = contentHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");

    if (fmt === "jpg" || fmt === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (background && background !== "transparent" && background !== "none") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    await new Promise((resolve, reject) => {
      const mime = (fmt === "jpg" || fmt === "jpeg") ? "image/jpeg" : "image/png";
      const quality = (fmt === "jpg" || fmt === "jpeg") ? 0.95 : 1.0;
      canvas.toBlob((out) => {
        if (!out) {
          reject(new Error("Failed to render raster export"));
          return;
        }
        downloadBlob(out, ensureExtension(filename, rasterExt));
        resolve();
      }, mime, quality);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
