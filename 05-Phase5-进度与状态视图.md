# Phase 5: 进度与状态视图

## 目标

实现阶段进度列表、Plan 详情、会话上下文和注意事项面板。

## 前置依赖

Phase 4（文件浏览）

## 任务清单

### 5.1 进度 Store

- [ ] 创建 `useProgressStore`
- [ ] 实现从 `node gsd-tools.cjs roadmap analyze` 获取进度数据
- [ ] 实现从 `node gsd-tools.cjs state-snapshot` 获取状态数据
- [ ] 实现 JSON 数据解析
- [ ] 实现 Markdown 降级解析（JSON 不可用时）
- [ ] 实现数据缓存

### 5.2 Phase 列表组件

- [ ] 实现 Phase 卡片组件（PhaseCard）
- [ ] 显示阶段名称、进度百分比、完成状态
- [ ] 实现当前阶段高亮
- [ ] 实现进度条可视化
- [ ] 实现可折叠展开

### 5.3 Plan 列表组件

- [ ] 实现 Plan 列表组件（PlanItem）
- [ ] 显示 Plan 名称、完成状态
- [ ] 显示 PLAN.md / SUMMARY.md 存在状态
- [ ] 实现点击跳转到 Plan 详情
- [ ] 实现依赖关系显示

### 5.4 会话上下文面板

- [ ] 创建 SessionContext 组件
- [ ] 解析 STATE.md 中的最近位置
- [ ] 显示 blockers（阻塞项）
- [ ] 显示 key-decisions（关键决策）
- [ ] 实现会话时间线

### 5.5 注意事项面板

- [ ] 创建 AttentionPanel 组件
- [ ] 汇总未完成计划
- [ ] 显示 STATE.md blockers
- [ ] 显示待处理事项
- [ ] 实现可操作列表（点击跳转）

### 5.6 Dashboard 视图

- [ ] 创建 DashboardView 页面
- [ ] 整合 PhaseCard 列表
- [ ] 整合 SessionContext
- [ ] 整合 AttentionPanel
- [ ] 实现视图布局

## 成功标准

1. Dashboard 显示所有阶段及其完成状态
2. 可展开 Phase 查看所有 Plans
3. 显示当前会话上下文
4. 注意事项面板汇总关键待办
5. 进度数据实时刷新

## 需求映射

| 任务 | 对应需求 |
|------|----------|
| 5.1 | PROG-05（数据获取） |
| 5.2 | PROG-01（Phase 列表） |
| 5.3 | PROG-02（Plan 列表） |
| 5.4 | PROG-03（会话上下文） |
| 5.5 | PROG-04（注意事项） |
| 5.6 | PROG 相关（视图整合） |

## 预计工作量

- 任务数: 6
- 复杂度: 中
