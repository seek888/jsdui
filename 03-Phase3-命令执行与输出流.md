# Phase 3: 命令执行与输出流

## 目标

实现 GSD 命令执行面板，支持实时输出流和 ANSI 颜色渲染。

## 前置依赖

Phase 2（主进程与 IPC）

## 任务清单

### 3.1 CLI 检测与欢迎页

- [ ] 实现 `node` 命令检测（运行 `node --version`）
- [ ] 实现 `claude` CLI 检测（运行 `claude --version`）
- [ ] Node 未安装时显示安装引导页
- [ ] CLI 未安装时显示安装引导页
- [ ] CLI 检测通过后显示项目选择页
- [ ] 实现目录选择器（使用 Electron dialog）
- [ ] 记住上次打开的项目路径

### 3.2 GSD 命令面板

- [ ] 创建 GSD 命令列表数据（plan-phase、execute-phase、verify-work 等）
- [ ] 实现命令按钮组件（带图标、标签、描述）
- [ ] 实现按钮状态机（idle、running、success、failure）
- [ ] 实现运行中 spinner 动画
- [ ] 实现成功/失败状态的颜色反馈

### 3.3 命令执行引擎

- [ ] 在主进程实现 `child_process.spawn` 调用 `claude` CLI
- [ ] 实现命令取消功能（SIGTERM / SIGKILL）
- [ ] 实现 stdout/stderr 数据收集
- [ ] 实现退出码捕获
- [ ] 实现命令输出 IPC 转发

### 3.4 实时输出流

- [ ] 安装 `@xterm/xterm` + `@xterm/addon-fit` + `@xterm/addon-clipboard`
- [ ] 创建 `TerminalView.vue` 组件封装 xterm.js
- [ ] 配置 xterm.js 主题（暗色/亮色跟随系统）
- [ ] 实现 Terminal FitAddon 自适应容器大小
- [ ] 实现主进程 100ms 批处理的 stdout/stderr 发送
- [ ] 实现渲染进程 requestAnimationFrame 节流接收
- [ ] 实现 ANSI 颜色码解析（xterm.js 内置）
- [ ] 实现自动滚动到底部（智能检测）
- [ ] 实现用户滚动检测（暂停自动滚动）
- [ ] 实现"跳到底部"浮动按钮

### 3.5 输出面板增强

- [ ] 实现输出内容复制到剪贴板
- [ ] 实现清除输出面板
- [ ] 实现输出时间戳显示
- [ ] 实现 stdout/stderr 视觉区分
- [ ] 实现命令完成状态显示

### 3.6 Pinia Store

- [ ] 创建 `useCliStore`（命令列表、运行状态、输出缓冲）
- [ ] 创建 `useProjectStore`（项目路径、CLI 检测状态）
- [ ] 实现 actions（executeCommand、cancelCommand、appendOutput）
- [ ] 连接 Vue 组件与 Store

## 成功标准

1. CLI 检测在应用启动时自动运行
2. 所有 GSD 命令按钮正确显示状态
3. 命令执行输出实时显示（延迟 ≤100ms）
4. ANSI 颜色正确渲染
5. 可取消正在运行的命令
6. 输出可复制和清除

## 需求映射

| 任务 | 对应需求 |
|------|----------|
| 3.1 | FOUND-01, FOUND-02, FOUND-03, FOUND-04 |
| 3.2 | CMD-01, CMD-02 |
| 3.3 | CMD-03, CMD-04 |
| 3.4 | OUT-01, OUT-02, OUT-03 |
| 3.5 | OUT-04 |
| 3.6 | CMD/OUT 相关状态管理 |

## 预计工作量

- 任务数: 6
- 复杂度: 高
