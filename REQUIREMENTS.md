# Requirements

本文档使用稳定 ID 跟踪仓库与当前 Delve videogame 主线需求。不要重排或复用已有 ID；取消的工作用 `#cut` 标记。

## Status Rules

- [x] [RULE-001] Every executable requirement has a stable ID.
- [x] [RULE-002] Task state uses native Markdown checkbox syntax.
- [x] [RULE-003] Task hierarchy is expressed with indentation.
- [x] [RULE-004] Tags are used only for filtering.
- [x] [RULE-005] `REQUIREMENTS.md` uses no YAML fields.

## Repository Organization

- [x] [ORG-A-000] Maintain a multi-project repository map #docs #P0
  - [x] [ORG-A-001] Identify `investigation-delve/boardgame` as Delve boardgame source material.
  - [x] [ORG-A-002] Identify `investigation-delve/videogame` as the current main project.
  - [x] [ORG-A-003] Identify `investigation-reality-unraveled/boardgame` as separate project/reference material.
  - [x] [ORG-A-004] Preserve `md` and `csv` as primary source formats.

- [x] [ORG-B-000] Adopt current agent-template process #agent #docs #P0
  - [x] [ORG-B-001] Update root `AGENTS.md` with startup, logging, requirements, README, DESIGN, parent-child docs, and project-specific rules.
  - [x] [ORG-B-002] Maintain root `DESIGN.md` as visual/interface style guidance only.
  - [x] [ORG-B-003] Maintain root `REQUIREMENTS.md` with stable requirement IDs and no YAML fields.
  - [x] [ORG-B-004] Maintain `agent-log/` task execution logging.
  - [x] [ORG-B-005] Update root `README.md` as global project introduction without detailed task status.
  - [x] [ORG-B-006] Add current-main child documentation for `investigation-delve/videogame/`.

## Phase 0: Delve Videogame Foundation

- [x] [P0-A-000] Establish the TypeScript prototype project #phase-0 #delve #P0
  - [x] [P0-A-001] Create Vite + TypeScript project under `investigation-delve/videogame/ts`.
  - [x] [P0-A-002] Load boardgame CSV data into typed runtime records.
  - [x] [P0-A-003] Provide an implementation registry for mapping table rows to executable hooks.
  - [x] [P0-A-004] Render a playable single-screen prototype shell.
  - [x] [P0-A-005] Provide `window.render_game_to_text()` for browser QA.

- [ ] [P0-B-000] Freeze Delve Phase 1 MVP scope #phase-0 #delve #P0
  - [ ] [P0-B-001] Define which investigators are included in the first MVP.
  - [ ] [P0-B-002] Define which strategy cards require complete UI and which may remain tracked stubs.
  - [ ] [P0-B-003] Define which environment cards are active in the first MVP.
  - [ ] [P0-B-004] Define minimum single-player win/loss or round-end conditions.
  - [ ] [P0-B-005] Define whether P2P is in Phase 1 MVP or deferred to a later milestone.

## Phase 1: First Playable Delve Loop

- [ ] [P1-A-000] Complete the electronic Delve core loop #feature #phase-1 #delve #P0
  - [x] [P1-A-001] Track round, phase, action order, current investigator, SAN, mechanisms, intelligence points, and discards.
  - [x] [P1-A-002] Support selecting 1 to 3 investigations and resolving intelligence draws.
  - [x] [P1-A-003] Detect and resolve `禁忌真相` at prototype level.
  - [x] [P1-A-004] Advance operation phases and skip mad investigators.
  - [x] [P1-A-005] Draw strategy cards at operation start.
  - [ ] [P1-A-006] Define and implement complete game end conditions.
  - [ ] [P1-A-007] Add reset/new-game flow.

- [ ] [P1-B-000] Complete strategy card interaction coverage #feature #phase-1 #delve #P0
  - [x] [P1-B-001] Support paying intelligence cost and discarding used strategy cards.
  - [x] [P1-B-002] Support target selection for investigator-targeting strategy cards.
  - [x] [P1-B-003] Implement tracked/prototype resolution for layout, reverse, skip, peeking, adjustment, balance, sacrifice, faith, puppet, and related cards already represented in code.
  - [ ] [P1-B-004] Add dedicated UI for `胁迫 · I` cost/payment selection.
  - [ ] [P1-B-005] Add dedicated UI for `俄罗斯转轮 · I` refusal/investigation branches.
  - [ ] [P1-B-006] Add dedicated UI for private deck/discard adjustments such as `回溯 · I`, `凝视 · I`, and `调整 · I`.
  - [ ] [P1-B-007] Add dedicated UI for insertion-position choices such as `禁忌仪式 · I`.
  - [ ] [P1-B-008] Add multi-commander hand exchange handling for `偷天换日 · I`.
  - [ ] [P1-B-009] Replace broad tracked stubs with explicit implementation status per card.

- [ ] [P1-C-000] Improve environment and support card handling #feature #phase-1 #delve #P1
  - [x] [P1-C-001] Load environment and support card CSV data.
  - [x] [P1-C-002] Render current environment card and expanded text.
  - [ ] [P1-C-003] Implement environment effect timing and active effect resolution.
  - [ ] [P1-C-004] Implement support card acquisition/use if included in Phase 1 MVP.

- [ ] [P1-D-000] Make the prototype testable and maintainable #qa #phase-1 #delve #P1
  - [x] [P1-D-001] Keep `npm run build` passing.
  - [ ] [P1-D-002] Add focused unit tests for CSV parsing and core game-state transitions.
  - [ ] [P1-D-003] Add a repeatable browser smoke test for investigation and strategy targeting.
  - [ ] [P1-D-004] Document known rule approximations in implementation notes or registry.

## Phase 2: Multiplayer and Larger Game Shape

- [ ] [P2-A-000] Define multiplayer architecture #network #phase-2 #delve #P1
  - [ ] [P2-A-001] Define state ownership for P2P rooms.
  - [ ] [P2-A-002] Define deterministic action/event log format.
  - [ ] [P2-A-003] Define private information boundaries for multiple commanders.
  - [ ] [P2-A-004] Define reconnection and desync handling.

- [ ] [P2-B-000] Define roguelite/DBG expansion boundary #design #phase-2 #delve #P2
  - [ ] [P2-B-001] Separate Phase 1 boardgame-faithful rules from later Slay-the-Spire style outer loop.
  - [ ] [P2-B-002] Track investigator recruitment, upgrades, and preselected strategy deck as later-phase systems.

## Cross-Cutting

- [ ] [X-A-000] Maintain AI traceability #qa #agent #P0
  - [x] [X-A-001] Run `git pull` at task start when inside a git repository.
  - [x] [X-A-002] Check `REQUIREMENTS.md` for matching requirements before editing.
  - [x] [X-A-003] Update completed requirements after this repository organization task.
  - [x] [X-A-004] Create one `agent-log/` log per task execution.
  - [x] [X-A-005] Log includes user original prompt, startup branch/version, start time, end time, commit status, action record, requirement/design updates, and verification.
  - [ ] [X-A-006] Continue updating requirements whenever task scope, status, or acceptance changes.

- [ ] [X-B-000] Definition of Done #qa #P0
  - [ ] [X-B-001] Requested behavior, content, or documentation change is implemented.
  - [ ] [X-B-002] UI, API, CLI, document, or workflow remains usable for the target scenario.
  - [ ] [X-B-003] Tests/build/checks pass or known failures are documented.
  - [ ] [X-B-004] `README.md`, `REQUIREMENTS.md`, relevant `DESIGN.md`, and `agent-log/` are updated when applicable.
