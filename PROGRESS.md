---
tags:
  - project
  - progress
  - investigation
---

# Progress

这个文档记录当前仓库状态、已完成整理、下一阶段目标和待确认事项，供后续 agent 快速接手。稳定需求和验收状态见 [[REQUIREMENTS]]，产品与实现现状见 [[DESIGN]]。

## 当前状态

仓库当前已经从原始策划资产整理为静态资料库，并开始推进《调查深入》电子游戏 TS 原型：

- 规则文档已转为 `md`
- 表格资料已拆为 `csv`
- 文档之间已经补充了一轮 Obsidian `[[内链]]`
- 已有入口页：
  - [[README]]
  - [[调查深入-卡牌统计表]]
  - [[现实解构-卡牌列表]]
- 已按 `agent-template` 当前规范补充：
  - [[AGENTS]]
  - [[DESIGN]]
  - [[REQUIREMENTS]]
  - `agent-log/`
- 已按新版 `agent-template` 将 [[DESIGN]] 收敛为视觉规范，并为当前主线子项目补充独立文档入口：
  - `investigation-delve/videogame/AGENTS.md`
  - `investigation-delve/videogame/README.md`
  - `investigation-delve/videogame/REQUIREMENTS.md`
  - `investigation-delve/videogame/DESIGN.md`
  - `investigation-delve/videogame/agent-log/`
- 当前主要代码工程：
  - `investigation-delve/videogame/ts/`

## 已完成

### 资料整理

- 《调查深入》桌游规则文档已整理完成
- 《调查深入》卡牌统计表已拆表完成
- 《现实解构》GDD 已整理完成
- 《现实解构》卡牌列表已拆表完成
- 电子游戏策划文档已整理为 [[调查深入-GDD]]

### 笔记化

- 已将主导航整理到 [[README]]
- 已对关键引用补充 Obsidian 内链
- 已建立 CSV 目录的索引页
- 已将 agent 协作规范升级为 `AGENTS.md`、`DESIGN.md`、`REQUIREMENTS.md`、`agent-log/` 结构
- 已根据新版模板明确：README 只写项目说明，REQUIREMENTS 写任务状态，DESIGN 只写视觉规范
- 已为 `investigation-delve/videogame/` 创建子项目文档套件

### TS 原型

- 已建立 Vite + TypeScript + GSAP 工程
- 已从桌游 CSV 加载调查员、策略、环境、辅助、情报数据
- 已建立 `implementationRegistry.json` 跟踪卡牌/调查员效果实现状态
- 已实现单屏调查原型、行动顺序、SAN、个体机制、手牌、情报点、行动记录
- 已实现部分策略牌的原型结算或可追踪折算
- 已提供 `window.render_game_to_text()` 作为浏览器 QA 文本出口

## 当前重点

下一阶段重点已经明确：

**把《调查深入》电子游戏一阶段 TypeScript 原型推进到明确 MVP。**

入口：

- [[REQUIREMENTS]]
- [[DESIGN]]
- [[调查深入-GDD]]

## 当前资料覆盖范围

### 已覆盖

- 桌游核心规则
- FAQ / 判例
- 调查员与多类卡牌数据
- 现实解构扩展内容
- 电子游戏分阶段构想
- Delve TS 原型的当前实现状态

### 尚未开始或未明确

- UI 原型
- 网络方案细化
- 一阶段 MVP 范围冻结
- 完整游戏结束条件
- 关键策略牌的完整 UI 化
- 单元测试与固定浏览器烟测
- 多指挥者/P2P 状态边界

## 推荐下一步

建议后续 agent 优先完成下面几件事：

1. 按 [[REQUIREMENTS]] 冻结 Delve Phase 1 MVP 范围
2. 明确单机与 P2P 的边界，决定 P2P 是否延期
3. 补齐核心胜负/结束条件和重开流程
4. 将关键策略牌从“可追踪折算”推进到完整 UI
5. 增加核心状态测试和浏览器烟测

## 需要持续记录的事项

后续 agent 如果推进实现，建议持续在这里追加：

- 已确认的技术决策
- 规则上的未决问题
- 被推迟的功能
- MVP 范围变动
- 已落地的模块

## 注意

- 当前仓库是“设计资料 + Delve TS 原型”的混合仓库
- 所有新的实现决策都应尽量能回链到现有规则或 GDD
- 修改范围、状态或验收标准时，同步更新 [[REQUIREMENTS]] 并新增 `agent-log/` 日志
- 只影响 `investigation-delve/videogame/` 的后续任务，优先维护该子项目自己的文档与 `agent-log/`

## 2026-05-04 TS 一阶段续作记录

Original prompt: 继续实现没做完的任务

### 已推进

- 继续上一个 Codex 线程中未完成的 8 条浏览器批注任务。
- 在 `investigation-delve/videogame/ts` 的原生 TypeScript + GSAP + Vite 工程中扩展规则状态。
- `tableLoader.ts` 新增完整 `intelligenceDeckEntries`，保留点数数组，同时支持识别【禁忌真相】。
- `gameState.ts` 新增轮次、情报弃牌、最后窥探/调查结果、临时 SAN、机制状态、SAN 归零疯狂处理。
- 调查现在会按情报牌条目结算：加总情报点，记录弃牌，识别【禁忌真相】，处理【沉沦 · I】与【直视神 · I】的核心分支。
- 操作阶段推进会跳过疯狂调查员，并处理【异时癖 · I】的直接跳过；【盲从 · I】会阻止先打策略。
- 扩展策略自动化：跳过、反转、布局、个体机制布置、照亮前路无效、窥探、凝视、调整、内化、平衡、埋葬过去、傀儡、俄罗斯转轮、献祭、信仰等已有可追踪结算。
- 行动顺序 token 尺寸已收窄，避免 7 位调查员在 1280 视口下溢出到右栏。
- `window.render_game_to_text()` 已补充轮次、阶段、SAN、机制、目标、弃牌计数等 QA 字段。

### 已验证

- `npm run build` 通过。
- 已运行 `develop-web-game` 的 Playwright 客户端生成截图和状态。
- 已用 Playwright 直接验证：选择 3 次调查、点击调查区执行、当前调查员结束操作阶段并推进到下一位、每个新操作阶段抽 2 张策略、环境整块展开。
- 已验证策略目标流程：使用【布局 · I】后进入目标选择，选择调查员后支付情报、弃置额外手牌并记录结算。
- 已截图检查主界面、环境展开、技能 tooltip。

### 暂留 TODO

- 部分需要专门 UI 的策略仍是“可追踪折算”而非完整桌游交互：例如【俄罗斯转轮 · I】拒绝调查分支、【回溯 · I】/【凝视 · I】/【调整 · I】的私密调整位置、【禁忌仪式 · I】插入任意位置、【偷天换日 · I】多指挥者换手牌。
- 【胁迫 · I】目前用选择的调查次数作为支付/胁迫值的临时输入，后续需要独立的费用选择控件。
- 当前仍是单一手牌/情报点池原型；P2P 与多指挥者手牌、队伍情报区还未建模。
