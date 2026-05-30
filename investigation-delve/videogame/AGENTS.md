# Agent 协作规范

本目录继承根目录 `AGENTS.md` 的标准内容。处理本子项目任务时，必须先阅读根目录规范，再阅读本文件；若本文件与根目录标准内容冲突，以根目录标准内容和用户明确要求为准。

## 项目专用内容

### 项目概况

- 项目名称：《调查深入》电子游戏。
- 产品简介：将《调查深入》桌游玩法电子化，当前目标是完成一阶段 TypeScript MVP。
- 主要用户：游戏设计者、玩法验证者、继续实现规则和 UI 的 agent/开发者。
- 当前阶段：已有 Vite + TypeScript + GSAP 原型，仍需冻结 MVP、补完整结束条件、完善关键策略牌 UI 和测试。

### 技术栈与命令

- 技术栈：Vite + TypeScript + GSAP + 原生 DOM。
- 开发命令：`cd investigation-delve/videogame/ts && npm run dev`
- 测试命令：暂无专用测试；行为/UI 变更至少运行构建，并按需要做浏览器烟测。
- 构建命令：`cd investigation-delve/videogame/ts && npm run build`
- 发布命令：暂无。

### 文档入口

- 子项目说明：`investigation-delve/videogame/README.md`
- 子项目需求追踪：`investigation-delve/videogame/REQUIREMENTS.md`
- 子项目视觉规范：`investigation-delve/videogame/DESIGN.md`
- 子项目执行日志：`investigation-delve/videogame/agent-log/`
- 电子游戏 GDD：`investigation-delve/videogame/game-design/调查深入-GDD.md`

### 目录索引

- `game-design/`：电子游戏 GDD 和参考资料。
- `ts/`：当前 TypeScript 原型工程。
- `ts/src/data/`：CSV 解析、资源引用、实现状态登记。
- `ts/src/engine/`：游戏状态、回合推进、调查和策略结算。
- `ts/src/ui/`：DOM 渲染、事件绑定和 GSAP 动画。
- `agent-log/`：本子项目任务执行日志。

### 上游资料

- `../boardgame/game-design/调查深入-规则指引书.md`
- `../boardgame/game-design/规则指引书-v1.1.md`
- `../boardgame/game-design/调查附录.md`
- `../boardgame/game-design/FAQ.md`
- `../boardgame/game-design/调查深入-卡牌统计表.md`
- `../boardgame/game-design/调查深入-卡牌统计表/*.csv`

### 项目特殊约束

- 行为改动必须能回链到 GDD、规则书、附录、FAQ 或 CSV。
- 不复制桌游 CSV 内容到代码中作为长期数据源；优先通过 loader 读取源 CSV。
- 当前不要把 P2P、多指挥者私密手牌、DBG 外循环提前混进核心单机 MVP，除非需求明确。
- UI 改动遵循本目录 `DESIGN.md`，并保证核心状态可观察。
