import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// Players table - stores player accounts with epitaph and avatar
export const players = sqliteTable(
  "players",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    epitaph: text("epitaph").notNull().unique(),
    avatarId: integer("avatar_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("players_epitaph_idx").on(table.epitaph)]
);

// Games table - stores game history and auto-save states
export const games = sqliteTable(
  "games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    difficulty: text("difficulty").notNull(), // 'easy' or 'hard'
    gridSize: integer("grid_size").notNull(), // 3, 4, or 5
    score: integer("score").notNull().default(0),
    timeElapsed: integer("time_elapsed").notNull().default(0), // seconds
    gameState: text("game_state"), // JSON serialized game board state
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    lastMoveAt: integer("last_move_at", { mode: "timestamp" }),
    isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false), // 0 = false, 1 = true
  },
  (table) => [
    index("games_player_id_idx").on(table.playerId),
    index("games_difficulty_idx").on(table.difficulty),
    index("games_score_idx").on(table.score),
  ]
);

// Settings table - stores player preferences and customization
export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    theme: text("theme").notNull().default("light"), // 'light' or 'dark'
    seasonalTheme: text("seasonal_theme").notNull().default("spring"), // 'spring', 'summer', 'autumn', 'winter'
    customTileColors: text("custom_tile_colors"), // JSON array of custom colors
    customBackgroundColor: text("custom_background_color"),
    customTextColor: text("custom_text_color"),
    cardOpacity: integer("card_opacity").notNull().default(14), // 0-100, default 14%
    soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull().default(true),
    hapticEnabled: integer("haptic_enabled", { mode: "boolean" }).notNull().default(true),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index("settings_player_id_idx").on(table.playerId)]
);

// Zodiac avatars table - 12 built-in zodiac cartoon avatars
export const zodiacAvatars = sqliteTable(
  "zodiac_avatars",
  {
    id: integer("id").primaryKey(), // 1 to 12
    name: text("name").notNull(), // Chinese zodiac name (鼠, 牛, 虎, etc.)
    imagePath: text("image_path").notNull(), // path to cartoon avatar image
    isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(true), // all 12 are built-in
  },
  (table) => [index("zodiac_avatars_id_idx").on(table.id)]
);

// Type exports for TypeScript
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type ZodiacAvatar = typeof zodiacAvatars.$inferSelect;
export type NewZodiacAvatar = typeof zodiacAvatars.$inferInsert;
