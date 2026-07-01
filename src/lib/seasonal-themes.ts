// Seasonal theme color palettes for the 2048 game
// Each theme defines colors for tiles, background, and accents

export interface SeasonalThemeColors {
  name: string;
  nameEn: string;
  tileColors: Record<number, string>; // tile value -> background color
  background: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  // UI Colors
  primaryButton: string; // 主要按钮背景色
  primaryButtonText: string; // 主要按钮文字颜色
  borderColor: string; // 边框颜色
  secondaryBorderColor: string; // 次要边框颜色
  textPrimary: string; // 主要文字颜色
  textSecondary: string; // 次要文字颜色
  textTertiary: string; // 第三级文字颜色
  containerBackground: string; // 容器背景色（卡片、弹窗等）
  containerBackgroundOpaque: string; // 不透明容器背景
  avatarBackground: string; // 头像背景色
  logoGridBackground: string; // Logo网格背景色
  disabledButton: string; // 禁用按钮背景色
}

// Spring theme: fresh greens and cherry blossom pinks
// 🌸 春天：嫩绿、樱花粉、生机勃勃
export const springTheme: SeasonalThemeColors = {
  name: "春",
  nameEn: "Spring",
  tileColors: {
    2: "#FFF1F0", // very light pink-white (spring mist)
    4: "#FFD6D9", // light cherry blossom pink
    8: "#FFB7C5", // cherry blossom pink
    16: "#FF9EAA", // medium pink
    32: "#FF8598", // deeper pink
    64: "#D4F5D4", // pale green (new leaves)
    128: "#A7E3A7", // light green
    256: "#7CD67C", // medium green
    512: "#5BC95B", // vibrant green
    1024: "#3CB371", // medium sea green
    2048: "#FFE5E6", // light pink (victory - cherry blossom)
    4096: "#2E8B57", // sea green
    8192: "#1E5631", // dark green
  },
  background: "#FFF9F5", // very light warm pink-white
  accent: "#FFB7C5", // cherry blossom pink
  gradientFrom: "rgb(255, 214, 217)", // medium light pink (heavier)
  gradientTo: "rgb(255, 249, 245)", // light pink-white (lighter)
  // UI Colors
  primaryButton: "#FFD6D9", // 浅樱花粉（按钮背景）
  primaryButtonText: "#4A5D4A", // 深绿灰（按钮文字）
  borderColor: "#FFD6D9", // 浅樱花粉（主要边框）
  secondaryBorderColor: "#FFE5E6", // 极浅粉（次要边框）
  textPrimary: "#4A5D4A", // 深绿灰（主要文字）
  textSecondary: "#7A8B7A", // 中绿灰（次要文字）
  textTertiary: "#A7E3A7", // 浅绿（第三级文字）
  containerBackground: "rgba(255, 241, 240, 0.95)", // 樱花粉白半透明
  containerBackgroundOpaque: "#FFF1F0", // 樱花粉白
  avatarBackground: "#FFE5E6", // 极浅樱花粉（头像背景）
  logoGridBackground: "#7CD67C", // 中绿（Logo网格）
  disabledButton: "#E0D0D0", // 浅灰粉（禁用按钮）
};

// Summer theme: vibrant fresh greens
// ☀️ 夏天：鲜绿、清新、活力四射
export const summerTheme: SeasonalThemeColors = {
  name: "夏",
  nameEn: "Summer",
  tileColors: {
    2: "#F0FFF4", // very light green-white (fresh)
    4: "#D7F5DB", // light green
    8: "#90EE90", // light green (vibrant)
    16: "#7CD67C", // medium green
    32: "#5BC95B", // vibrant green
    64: "#4CAF50", // fresh green
    128: "#45A049", // medium-dark green
    256: "#3CB371", // medium sea green
    512: "#2E8B57", // sea green
    1024: "#228B22", // forest green
    2048: "#98FB98", // pale green (victory - fresh leaves)
    4096: "#1E5631", // dark green
    8192: "#0F3D1F", // very dark green
  },
  background: "#F7FFFA", // very light mint white
  accent: "#7CD67C", // medium green
  gradientFrom: "rgb(144, 238, 144)", // vibrant green (heavier)
  gradientTo: "rgb(247, 255, 250)", // light mint (lighter)
  // UI Colors
  primaryButton: "#90EE90", // 鲜绿色（按钮背景）
  primaryButtonText: "#1A3A1A", // 深绿（按钮文字）
  borderColor: "#90EE90", // 鲜绿色（主要边框）
  secondaryBorderColor: "#D7F5DB", // 浅绿（次要边框）
  textPrimary: "#1A3A1A", // 深绿（主要文字）
  textSecondary: "#4A6B4A", // 中绿灰（次要文字）
  textTertiary: "#7CD67C", // 鲜绿（第三级文字）
  containerBackground: "rgba(240, 255, 244, 0.95)", // 薄荷白半透明
  containerBackgroundOpaque: "#F0FFF4", // 薄荷白
  avatarBackground: "#D7F5DB", // 浅绿（头像背景）
  logoGridBackground: "#5BC95B", // 鲜绿（Logo网格）
  disabledButton: "#B5E0B5", // 浅绿灰（禁用按钮）
};

// Autumn theme: warm golden oranges and harvest browns
// 🍂 秋天：金黄、橙红、丰收时节
export const autumnTheme: SeasonalThemeColors = {
  name: "秋",
  nameEn: "Autumn",
  tileColors: {
    2: "#FFFBEB", // very light warm yellow (autumn mist)
    4: "#FDE68A", // light gold
    8: "#FBBF24", // golden yellow
    16: "#F59E0B", // amber/orange
    32: "#F97316", // bright orange
    64: "#EA580C", // dark orange
    128: "#DC2626", // red (maple leaf)
    256: "#B91C1C", // dark red
    512: "#92400E", // brown (tree bark)
    1024: "#78350F", // dark brown
    2048: "#FCD34D", // light gold (victory - harvest)
    4096: "#5B3A1A", // darker brown
    8192: "#3D2612", // very dark brown
  },
  background: "#FFFAF0", // very light warm cream
  accent: "#F59E0B", // amber/orange
  gradientFrom: "rgb(253, 230, 138)", // medium light gold (heavier)
  gradientTo: "rgb(255, 250, 240)", // light warm cream (lighter)
  // UI Colors
  primaryButton: "#FDE68A", // 浅金黄（按钮背景）
  primaryButtonText: "#5C4033", // 深棕（按钮文字）
  borderColor: "#FDE68A", // 浅金黄（主要边框）
  secondaryBorderColor: "#FBBF24", // 金黄（次要边框）
  textPrimary: "#5C4033", // 深棕（主要文字）
  textSecondary: "#8B6F5C", // 中棕灰（次要文字）
  textTertiary: "#D4A574", // 浅棕（第三级文字）
  containerBackground: "rgba(255, 251, 235, 0.95)", // 浅金黄半透明
  containerBackgroundOpaque: "#FFFBEB", // 浅金黄
  avatarBackground: "#FDE68A", // 浅金黄（头像背景）
  logoGridBackground: "#92400E", // 棕色（Logo网格）
  disabledButton: "#E8D5B0", // 浅棕灰（禁用按钮）
};

// Winter theme: ice blues, silver grays, cool whites
// ❄️ 冬天：冰蓝、银灰、纯净白
export const winterTheme: SeasonalThemeColors = {
  name: "冬",
  nameEn: "Winter",
  tileColors: {
    2: "#F8FAFC", // very light slate (ice white)
    4: "#BAE6FD", // light sky blue (darker for contrast)
    8: "#7DD3FC", // sky blue
    16: "#38BDF8", // medium sky blue
    32: "#0EA5E9", // sky blue
    64: "#CBD5E1", // light silver gray
    128: "#94A3B8", // medium silver gray
    256: "#64748B", // slate gray
    512: "#475569", // dark slate gray
    1024: "#334155", // darker slate gray
    2048: "#E0F2FE", // ice blue (victory - frozen lake)
    4096: "#1E293B", // dark slate
    8192: "#0F172A", // very dark slate
  },
  background: "#F1F5F9", // very light slate blue
  accent: "#7DD3FC", // sky blue
  gradientFrom: "rgb(186, 230, 253)", // medium light blue (heavier)
  gradientTo: "rgb(241, 245, 249)", // light slate (lighter)
  // UI Colors
  primaryButton: "#E0F2FE", // 雪白（按钮背景）
  primaryButtonText: "#475569", // 深灰（按钮文字）
  borderColor: "#BAE6FD", // 浅雪白（主要边框）
  secondaryBorderColor: "#E0F2FE", // 雪白（次要边框）
  textPrimary: "#475569", // 深蓝灰（主要文字）
  textSecondary: "#64748B", // 蓝灰（次要文字）
  textTertiary: "#94A3B8", // 浅蓝灰（第三级文字）
  containerBackground: "rgba(248, 250, 252, 0.95)", // 冰白半透明
  containerBackgroundOpaque: "#F8FAFC", // 冰白
  avatarBackground: "#E0F2FE", // 浅冰蓝（头像背景）
  logoGridBackground: "#7DD3FC", // 天空蓝（Logo网格）
  disabledButton: "#CBD5E1", // 浅灰蓝（禁用按钮）
};

// Get theme by season ID
export function getSeasonalTheme(seasonId: string): SeasonalThemeColors {
  switch (seasonId) {
    case "spring":
      return springTheme;
    case "summer":
      return summerTheme;
    case "autumn":
      return autumnTheme;
    case "winter":
      return winterTheme;
    default:
      return winterTheme; // default to winter (冬)
  }
}

// Get tile color for a specific tile value in a season
export function getTileColor(
  tileValue: number,
  seasonId: string,
  customTileColors?: Record<number, string> | null
): string {
  // Check custom colors first
  if (customTileColors && customTileColors[tileValue]) {
    return customTileColors[tileValue];
  }

  const theme = getSeasonalTheme(seasonId);
  return theme.tileColors[tileValue] ?? theme.tileColors[2] ?? "#F0FFF0"; // default to 2's color or spring 2
}

// Get text color for a tile (black on light tiles, white on dark tiles)
export function getTileTextColor(
  tileValue: number,
  seasonId: string,
  customTileColors?: Record<number, string> | null,
  customTextColor?: string | null
): string {
  // Use custom text color if provided
  if (customTextColor) {
    return customTextColor;
  }

  // Get the tile color
  let tileColor: string;
  if (customTileColors && customTileColors[tileValue]) {
    tileColor = customTileColors[tileValue];
  } else {
    const theme = getSeasonalTheme(seasonId);
    tileColor = theme.tileColors[tileValue] ?? theme.tileColors[2] ?? "#F0FFF0";
  }

  // Determine if background is light or dark
  // Simple heuristic: check if color starts with a dark hex value
  const darkColors = [
    // Winter dark colors
    "#0F172A", "#1E293B", "#334155", "#475569",
    // Spring dark colors
    "#1E5631", "#2E8B57", "#3CB371", "#4A5D4A",
    // Summer dark colors
    "#0F3D1F", "#1E5631", "#228B22", "#2E8B57", "#1A3A1A",
    // Autumn dark colors
    "#3D2612", "#5B3A1A", "#78350F", "#92400E", "#5C4033",
    // Common dark colors
    "#8B0000", "#0000FF", "#FF4500", "#B8860B", "#8B4513",
    "#B22222", "#654321", "#2F4F4F", "#00BFFF", "#87CEEB",
  ];

  if (darkColors.includes(tileColor)) {
    return "#FFFFFF"; // white text on dark tiles
  }
  return "#000000"; // black text on light tiles
}

// Get all available themes
export function getAllSeasonalThemes(): SeasonalThemeColors[] {
  return [springTheme, summerTheme, autumnTheme, winterTheme];
}

// Helper to get theme colors for UI styling
export function getThemeUIColors(seasonId: string) {
  const theme = getSeasonalTheme(seasonId);
  return {
    buttonBackground: theme.primaryButton,
    buttonText: theme.primaryButtonText,
    primaryButtonText: theme.primaryButtonText, // Add this for backward compatibility
    border: theme.borderColor,
    secondaryBorder: theme.secondaryBorderColor,
    text: theme.textPrimary,
    textSecondary: theme.textSecondary,
    textTertiary: theme.textTertiary,
    containerBg: theme.containerBackground,
    containerBgOpaque: theme.containerBackgroundOpaque,
    avatarBg: theme.avatarBackground,
    logoGridBg: theme.logoGridBackground,
    disabledBg: theme.disabledButton,
  };
}
