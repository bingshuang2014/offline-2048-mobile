# Database Migrations

This directory contains all database migrations for the expo-mobile app.

## Directory Structure

```
migrations/
├── README.md                          # This file
├── migration-system.ts                # Core migration engine
├── runner.ts                          # Migration runner utilities
├── index.ts                           # Migration registry
├── 001_initial_schema.ts              # Initial database schema
├── 002_example_migration.ts           # Example migrations (commented out)
└── 003_*.ts                           # Future migrations
```

## How Migrations Work

1. Each migration is defined in its own file (e.g., `001_initial_schema.ts`)
2. Migrations are automatically registered when imported
3. The `index.ts` file imports all migrations
4. The `runner.ts` provides utilities to run migrations
5. Migrations are tracked in the `__migrations` table

## Creating a New Migration

1. **Create a new file** with a three-digit prefix:
   ```bash
   touch src/lib/migrations/002_add_feature.ts
   ```

2. **Define your migration**:
   ```typescript
   import { registerMigration } from './migration-system';

   registerMigration({
     version: '1.1.0',
     description: 'Add new feature',
     critical: false,
     up: [
       `CREATE TABLE new_table (...)`,
     ],
     down: [
       `DROP TABLE new_table`,
     ],
   });
   ```

3. **Register in index.ts**:
   ```typescript
   import './002_add_feature';
   ```

4. **Test**:
   ```typescript
   import { migrateDatabase } from './runner';
   await migrateDatabase();
   ```

## Migration File Naming

Use three-digit prefix followed by descriptive name:
- `001_initial_schema.ts`
- `002_add_haptic_support.ts`
- `003_add_achievements.ts`
- `004_refactor_settings.ts`

## Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

## Testing

Run migrations in development before deploying:

```typescript
import { resetDatabase, migrateDatabase } from './runner';

// Reset and run all migrations
await resetDatabase();
await migrateDatabase();
```

## Rollback

If a migration has `down` SQL, you can rollback:

```typescript
import { rollbackTo } from './index';

const db = await openDatabase();
await rollbackTo(db, '1.0.0'); // Rollback to version 1.0.0
```

## Important Notes

- ⚠️ Always test migrations before deploying
- ⚠️ Always provide `down` SQL for rollback
- ⚠️ Use transactions for data migrations
- ⚠️ Mark breaking changes as `critical: true`
- ⚠️ Backup before critical migrations (automatic)

## See Also

- [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) - Comprehensive migration guide
- [001_initial_schema.ts](./001_initial_schema.ts) - Example of initial schema
- [002_example_migration.ts](./002_example_migration.ts) - Example migrations
