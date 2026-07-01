/**
 * Database initialization functions
 * Ensures required seed data is present when the database is first accessed
 */
/* eslint-disable no-console */

import { getDatabase } from "./db";

/**
 * 12 zodiac avatars data
 * These are the built-in cartoon avatars available for player selection
 */
const ZODIAC_AVATARS = [
  { id: 1, name: "鼠", imagePath: "/avatars/rat.png", isBuiltin: 1 },
  { id: 2, name: "牛", imagePath: "/avatars/ox.png", isBuiltin: 1 },
  { id: 3, name: "虎", imagePath: "/avatars/tiger.png", isBuiltin: 1 },
  { id: 4, name: "兔", imagePath: "/avatars/rabbit.png", isBuiltin: 1 },
  { id: 5, name: "龙", imagePath: "/avatars/dragon.png", isBuiltin: 1 },
  { id: 6, name: "蛇", imagePath: "/avatars/snake.png", isBuiltin: 1 },
  { id: 7, name: "马", imagePath: "/avatars/horse.png", isBuiltin: 1 },
  { id: 8, name: "羊", imagePath: "/avatars/goat.png", isBuiltin: 1 },
  { id: 9, name: "猴", imagePath: "/avatars/monkey.png", isBuiltin: 1 },
  { id: 10, name: "鸡", imagePath: "/avatars/rooster.png", isBuiltin: 1 },
  { id: 11, name: "狗", imagePath: "/avatars/dog.png", isBuiltin: 1 },
  { id: 12, name: "猪", imagePath: "/avatars/pig.png", isBuiltin: 1 },
];

/**
 * Flag to track if initialization has been attempted
 * Prevents redundant initialization checks during the same session
 */
let initializationAttempted = false;

/**
 * Initialize zodiac avatars in the database
 *
 * This function checks if the zodiac_avatars table is empty and populates it
 * with the 12 built-in zodiac cartoon avatars. Uses INSERT OR IGNORE to ensure
 * idempotency - calling this multiple times won't cause duplicate entries.
 *
 * The initialization is performed automatically on the first call to getDatabase(),
 * ensuring that all API routes have access to the required avatar data.
 *
 * @returns The number of avatars in the database after initialization
 */
export function initializeZodiacAvatars(): number {
  // Skip if we've already attempted initialization in this session
  if (initializationAttempted) {
    const db = getDatabase();
    const result = db.prepare("SELECT COUNT(*) as count FROM zodiac_avatars").get() as {
      count: number;
    };
    return result.count;
  }

  initializationAttempted = true;
  const db = getDatabase();

  try {
    // Check if table already has data
    const countResult = db.prepare("SELECT COUNT(*) as count FROM zodiac_avatars").get() as {
      count: number;
    };

    if (countResult.count > 0) {
      // Table already populated, return existing count
      return countResult.count;
    }

    // Table is empty, insert the 12 zodiac avatars
    const insertAvatar = db.prepare(`
      INSERT OR IGNORE INTO zodiac_avatars (id, name, image_path, is_builtin)
      VALUES (@id, @name, @imagePath, @isBuiltin)
    `);

    // Use a transaction for atomic insertion
    const insertMany = db.transaction((avatars) => {
      for (const avatar of avatars) {
        insertAvatar.run(avatar);
      }
    });

    insertMany(ZODIAC_AVATARS);

    // Verify the insertion
    const verifyResult = db.prepare("SELECT COUNT(*) as count FROM zodiac_avatars").get() as {
      count: number;
    };


    return verifyResult.count;
  } catch (error) {
    console.error("Failed to initialize zodiac avatars:", error);
    throw error;
  }
}

/**
 * Ensure all required database seed data is present
 * Call this function after database connection is established
 *
 * Currently initializes:
 * - Zodiac avatars (12 built-in cartoon avatars)
 *
 * @returns Object containing initialization status
 */
export function initializeDatabaseSeedData(): {
  zodiacAvatarsCount: number;
  success: boolean;
} {
  try {
    const zodiacAvatarsCount = initializeZodiacAvatars();
    return {
      zodiacAvatarsCount,
      success: true,
    };
  } catch (error) {
    console.error("Database seed data initialization failed:", error);
    return {
      zodiacAvatarsCount: 0,
      success: false,
    };
  }
}
