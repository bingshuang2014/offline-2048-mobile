/**
 * Services Layer - Unified export for all service modules
 *
 * This module provides a single entry point for importing all services.
 * Services handle platform detection and route to appropriate backends:
 * - Web: Next.js API routes
 * - Native: Capacitor SQLite database
 */

// Player Service
export * from "./player-service";

// Game Service
export * from "./game-service";

// Settings Service
export * from "./settings-service";

// History Service
export * from "./history-service";

// Data Export/Import Service
export * from "./data-export-service";
