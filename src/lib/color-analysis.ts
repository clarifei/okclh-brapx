import Color from "colorjs.io";

const QUANTIZE_FACTOR = 12;
const MAX_IMAGE_SIZE = 600;
const MIN_ALPHA = 128;
const MAX_COLORS = 60;
const MERGE_DISTANCE_OKLAB = 0.02;

const SKIN_LIGHTNESS = { min: 0.35, max: 0.85 };
const SKIN_CHROMA = { min: 0.02, max: 0.16 };
const SKIN_HUE = { min: 10, max: 90 };

const LIGHTNESS_OPTIMAL = { min: 0.35, max: 0.75 };
const LIGHTNESS_ACCEPTABLE = { min: 0.2, max: 0.85 };

const NEUTRAL_CHROMA = 0.03;
const NEUTRAL_CHROMA_EXTREME = 0.05;
const NEUTRAL_LIGHTNESS_DARK = 0.15;
const NEUTRAL_LIGHTNESS_LIGHT = 0.92;

const MIN_CHROMA_MULTIPLIER = 0.05;
const ACCENT_CHROMA_THRESHOLD = 0.12;

export interface ColorInfo {
  hex: string;
  oklch: {
    l: number;
    c: number;
    h: number;
  };
  oklchString: string;
  count: number;
  percentage: number;
  isPrimary?: boolean;
}

export interface AnalysisResult {
  totalColors: number;
  colors: ColorInfo[];
  totalPixelsAnalyzed: number;
  primaryColor: ColorInfo | null;
}

interface ColorAccumulator {
  count: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function quantizeColor(r: number, g: number, b: number): string {
  return `${Math.floor(r / QUANTIZE_FACTOR) * QUANTIZE_FACTOR},${Math.floor(g / QUANTIZE_FACTOR) * QUANTIZE_FACTOR},${Math.floor(b / QUANTIZE_FACTOR) * QUANTIZE_FACTOR}`;
}

function getScaledDimensions(
  width: number,
  height: number
): {
  width: number;
  height: number;
} {
  if (width <= MAX_IMAGE_SIZE && height <= MAX_IMAGE_SIZE) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: MAX_IMAGE_SIZE,
      height: Math.round((height / width) * MAX_IMAGE_SIZE),
    };
  }

  return {
    width: Math.round((width / height) * MAX_IMAGE_SIZE),
    height: MAX_IMAGE_SIZE,
  };
}

function addPixelToCounts(
  colorCounts: Map<string, ColorAccumulator>,
  r: number,
  g: number,
  b: number
): void {
  const key = quantizeColor(r, g, b);
  const existing = colorCounts.get(key);

  if (existing) {
    existing.count++;
    existing.sumR += r;
    existing.sumG += g;
    existing.sumB += b;
    return;
  }

  colorCounts.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
}

function countColors(pixels: Uint8ClampedArray): {
  colorCounts: Map<string, ColorAccumulator>;
  validPixels: number;
} {
  const colorCounts = new Map<string, ColorAccumulator>();
  let validPixels = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < MIN_ALPHA) {
      continue;
    }

    validPixels++;
    addPixelToCounts(colorCounts, r, g, b);
  }

  return { colorCounts, validPixels };
}

function accumulatorToColorInfo(
  value: ColorAccumulator,
  totalPixels: number
): ColorInfo | null {
  const avgR = Math.round(value.sumR / value.count);
  const avgG = Math.round(value.sumG / value.count);
  const avgB = Math.round(value.sumB / value.count);
  const hex = rgbToHex(avgR, avgG, avgB);

  try {
    const color = new Color("srgb", [avgR / 255, avgG / 255, avgB / 255]);

    if (!color.inGamut("srgb")) {
      color.toGamut({ space: "srgb", method: "css" });
    }

    const oklchColor = color.to("oklch");
    const l = oklchColor.coords[0] ?? 0;
    const c = oklchColor.coords[1] ?? 0;
    const h = oklchColor.coords[2] ?? 0;
    const oklchString = `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${Number.isNaN(h) ? "none" : h.toFixed(2)})`;

    return {
      hex,
      oklch: { l, c, h: Number.isNaN(h) ? 0 : h },
      oklchString,
      count: value.count,
      percentage: (value.count / totalPixels) * 100,
    };
  } catch {
    return null;
  }
}

function oklchToOklabCoords(
  oklch: ColorInfo["oklch"]
): [number, number, number] {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);
  return [oklch.l, a, b];
}

function oklabDistance(
  left: [number, number, number],
  right: [number, number, number]
): number {
  const dl = left[0] - right[0];
  const da = left[1] - right[1];
  const db = left[2] - right[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

interface ColorCluster {
  count: number;
  sumL: number;
  sumA: number;
  sumB: number;
}

function findNearestClusterIndex(
  centers: [number, number, number][],
  target: [number, number, number]
): number {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [index, center] of centers.entries()) {
    const distance = oklabDistance(center, target);
    if (distance <= MERGE_DISTANCE_OKLAB && distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function addColorToCluster(
  cluster: ColorCluster,
  color: ColorInfo
): [number, number, number] {
  const [l, a, b] = oklchToOklabCoords(color.oklch);
  const nextCount = cluster.count + color.count;

  cluster.count = nextCount;
  cluster.sumL += l * color.count;
  cluster.sumA += a * color.count;
  cluster.sumB += b * color.count;

  return [
    cluster.sumL / nextCount,
    cluster.sumA / nextCount,
    cluster.sumB / nextCount,
  ];
}

function clusterToColorInfo(
  cluster: ColorCluster,
  totalPixelsForPercentages: number
): ColorInfo | null {
  const l = cluster.sumL / cluster.count;
  const a = cluster.sumA / cluster.count;
  const b = cluster.sumB / cluster.count;

  try {
    const color = new Color("oklab", [l, a, b]);

    if (!color.inGamut("srgb")) {
      color.toGamut({ space: "srgb", method: "css" });
    }

    const srgb = color.to("srgb");
    const r = (srgb.coords[0] ?? 0) * 255;
    const g = (srgb.coords[1] ?? 0) * 255;
    const bVal = (srgb.coords[2] ?? 0) * 255;
    const hex = rgbToHex(r, g, bVal);

    const oklchColor = color.to("oklch");
    const oklchL = oklchColor.coords[0] ?? 0;
    const oklchC = oklchColor.coords[1] ?? 0;
    const oklchH = oklchColor.coords[2] ?? 0;
    const oklchString = `oklch(${(oklchL * 100).toFixed(2)}% ${oklchC.toFixed(4)} ${Number.isNaN(oklchH) ? "none" : oklchH.toFixed(2)})`;

    return {
      hex,
      oklch: { l: oklchL, c: oklchC, h: Number.isNaN(oklchH) ? 0 : oklchH },
      oklchString,
      count: cluster.count,
      percentage: (cluster.count / totalPixelsForPercentages) * 100,
    };
  } catch {
    return null;
  }
}

function mergeSimilarColors(
  colors: ColorInfo[],
  totalPixelsForPercentages: number
): ColorInfo[] {
  const clusters: ColorCluster[] = [];
  const clusterCenters: [number, number, number][] = [];

  for (const color of colors) {
    const coords = oklchToOklabCoords(color.oklch);
    const nearestIndex = findNearestClusterIndex(clusterCenters, coords);

    if (nearestIndex === -1) {
      clusters.push({
        count: color.count,
        sumL: coords[0] * color.count,
        sumA: coords[1] * color.count,
        sumB: coords[2] * color.count,
      });
      clusterCenters.push(coords);
      continue;
    }

    clusterCenters[nearestIndex] = addColorToCluster(
      clusters[nearestIndex],
      color
    );
  }

  const merged = clusters
    .map((cluster) => clusterToColorInfo(cluster, totalPixelsForPercentages))
    .filter((color): color is ColorInfo => color !== null);

  merged.sort((a, b) => b.count - a.count);
  return merged;
}

function determinePrimaryColor(colors: ColorInfo[]): ColorInfo | null {
  let bestIndex = -1;
  let bestWeight = -1;

  for (const [index, color] of colors.entries()) {
    const weight = getColorWeight(color);
    if (weight <= bestWeight) {
      continue;
    }

    bestIndex = index;
    bestWeight = weight;
  }

  if (bestIndex === -1) {
    return null;
  }

  colors[bestIndex] = { ...colors[bestIndex], isPrimary: true };
  return colors[bestIndex];
}

function isSkinTone(l: number, c: number, h: number): boolean {
  return (
    l >= SKIN_LIGHTNESS.min &&
    l <= SKIN_LIGHTNESS.max &&
    c >= SKIN_CHROMA.min &&
    c <= SKIN_CHROMA.max &&
    h >= SKIN_HUE.min &&
    h <= SKIN_HUE.max
  );
}

function isNeutral(c: number, l: number): boolean {
  return (
    c < NEUTRAL_CHROMA ||
    (c < NEUTRAL_CHROMA_EXTREME &&
      (l < NEUTRAL_LIGHTNESS_DARK || l > NEUTRAL_LIGHTNESS_LIGHT))
  );
}

function getLightnessScore(l: number): number {
  if (l >= LIGHTNESS_OPTIMAL.min && l <= LIGHTNESS_OPTIMAL.max) {
    return 1.0;
  }
  if (l >= LIGHTNESS_ACCEPTABLE.min && l <= LIGHTNESS_ACCEPTABLE.max) {
    return 0.7;
  }
  return 0.3;
}

function getColorWeight(color: ColorInfo): number {
  const { l, c, h } = color.oklch;

  const chromaMultiplier = c > MIN_CHROMA_MULTIPLIER ? (c * 8) ** 1.5 : 0.1;
  const lightnessScore = getLightnessScore(l);
  const skinPenalty = isSkinTone(l, c, h) ? 0.15 : 1.0;
  const neutralPenalty = isNeutral(c, l) ? 0.05 : 1.0;
  const accentBonus = c > ACCENT_CHROMA_THRESHOLD ? 2.0 : 1.0;

  return (
    color.percentage *
    chromaMultiplier *
    lightnessScore *
    skinPenalty *
    neutralPenalty *
    accentBonus
  );
}

export function analyzeImage(imageFile: File): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { colorSpace: "srgb" });

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      const { width, height } = getScaledDimensions(img.width, img.height);

      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const { colorCounts, validPixels } = countColors(imageData.data);

      if (validPixels === 0) {
        resolve({
          totalColors: 0,
          colors: [],
          totalPixelsAnalyzed: 0,
          primaryColor: null,
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const totalPixelsForPercentages = Math.max(validPixels, 1);
      const colors: ColorInfo[] = [];

      for (const value of colorCounts.values()) {
        const colorInfo = accumulatorToColorInfo(
          value,
          totalPixelsForPercentages
        );
        if (colorInfo) {
          colors.push(colorInfo);
        }
      }

      colors.sort((a, b) => b.count - a.count);
      const mergedColors = mergeSimilarColors(
        colors,
        totalPixelsForPercentages
      );
      const primaryColor = determinePrimaryColor(mergedColors);

      resolve({
        totalColors: mergedColors.length,
        colors: mergedColors.slice(0, MAX_COLORS),
        totalPixelsAnalyzed: validPixels,
        primaryColor,
      });

      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export function formatOklch(oklchVal: ColorInfo["oklch"]): string {
  const l = (oklchVal.l * 100).toFixed(2);
  const c = oklchVal.c.toFixed(4);
  const h = oklchVal.h.toFixed(2);
  return `oklch(${l}% ${c} ${h})`;
}

export function getOklchUrl(oklchVal: ColorInfo["oklch"]): string {
  const l = oklchVal.l.toFixed(4);
  const c = oklchVal.c.toFixed(4);
  const h = oklchVal.h.toFixed(2);
  return `https://oklch.com/#${l},${c},${h},100`;
}
