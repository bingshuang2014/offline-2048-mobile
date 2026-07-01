# 离线2048 - 移动端

一个完全离线的经典2048益智游戏，支持Android和iOS。

## 功能特性

### 游戏模式
- **简单模式**：3x3、4x4、5x5 三种网格尺寸，达到2048获胜
- **无尽模式**：3x3、4x4、5x5 三种网格尺寸，无尽挑战

### 玩家管理
- 使用昵称作为唯一标识符
- 12种生肖卡通头像可选
- 支持多个玩家在同一设备上切换

### 游戏数据
- 实时分数显示
- 个人最佳记录（按难度和网格尺寸分别统计）
- 游戏计时
- 完整的游戏历史记录

### 个性化定制
- **主题切换**：浅色/深色主题
- **季节主题**：春、夏、秋、冬四种预设主题
- **自定义颜色**：方块颜色、背景颜色、文字颜色
- **卡片透明度**：0-100%可调

### 音效
- 移动、合并、游戏结束、胜利音效
- 可在设置中开启/关闭

## 技术栈

- **框架**: React Native + Expo SDK 55
- **路由**: Expo Router
- **数据库**: expo-sqlite（本地SQLite）
- **状态管理**: React Context
- **测试**: Jest + React Native Testing Library

## 安装和运行

### 环境要求
- Node.js 18+
- npm

### 安装依赖
```bash
npm install --legacy-peer-deps
```

### 启动开发服务器
```bash
# Windows
start-app.bat

# 或手动启动
npx expo start --clear
```

### 运行测试
```bash
npm test
```

## 项目结构

```
expo-mobile/
├── app/                    # Expo Router 页面
│   ├── _layout.tsx        # 根布局
│   ├── index.tsx          # 首页/玩家设置
│   ├── game.tsx           # 游戏界面
│   ├── players.tsx        # 玩家管理
│   └── history.tsx        # 游戏历史
├── src/
│   ├── components/        # React 组件
│   │   └── dialogs/      # 对话框组件
│   ├── context/           # React Context
│   ├── lib/               # 工具函数
│   │   ├── db-expo.ts    # 数据库适配器
│   │   ├── game-logic.ts # 游戏逻辑
│   │   └── migrations/   # 数据库迁移
│   └── services/          # 数据访问层
├── __tests__/             # 测试文件
├── assets/                # 静态资源
└── package.json
```

## 构建 APK

```bash
# 构建调试版
build-apk.bat

# 构建发布版
build-apk-production.bat
```

## 数据库

应用使用 expo-sqlite 进行本地数据存储，支持自动迁移。

### 迁移系统
- 迁移文件在 `src/lib/migrations/` 目录
- 使用三位数字前缀命名：`001_feature.ts`
- 新迁移需在 `src/lib/migrations/index.ts` 中注册

## 许可证

本项目仅供学习和个人使用。
