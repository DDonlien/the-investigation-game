# Requirements

本文档跟踪《调查深入》电子游戏子项目需求。根级跨项目需求见 `../../REQUIREMENTS.md`。

## Status Rules

- [x] [VD-RULE-001] Every executable requirement has a stable ID.
- [x] [VD-RULE-002] Task state uses native Markdown checkbox syntax.
- [x] [VD-RULE-003] Task hierarchy is expressed with indentation.
- [x] [VD-RULE-004] Tags are used only for filtering.
- [x] [VD-RULE-005] This file uses no YAML fields.

## Phase 0: Project Foundation

- [x] [VD-P0-A-000] Establish Delve videogame TypeScript prototype #phase-0 #P0
  - [x] [VD-P0-A-001] Create Vite + TypeScript project in `ts/`.
  - [x] [VD-P0-A-002] Load Delve boardgame CSV records as typed runtime data.
  - [x] [VD-P0-A-003] Track implementation state in `ts/src/data/implementationRegistry.json`.
  - [x] [VD-P0-A-004] Render a single-screen playable investigation prototype.
  - [x] [VD-P0-A-005] Expose text QA summary through `window.render_game_to_text()`.

- [ ] [VD-P0-B-000] Freeze Phase 1 MVP scope #phase-0 #P0
  - [ ] [VD-P0-B-001] Confirm included investigators.
  - [ ] [VD-P0-B-002] Confirm required fully interactive strategy cards.
  - [ ] [VD-P0-B-003] Confirm strategy cards allowed to remain tracked stubs.
  - [ ] [VD-P0-B-004] Confirm active environment card handling.
  - [ ] [VD-P0-B-005] Confirm whether P2P is deferred.

## Phase 1: Core Playable Loop

- [ ] [VD-P1-A-000] Complete core electronic boardgame loop #phase-1 #feature #P0
  - [x] [VD-P1-A-001] Track round, phase, action order, SAN, mechanisms, hand, intelligence points, and discards.
  - [x] [VD-P1-A-002] Resolve 1-3 investigations and intelligence card draws.
  - [x] [VD-P1-A-003] Resolve `禁忌真相` at prototype level.
  - [x] [VD-P1-A-004] Advance operation phases and skip mad investigators.
  - [x] [VD-P1-A-005] Draw strategy cards when operation stages begin.
  - [ ] [VD-P1-A-006] Implement complete win/loss or game-end conditions.
  - [ ] [VD-P1-A-007] Add reset/new-game flow.

- [ ] [VD-P1-B-000] Improve strategy-card interaction coverage #phase-1 #feature #P0
  - [x] [VD-P1-B-001] Pay intelligence costs and discard used strategy cards.
  - [x] [VD-P1-B-002] Select targets for investigator-targeting strategy cards.
  - [x] [VD-P1-B-003] Prototype known strategy effects already represented in `gameState.ts`.
  - [ ] [VD-P1-B-004] Add dedicated `胁迫 · I` payment UI.
  - [ ] [VD-P1-B-005] Add `俄罗斯转轮 · I` branch UI.
  - [ ] [VD-P1-B-006] Add deck/discard adjustment UI for `回溯 · I`, `凝视 · I`, and `调整 · I`.
  - [ ] [VD-P1-B-007] Add insertion-position UI for `禁忌仪式 · I`.
  - [ ] [VD-P1-B-008] Add multi-commander hand exchange handling for `偷天换日 · I`.

- [ ] [VD-P1-C-000] Improve environment and support cards #phase-1 #feature #P1
  - [x] [VD-P1-C-001] Load environment and support CSV data.
  - [x] [VD-P1-C-002] Render current environment card and expanded details.
  - [ ] [VD-P1-C-003] Implement active environment effect timing.
  - [ ] [VD-P1-C-004] Decide whether support cards are in Phase 1 MVP.

- [ ] [VD-P1-D-000] Add maintainable verification #phase-1 #qa #P1
  - [x] [VD-P1-D-001] Keep build command as the basic verification gate.
  - [ ] [VD-P1-D-002] Add unit tests for CSV parsing and game-state transitions.
  - [ ] [VD-P1-D-003] Add browser smoke test for investigation and strategy targeting.
  - [ ] [VD-P1-D-004] Document tracked approximations in registry or implementation notes.

## Later Phases

- [ ] [VD-P2-A-000] Define P2P and multi-commander architecture #phase-2 #network #P1
  - [ ] [VD-P2-A-001] Define state ownership and synchronization events.
  - [ ] [VD-P2-A-002] Define private hand/information boundaries.
  - [ ] [VD-P2-A-003] Define reconnect and desync behavior.

- [ ] [VD-P2-B-000] Separate later DBG/outer-loop design #phase-2 #design #P2
  - [ ] [VD-P2-B-001] Keep Phase 1 boardgame-faithful rules separate from Slay-the-Spire style outer loop.
  - [ ] [VD-P2-B-002] Track recruitment, upgrades, and preselected decks as later systems.

## Cross-Cutting

- [ ] [VD-X-A-000] Maintain child-project agent traceability #agent #qa #P0
  - [x] [VD-X-A-001] Create child `AGENTS.md`.
  - [x] [VD-X-A-002] Create child `README.md`.
  - [x] [VD-X-A-003] Create child `REQUIREMENTS.md`.
  - [x] [VD-X-A-004] Create child `DESIGN.md`.
  - [x] [VD-X-A-005] Create child `agent-log/`.
  - [ ] [VD-X-A-006] Use child `agent-log/` for future tasks that only affect this subproject.
