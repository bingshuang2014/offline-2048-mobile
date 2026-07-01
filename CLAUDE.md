# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个 React Native Expo 移动应用，实现离线 2048 益智游戏。应用支持多玩家、两种难度模式（4x4 简单模式、3x3 困难无尽模式）、季节性主题，并使用 SQLite 在本地完全离线运行。

## 开发命令

### 运行应用
```bash
npm start              # 启动 Expo 开发服务器
npm run android        # 在 Android 设备/模拟器上运行
npm run ios            # 在 iOS 设备/模拟器上运行
npm run web            # 在浏览器中运行
```

### 构建
```bash
npm run prebuild          # 从 Expo 配置生成原生代码
npm run prebuild:clean    # 清理并重新生成原生代码
```

### 测试
```bash
npm test                 # 运行所有测试（一次）
npm run test:watch       # 以监视模式运行测试
npm run test:coverage    # 生成测试覆盖率报告
npm run test:ci          # 在 CI 模式下运行测试
```

运行单个测试文件：`npm test -- path/to/test.test.tsx`

## 架构

### 路由系统（Expo Router）
应用使用 `expo-router` 的基于文件的路由。路由在 `app/` 目录中定义：
- `app/_layout.tsx` - 根布局，在渲染前处理数据库初始化
- `app/index.tsx` - 主页/玩家设置屏幕
- `app/game.tsx` - 游戏棋盘屏幕
- `app/players.tsx` - 玩家管理屏幕
- `app/history.tsx` - 游戏历史屏幕

所有屏幕在 `Stack` 导航中渲染，禁用标题栏（`headerShown: false`）。

### 数据库层

应用使用 **expo-sqlite** 进行本地持久化，配有自定义迁移系统：

**关键文件：**
- `src/lib/db-expo.ts` - Expo SQLite 适配器（query、execute、executeTransaction）
- `src/lib/migrations/` - 数据库架构迁移及版本跟踪
- `src/lib/migrations/index.ts` - 导入时注册所有迁移
- `src/lib/migrations/runner.ts` - 迁移执行工具

**迁移工作原理：**
1. 每个迁移文件通过 `registerMigration()` 自行注册
2. 迁移记录在 `__migrations` 表中跟踪
3. 应用启动时，待处理的迁移通过 `initSchema()` 自动运行
4. 始终使用三位数字前缀添加新迁移：`004_feature_name.ts`

**架构表：**
- `players` - 玩家账户（昵称、生肖头像 ID）
- `games` - 游戏记录（player_id、难度、分数、游戏状态等）
- `settings` - 每个玩家的设置（主题、颜色、声音、触觉反馈）
- `zodiac_avatars` - 12 个内置生肖头像
- `__migrations` - 迁移版本跟踪

### 服务层

`src/services/` 中的服务提供业务逻辑并抽象数据库操作：
- `player-service.ts` - 玩家 CRUD、活跃玩家管理
- `game-service.ts` - 游戏创建、更新、完成、活跃游戏检索
- `settings-service.ts` - 每个玩家的设置 CRUD
- `history-service.ts` - 游戏历史查询（带排序和分页）

服务使用 `src/lib/db-expo.ts` 适配器进行数据库操作。

### 游戏逻辑

`src/lib/game-logic.ts` 中的核心游戏机制：
- `move()` - 沿某个方向执行移动
- `isGameOver()` - 检查胜负条件
- `GameState` 类型 - 网格状态（方块、分数、是否获胜、是否结束）
- 4x4 简单模式：达到 2048 方块获胜
- 3x3 困难模式：无尽模式，无获胜条件

### 状态管理

应用使用 **React Context** 进行全局状态管理：
- `src/context/GameContext.tsx` - 中央状态提供者
  - 玩家状态（currentPlayer、personalBest）
  - 游戏状态（currentGame、currentDifficulty、elapsedTime、isPaused）
  - 设置状态（主题、颜色、声音/触觉启用）
  - 对话框状态（结果、重启、设置、历史、玩家信息的模态框）
- 钩子：`useGameContext()`、`usePlayer()`、`useGameState()`、`useGameSettings()`、`useDialogs()`

Context 在挂载时通过 `refreshGameInit()` 从服务加载初始数据。

### UI 组件

- `src/components/` - 功能组件（游戏棋盘、对话框、设置）
- `src/components/ui/` - 可复用的 UI 基础组件（按钮、对话框、输入框）

所有屏幕都在 `app/` 目录中，不在 `src/screens/` 中（已弃用）。

### 路径别名

TypeScript 路径映射配置为：`@/*` → `src/`

导入方式：`import { foo } from '@/lib/db-expo'`

## 平台特定说明

- 这是一个**仅限移动端**的代码库（通过 Expo 支持 iOS/Android）
- Web 支持存在但不是主要目标
- 仅限竖屏方向（在 app.json 中锁定）
- 使用 expo-sqlite（不是父项目中的 capacitor-sqlite）

## 关键约定

1. **操作前始终初始化数据库** - 数据库设置在 `app/_layout.tsx` 中，在任何屏幕渲染之前完成
2. **架构变更使用迁移** - 永远不要修改现有迁移；创建递增版本的新迁移
3. **通过服务层访问数据** - 不要直接从组件查询数据库；使用服务层
4. **游戏状态使用 Context** - 所有游戏相关状态使用 GameContext，不要使用本地 useState
5. **对话框通过 Context 管理** - 所有对话框可见性通过 GameContext 对话框状态管理
6. **不可变性** - 遵循项目的不可变模式（创建新对象，不要修改）

## 重要文件

| 文件 | 用途 |
|------|---------|
| `app/_layout.tsx` | 应用初始化、数据库设置、路由 |
| `src/context/GameContext.tsx` | 全局状态、对话框管理 |
| `src/lib/db-expo.ts` | 数据库适配器（expo-sqlite） |
| `src/lib/game-logic.ts` | 核心游戏机制 |
| `src/lib/migrations/runner.ts` | 迁移执行 |
| `src/services/index.ts` | 服务导出 |
| `app/game.tsx` | 主游戏屏幕（带滑动手势） |
