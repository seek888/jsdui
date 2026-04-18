# Phase 1: 项目脚手架

## 目标

搭建 Electron + Vue 3 + TypeScript + Vite 项目，配置开发环境和构建工具。

## 前置依赖

无（第一个阶段）

## 任务清单

### 1.1 项目初始化

- [ ] 初始化 `package.json`（name: gsd-ui, type: module）
- [ ] 安装 Vue 3 + TypeScript + Vite 依赖
- [ ] 安装 electron + electron-vite 开发依赖
- [ ] 安装 electron-builder 用于打包
- [ ] 安装 vite-plugin-electron-renderer

### 1.2 目录结构搭建

```
gsd-ui/
├── electron/
│   ├── main/
│   │   ├── index.ts          # 主进程入口
│   │   ├── ipc.ts            # IPC 处理
│   │   └── store.ts          # electron-store
│   └── preload/
│       └── index.ts          # 预加载脚本
├── src/
│   ├── main.ts               # Vue 入口
│   ├── App.vue               # 根组件
│   ├── components/
│   │   ├── layout/           # 布局组件
│   │   └── ui/               # UI 组件
│   ├── views/                # 页面视图
│   ├── stores/               # Pinia stores
│   ├── composables/          # Vue composables
│   ├── lib/                  # 工具函数
│   └── types/                # TypeScript 类型
├── electron-builder.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 1.3 Vite 配置

- [ ] 配置 `electron-vite` 插件
- [ ] 配置主进程构建入口
- [ ] 配置渲染进程入口
- [ ] 配置热更新（HMR）
- [ ] 配置路径别名（@/）

### 1.4 TypeScript 配置

- [ ] 配置 `tsconfig.node.json`（Node 环境）
- [ ] 配置 `tsconfig.web.json`（浏览器环境）
- [ ] 配置 `tsconfig.json`（基础配置）
- [ ] 添加 Electron 类型声明

### 1.5 开发脚本

- [ ] 添加 `dev` 脚本（开发模式）
- [ ] 添加 `build` 脚本（生产构建）
- [ ] 添加 `preview` 脚本（预览构建结果）
- [ ] 验证项目可运行

## 成功标准

1. `npm run dev` 可启动 Electron 应用
2. Vue 应用正确渲染在 BrowserWindow 中
3. 主进程和渲染进程热更新正常
4. TypeScript 类型检查无错误

## 预计工作量

- 任务数: 5
- 复杂度: 低
