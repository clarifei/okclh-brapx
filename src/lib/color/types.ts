export interface ColorInfo {
  hex: string;
  oklch: { l: number; c: number; h: number };
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
