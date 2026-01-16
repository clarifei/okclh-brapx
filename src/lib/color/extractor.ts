import Color from "colorjs.io";
import type { AnalysisResult, ColorInfo } from "./types";

const MAX_IMAGE_SIZE = 600;
const MAX_COLORS = 60;
const QUANTIZE_FACTOR = 12;
const MERGE_DISTANCE = 0.02;
const MIN_ALPHA = 128;

const SKIN_TONES = { l: [0.35, 0.85], c: [0.02, 0.16], h: [10, 90] };
const LIGHTNESS = { optimal: [0.35, 0.75], acceptable: [0.2, 0.85] };
const NEUTRAL = {
  chroma: 0.03,
  chromaExtreme: 0.05,
  lightDark: 0.15,
  lightLight: 0.92,
};
const ACCENT = { chroma: 0.12, chromaMin: 0.05 };

interface ColorBucket {
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

function getQuantizedKey(r: number, g: number, b: number): string {
  const q = QUANTIZE_FACTOR;
  return `${Math.floor(r / q) * q},${Math.floor(g / q) * q},${Math.floor(b / q) * q}`;
}

function scaleDimensions(width: number, height: number) {
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

function addPixel(
  buckets: Map<string, ColorBucket>,
  r: number,
  g: number,
  b: number
): void {
  const key = getQuantizedKey(r, g, b);
  const bucket = buckets.get(key);

  if (bucket) {
    bucket.count++;
    bucket.sumR += r;
    bucket.sumG += g;
    bucket.sumB += b;
  } else {
    buckets.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
  }
}

function countPixels(pixels: Uint8ClampedArray): {
  buckets: Map<string, ColorBucket>;
  validPixels: number;
} {
  const buckets = new Map<string, ColorBucket>();
  let validPixels = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < MIN_ALPHA) {
      continue;
    }

    validPixels++;
    addPixel(buckets, pixels[i], pixels[i + 1], pixels[i + 2]);
  }

  return { buckets, validPixels };
}

function bucketToColor(
  bucket: ColorBucket,
  totalPixels: number
): ColorInfo | null {
  const avgR = Math.round(bucket.sumR / bucket.count);
  const avgG = Math.round(bucket.sumG / bucket.count);
  const avgB = Math.round(bucket.sumB / bucket.count);
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
      count: bucket.count,
      percentage: (bucket.count / totalPixels) * 100,
    };
  } catch {
    return null;
  }
}

function oklchToOklab(oklch: ColorInfo["oklch"]): [number, number, number] {
  const hRad = (oklch.h * Math.PI) / 180;
  return [oklch.l, oklch.c * Math.cos(hRad), oklch.c * Math.sin(hRad)];
}

function distance(
  left: [number, number, number],
  right: [number, number, number]
): number {
  const [dl, da, db] = left.map((v, i) => v - right[i]);
  return Math.sqrt(dl * dl + da * da + db * db);
}

interface ColorCluster {
  count: number;
  sumL: number;
  sumA: number;
  sumB: number;
}

function findClosestCluster(
  centers: [number, number, number][],
  target: [number, number, number]
): number {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [index, center] of centers.entries()) {
    const d = distance(center, target);
    if (d <= MERGE_DISTANCE && d < bestDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function updateCluster(
  cluster: ColorCluster,
  color: ColorInfo
): [number, number, number] {
  const [l, a, b] = oklchToOklab(color.oklch);
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

function clusterToColor(
  cluster: ColorCluster,
  totalPixels: number
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
      percentage: (cluster.count / totalPixels) * 100,
    };
  } catch {
    return null;
  }
}

function mergeColors(colors: ColorInfo[], totalPixels: number): ColorInfo[] {
  const clusters: ColorCluster[] = [];
  const centers: [number, number, number][] = [];

  for (const color of colors) {
    const coords = oklchToOklab(color.oklch);
    const nearestIndex = findClosestCluster(centers, coords);

    if (nearestIndex === -1) {
      clusters.push({
        count: color.count,
        sumL: coords[0] * color.count,
        sumA: coords[1] * color.count,
        sumB: coords[2] * color.count,
      });
      centers.push(coords);
    } else {
      centers[nearestIndex] = updateCluster(clusters[nearestIndex], color);
    }
  }

  const merged = clusters
    .map((cluster) => clusterToColor(cluster, totalPixels))
    .filter((c): c is ColorInfo => c !== null);

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
  const {
    l: [lMin, lMax],
    c: [cMin, cMax],
    h: [hMin, hMax],
  } = SKIN_TONES;
  return (
    l >= lMin && l <= lMax && c >= cMin && c <= cMax && h >= hMin && h <= hMax
  );
}

function isNeutral(c: number, l: number): boolean {
  return (
    c < NEUTRAL.chroma ||
    (c < NEUTRAL.chromaExtreme &&
      (l < NEUTRAL.lightDark || l > NEUTRAL.lightLight))
  );
}

function getLightnessScore(l: number): number {
  if (l >= LIGHTNESS.optimal[0] && l <= LIGHTNESS.optimal[1]) {
    return 1.0;
  }
  if (l >= LIGHTNESS.acceptable[0] && l <= LIGHTNESS.acceptable[1]) {
    return 0.7;
  }
  return 0.3;
}

function getColorWeight(color: ColorInfo): number {
  const { l, c, h } = color.oklch;

  const chromaMultiplier = c > ACCENT.chromaMin ? (c * 8) ** 1.5 : 0.1;
  const lightnessScore = getLightnessScore(l);
  const skinPenalty = isSkinTone(l, c, h) ? 0.15 : 1.0;
  const neutralPenalty = isNeutral(c, l) ? 0.05 : 1.0;
  const accentBonus = c > ACCENT.chroma ? 2.0 : 1.0;

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
      const { width, height } = scaleDimensions(img.width, img.height);

      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const { buckets, validPixels } = countPixels(imageData.data);

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

      const totalPixels = Math.max(validPixels, 1);
      const colors: ColorInfo[] = [];

      for (const bucket of buckets.values()) {
        const colorInfo = bucketToColor(bucket, totalPixels);
        if (colorInfo) {
          colors.push(colorInfo);
        }
      }

      colors.sort((a, b) => b.count - a.count);
      const mergedColors = mergeColors(colors, totalPixels);
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

export function getOklchUrl(oklch: ColorInfo["oklch"]): string {
  const { l, c, h } = oklch;
  return `https://oklch.com/#${l.toFixed(4)},${c.toFixed(4)},${h.toFixed(2)},100`;
}
