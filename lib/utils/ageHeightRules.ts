// lib/utils/ageHeightRules.ts
// Central utility for age & height rules (mirrors Flutter logic)
export const MIN_MALE_AGE = 21;
export const MIN_FEMALE_AGE = 18;

// Filter‑specific limits (viewer searches opposite gender)
export const filterMinAge = (viewerGender: 'male' | 'female'): number =>
  viewerGender === 'male' ? 18 : 21;
export const filterMaxAge = (viewerGender: 'male' | 'female'): number =>
  viewerGender === 'male' ? 70 : 80;

// Height labels from 4 ft 1 in to 7 ft 0 in (1‑inch steps)
export const generateHeightLabels = (): string[] => {
  const labels: string[] = [];
  for (let ft = 4; ft <= 7; ft++) {
    const startIn = ft === 4 ? 1 : 0;
    const endIn = ft === 7 ? 0 : 11;
    for (let inch = startIn; inch <= endIn; inch++) {
      labels.push(`${ft}'${inch}\"`);
    }
  }
  return labels;
};

// Convert "4'5\"" → centimeters (for API payloads)
export const labelToCm = (label: string): number => {
  const match = label.match(/(\d+)'(\d+)\"/);
  if (!match) return 0;
  const ft = parseInt(match[1], 10);
  const inch = parseInt(match[2], 10);
  return ft * 30.48 + inch * 2.54;
};

export const MIN_HEIGHT_CM = labelToCm("4'1\""); // ≈124.46 cm
export const MAX_HEIGHT_CM = labelToCm("7'0\""); // ≈213.36 cm

// For UI that uses decimal feet values
export const MIN_HEIGHT_FT = 4 + 1 / 12; // 4.0833… ft
export const MAX_HEIGHT_FT = 7; // 7 ft
