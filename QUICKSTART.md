# 🚀 Expo 2048 快速开始指南

## 📱 项目简介

这是离线 2048 游戏的 Expo 版本，支持完全离线开发和打包。

**技术栈：**
- Expo SDK 55（Canary 版本）
- React Native 0.83
- React Navigation 6
- Expo SQLite
- AsyncStorage

---

## ⚡ 快速开始

### 1️⃣ 安装依赖

```bash
cd expo-mobile
npm install
```

### 2️⃣ 启动开发服务器

```bash
npm start
```

然后：
- **Android:** 按 `a` 键启动 Android 模拟器或真机
- **iOS:** 按 `i` 键启动 iOS 模拟器（仅 macOS）
- **Web:** 按 `w` 键在浏览器中打开

### 3️⃣ 扫描二维码（可选）

在 Expo Go 应用中扫描二维码，即可在真机上调试。

---

## 🏗️ 离线打包（推荐）

### 为什么选择离线打包？

✅ **完全离线** - 无需网络连接
✅ **原生性能** - 真正的原生应用
✅ **自定义配置** - 完全控制原生代码
✅ **无限制** - 不受 Expo Go 限制

### Android 打包步骤

#### 1. 生成 Android 原生项目

```bash
cd expo-mobile
npx expo prebuild --platform android
```

**注意：** 只需运行一次！之后 `android/` 目录会一直存在。

#### 2. 使用 Android Studio 打包

1. 打开 Android Studio
2. 选择 `Open an Existing Project`
3. 导航到 `expo-mobile/android/` 目录
4. 等待 Gradle 同步完成
5. 点击 `Build` → `Generate Signed Bundle / APK`
6. 选择 `APK`，点击 `Next`
7. 创建或选择密钥库（keystore）
8. 选择 `release` 构建
9. 点击 `Finish`

**输出位置：** `expo-mobile/android/app/build/outputs/apk/release/app-release.apk`

#### 3. 使用 Gradle 命令行打包

```bash
cd expo-mobile/android
./gradlew assembleRelease
```

**输出位置：** `app/build/outputs/apk/release/app-release.apk`

---

## 📂 项目结构

```
expo-mobile/
├── App.tsx              # 应用入口
├── app.json             # Expo 配置
├── db.ts                # SQLite 数据库适配器
├── storage.ts           # AsyncStorage 存储层
├── assets/              # 静态资源
├── android/             # Android 原生项目（prebuild 后生成）
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/...
│   ├── build.gradle
│   └── gradle.properties
└── src/                 # 源代码
    ├── screens/         # 屏幕组件
    ├── components/      # UI 组件
    └── lib/             # 工具库
```

---

## 🔧 常用命令

### 开发

```bash
# 启动开发服务器
npm start

# 清除缓存启动
npm start -- --clear

# 启动特定平台
npm run android
npm run ios
npm run web
```

### 原生项目

```bash
# 生成原生项目（首次）
npx expo prebuild

# 只生成 Android
npx expo prebuild --platform android

# 清理并重新生成
npx expo prebuild --clean
```

### 调试

```bash
# 打开元素检查器
# 在应用中按 Shift + M

# 查看日志
# 在应用中按 Ctrl + M（Android）或 Cmd + D（iOS）
```

---

## 📦 依赖说明

### 核心依赖

```json
{
  "expo": "^55.0.0",
  "expo-sqlite": "^14.0.0",
  "expo-font": "^55.0.0",
  "expo-splash-screen": "^55.0.0",
  "react": "^19.0.0",
  "react-native": "^0.83.0"
}
```

### 导航依赖

```json
{
  "@react-navigation/native": "^6.0.0",
  "@react-navigation/stack": "^6.0.0",
  "react-native-safe-area-context": "^4.0.0",
  "react-native-screens": "^3.0.0"
}
```

### 存储依赖

```json
{
  "@react-native-async-storage/async-storage": "^1.0.0"
}
```

---

## 🐛 常见问题

### Q: 如何解决 Android 打包错误？

```bash
# 清理并重新生成
cd expo-mobile
rm -rf android
npx expo prebuild --platform android --clean
```

### Q: 如何查看应用日志？

在应用中摇一摇设备（或按 Ctrl+M），选择 "Debug" 或 "Reload"

### Q: 如何修改应用名称？

编辑 `app.json` 中的 `name` 字段，然后运行 `npx expo prebuild --clean`

### Q: 如何更改应用图标？

替换 `assets/` 目录下的图标文件，然后运行 `npx expo prebuild --clean`

---

## 📝 下一步

1. **迁移屏幕组件** - 从 `rn-files/` 复制屏幕组件到 `expo-mobile/src/screens/`
2. **迁移共享代码** - 复制 `src/lib/` 和 `src/components/`
3. **测试功能** - 确保所有功能正常工作
4. **打包发布** - 使用 Android Studio 生成 APK

---

## 📚 更多文档

- **迁移文档：** [MIGRATION.md](./MIGRATION.md)
- **Expo 官方文档：** https://docs.expo.dev/
- **React Navigation 文档：** https://reactnavigation.org/

---

**祝您开发愉快！** 🎉
