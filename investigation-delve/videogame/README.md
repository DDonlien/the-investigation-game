# 调查深入电子游戏

本目录是《调查深入》电子游戏项目入口。当前主线是一阶段 TypeScript 版本：先忠实电子化桌游玩法，让基础调查、策略、SAN、个体机制、环境和行动顺序可以在浏览器里验证。

## 项目概述

- 项目名称：《调查深入》电子游戏。
- 一句话简介：基于桌游规则和 CSV 数据构建可玩的浏览器原型。
- 解决的问题：让复杂桌游流程可交互、可观察、可验证，为后续 P2P 和更复杂 DBG/外循环打基础。
- 目标用户：设计者、规则验证者、继续实现功能的开发者和 agent。
- 当前状态：已有 Vite + TypeScript + GSAP 原型，仍处于一阶段 MVP 完善中。

## 当前能力

- 从 `investigation-delve/boardgame/game-design/调查深入-卡牌统计表/*.csv` 加载调查员、策略、环境、辅助和情报数据。
- 渲染单屏桌面优先的调查视图，包括玩家队伍、对手队伍、情报进度、行动顺序、环境、手牌和行动日志。
- 支持选择 1-3 次调查、结算情报牌、记录弃牌和识别 `禁忌真相`。
- 支持部分策略牌的支付、目标选择、个体机制布置和原型结算。
- 提供 `window.render_game_to_text()` 作为浏览器 QA 文本出口。

## 快速开始

```bash
cd investigation-delve/videogame/ts
npm install
npm run dev
```

构建验证：

```bash
cd investigation-delve/videogame/ts
npm run build
```

## 目录结构

```text
investigation-delve/videogame/
├── AGENTS.md
├── README.md
├── REQUIREMENTS.md
├── DESIGN.md
├── agent-log/
├── game-design/
└── ts/
    ├── src/data/
    ├── src/engine/
    └── src/ui/
```

## 文档入口

- Agent 协作规范：`AGENTS.md`
- 需求与验收追踪：`REQUIREMENTS.md`
- 视觉规范：`DESIGN.md`
- 执行日志：`agent-log/`
- GDD：`game-design/调查深入-GDD.md`

## 上游资料

- 桌游规则：`../boardgame/game-design/调查深入-规则指引书.md`
- 规则版本参考：`../boardgame/game-design/规则指引书-v1.1.md`
- 附录：`../boardgame/game-design/调查附录.md`
- FAQ：`../boardgame/game-design/FAQ.md`
- 卡牌数据索引：`../boardgame/game-design/调查深入-卡牌统计表.md`
- CSV 数据：`../boardgame/game-design/调查深入-卡牌统计表/*.csv`

## 运行与验证

- 开发：`cd investigation-delve/videogame/ts && npm run dev`
- 测试：暂无专用测试；后续应补核心状态单元测试和浏览器烟测。
- 构建：`cd investigation-delve/videogame/ts && npm run build`
- 发布：暂无发布流程。

## 边界与限制

- 当前 TS 原型仍是单机共享状态，不是完整 P2P 实现。
- 部分复杂策略牌仍是可追踪折算，不是完整桌游 UI。
- 暂无持久化、账号、房间、匹配或联机同步。
- 具体待办、验收项和状态维护在 `REQUIREMENTS.md`，不写入 README。
