# 调查系列项目资料库

这个仓库可以直接作为 Obsidian 笔记库使用，维护《调查》系列多个游戏项目的规则、卡牌数据、GDD 和当前电子游戏原型。

当前主要工作线是《调查深入》电子游戏一阶段 TypeScript 版本，入口位于 `investigation-delve/videogame/`。

## 项目概述

- 项目名称：《调查》系列项目资料库。
- 一句话简介：将《调查深入》《现实解构》等项目的设计资料整理为 AI 友好的 Markdown/CSV，并推进 Delve 电子游戏原型。
- 解决的问题：减少后续 agent 和开发者重复理解资料的成本，让规则、数据、需求、视觉规范和实现入口可追踪。
- 目标用户：游戏设计者、后续 agent/开发者、玩法验证者。
- 当前状态：资料库已整理完成第一轮；Delve videogame 已有 Vite + TypeScript + GSAP 原型。

## 当前能力

- 以 `md` 存放规则、附录、FAQ、GDD 等正文资料。
- 以 `csv` 存放卡牌、调查员、房间、事件等结构化数据。
- 提供 Delve videogame TS 原型，已能加载桌游 CSV 并运行基础调查/策略流程。
- 通过 `AGENTS.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/` 维护 agent 协作上下文。

## Agent 协作

- [[AGENTS]]
- [[REQUIREMENTS]]
- [[DESIGN]]
- [[PROGRESS]]

后续 agent 进入仓库时，优先阅读以上文件和 `agent-log/` 最新日志。

## 快速开始

Delve videogame 开发：

```bash
cd investigation-delve/videogame/ts
npm run dev
```

Delve videogame 构建验证：

```bash
cd investigation-delve/videogame/ts
npm run build
```

## 目录结构

```text
.
├── AGENTS.md
├── README.md
├── REQUIREMENTS.md
├── DESIGN.md
├── agent-log/
├── agent-template/
├── investigation-delve/
│   ├── boardgame/
│   └── videogame/
├── investigation-reality-unraveled/
│   └── boardgame/
└── worldbuilding/
```

## 文档入口

- Agent 协作规范：`AGENTS.md`
- 需求与验收追踪：`REQUIREMENTS.md`
- 视觉规范：`DESIGN.md`
- 执行日志：`agent-log/`
- 阶段进展：`PROGRESS.md`

## 子功能

- `investigation-delve/videogame/`：当前主线，《调查深入》电子游戏；子项目文档入口为 `investigation-delve/videogame/README.md`。
- `investigation-delve/boardgame/`：《调查深入》桌游资料，是电子游戏一阶段的权威规则来源。
- `investigation-reality-unraveled/boardgame/`：《现实解构》资料，当前是独立项目/扩展参考。
- `worldbuilding/`：世界观资料预留。

## 入口导航

### 当前主线：调查深入电子游戏

- [[调查深入-GDD]]
- `investigation-delve/videogame/README.md`
- `investigation-delve/videogame/ts/`

### 调查深入桌游资料

- [[调查深入-规则指引书]]
- [[规则指引书-v1.1]]
- [[调查附录]]
- [[FAQ]]
- [[制作团队-鸣谢]]
- [[调查深入-卡牌统计表]]

### 现实解构

- [[现实-解构-GDD]]
- [[现实解构-卡牌列表]]

## 资料类型

- `md`：规则、附录、FAQ、GDD 等正文资料
- `csv`：卡牌表、房间表、事件表等结构化数据

## 运行与验证

- 开发：`cd investigation-delve/videogame/ts && npm run dev`
- 测试：暂无专用测试命令；行为/UI 变更需结合构建和浏览器烟测。
- 构建：`cd investigation-delve/videogame/ts && npm run build`
- 发布：暂无发布流程。

## 边界与限制

- 不把 `docx / xlsx / pdf` 重新作为主工作对象。
- `agent-template/` 是协作模板来源，不属于项目交付内容。
- 具体待办、验收项和状态不写在 README 中，统一维护在 [[REQUIREMENTS]]。
- Delve videogame 的视觉规范见 [[DESIGN]] 和子项目 `DESIGN.md`。

## 后续扩展

后续若扩展 `worldbuilding/`，建议按角色、组织、地点、事件、术语、时间线拆分独立笔记，并继续保持 Obsidian `[[wikilink]]`。
