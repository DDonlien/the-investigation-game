import { gsap } from "gsap";
import { assetRefs, type AssetRef } from "../data/assets";
import {
  currentEnvironment,
  investigators,
  investigatorsById,
  strategyCardsById,
  type Investigator,
  type StrategyCard
} from "../data/tableLoader";
import {
  cancelPendingStrategy,
  getCurrentInvestigatorId,
  initialGameState,
  investigate,
  prepareStrategy,
  renderStateSummary,
  selectInvestigationCount,
  selectStrategyTarget,
  toggleEnvironment,
  type GameState
} from "../engine/gameState";

const iconMap: Record<string, string> = {
  archive: "book",
  blade: "blade",
  brain: "brain",
  chain: "chain",
  crown: "crown",
  flame: "flame",
  gear: "gear",
  heart: "heart",
  inspect: "search",
  mind: "mind",
  ritual: "ritual",
  signal: "signal",
  skill: "mind",
  effect: "gear"
};

const iconSvg = (kind: string): string => {
  const key = iconMap[kind] ?? kind;
  const paths: Record<string, string> = {
    archive: '<path d="M7 5h11a2 2 0 0 1 2 2v14H9a3 3 0 0 1-3-3V6a1 1 0 0 1 1-1Z"/><path d="M9 5v13a3 3 0 0 0 3 3"/>',
    blade: '<path d="M20 4 9 15"/><path d="m14 5 5 5"/><path d="m7 17 2 2"/><path d="m3 21 4-4"/>',
    book: '<path d="M5 5h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4Z"/><path d="M5 5v12"/><path d="M9 8h6"/>',
    brain: '<path d="M9 4a4 4 0 0 0-4 4v1a4 4 0 0 0 1 7.8V20h5v-5"/><path d="M15 4a4 4 0 0 1 4 4v1a4 4 0 0 1-1 7.8V20h-5v-5"/><path d="M9 9h6"/><path d="M8 13h8"/>',
    chain: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    crown: '<path d="m4 8 4 4 4-7 4 7 4-4-2 11H6Z"/><path d="M6 21h12"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-4 3-1 7-5 9-2 1-4 3-4 6 0 3 3 4 7 4Z"/>',
    gear: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M4 12h3"/><path d="M17 12h3"/><path d="m6 6 2 2"/><path d="m16 16 2 2"/><path d="m18 6-2 2"/><path d="m8 16-2 2"/>',
    heart: '<path d="M20 8c0 6-8 11-8 11S4 14 4 8a4 4 0 0 1 8-2 4 4 0 0 1 8 2Z"/>',
    mind: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14"/><path d="M5 12h14"/>',
    ritual: '<path d="M12 3 3 20h18Z"/><circle cx="12" cy="14" r="3"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    signal: '<circle cx="12" cy="12" r="2"/><path d="M8 8a6 6 0 0 1 8 0"/><path d="M5 5a10 10 0 0 1 14 0"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key] ?? paths.archive}</svg>`;
};

const assetStyle = (asset: AssetRef): string =>
  asset.src ? `style="background-image:url('${asset.src}')"` : "";

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const skillText = (value: string, fallback: string): string =>
  (value || fallback).replace(/\n{3,}/g, "\n\n").trim();

const portrait = (investigator: Investigator, variant = ""): string => `
  <div class="portrait ${variant}" ${assetStyle(investigator.portrait)}>
    <span>${investigator.name.slice(0, 1)}</span>
  </div>
`;

const san = (current: number, max: number, danger = false): string => `
  <div class="san" aria-label="SAN ${current}/${max}">
    ${Array.from({ length: max }, (_, i) => `<i class="${i < current ? "filled" : ""} ${danger ? "danger" : ""}"></i>`).join("")}
  </div>
`;

const actionButtons = (investigator: Investigator, danger = false): string => {
  const buttons = [
    {
      icon: "skill",
      label: "清醒技能",
      tooltip: skillText(investigator.awakeSkill, "CSV 中暂无清醒技能描述。")
    },
    {
      icon: "archive",
      label: "疯狂技能",
      tooltip: skillText(investigator.madnessSkill, "CSV 中暂无疯狂技能描述。")
    },
    {
      icon: "effect",
      label: "来源与实现",
      tooltip: `来源：${investigator.sourceTable}\n版本：${investigator.version}\n实现：${investigator.implementation.awakeSkillHook ?? "pending"} / ${investigator.implementation.madnessSkillHook ?? "pending"}`
    }
  ];

  return `
  <div class="action-buttons ${danger ? "danger" : ""}">
    ${buttons
      .map(
        (button) =>
          `<button class="icon-button" type="button" aria-label="${button.label}" data-tooltip="${escapeAttr(button.tooltip)}">${iconSvg(button.icon)}</button>`
      )
      .join("")}
  </div>
`;
};

const investigatorCard = (investigator: Investigator, state: GameState, featured = false): string => {
  const isCurrent = getCurrentInvestigatorId(state) === investigator.id;
  const isTargetable = Boolean(state.pendingStrategy?.validTargetIds.includes(investigator.id));
  const isSelected = Boolean(state.pendingStrategy?.selectedTargetIds.includes(investigator.id));
  const sanValue = state.sanByInvestigator[investigator.id] ?? investigator.san;
  const mechanisms = state.mechanismsByInvestigator[investigator.id] ?? [];

  return `
  <article class="investigator-card ${featured ? "featured" : ""} relation-${investigator.relation} ${isCurrent ? "current-actor" : ""} ${isTargetable ? "targetable" : ""} ${isSelected ? "target-selected" : ""}" data-investigator="${investigator.id}">
    ${portrait(investigator, featured ? "large" : "")}
    <div class="investigator-info">
      <h2>${investigator.name}</h2>
      <p>${[investigator.profession, ...investigator.traits].filter(Boolean).join(" / ")}</p>
      ${san(sanValue, investigator.maxSan, investigator.team === "opponent")}
      ${mechanisms.length ? `<div class="mechanism-pills">${mechanisms.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
    </div>
    ${actionButtons(investigator, investigator.team === "opponent")}
  </article>
`;
};

const opponentCard = (investigator: Investigator, state: GameState): string => {
  const isCurrent = getCurrentInvestigatorId(state) === investigator.id;
  const isTargetable = Boolean(state.pendingStrategy?.validTargetIds.includes(investigator.id));
  const isSelected = Boolean(state.pendingStrategy?.selectedTargetIds.includes(investigator.id));
  const sanValue = state.sanByInvestigator[investigator.id] ?? investigator.san;
  const mechanisms = state.mechanismsByInvestigator[investigator.id] ?? [];

  return `
  <article class="opponent-card relation-${investigator.relation} ${isCurrent ? "current-actor" : ""} ${isTargetable ? "targetable" : ""} ${isSelected ? "target-selected" : ""}" data-investigator="${investigator.id}">
    ${actionButtons(investigator, true)}
    <div class="opponent-copy">
      <h2>${investigator.name}</h2>
      <p>${[investigator.profession, ...investigator.traits].filter(Boolean).join(" / ")}</p>
      ${san(sanValue, investigator.maxSan, true)}
      ${mechanisms.length ? `<div class="mechanism-pills">${mechanisms.map((item) => `<span>${item}</span>`).join("")}</div>` : ""}
    </div>
    ${portrait(investigator, "opponent")}
  </article>
`;
};

const progress = (current: number): string => `
  <section class="top-panel progress-panel">
    <h1>情报进度</h1>
    <div class="progress-line">
      ${Array.from({ length: 25 }, (_, i) => {
        const value = i + 1;
        const hidden = [9, 17].includes(value);
        return `<span class="${value === current ? "active" : ""} ${hidden ? "compact-hide" : ""}">${value}</span>`;
      }).join("")}
    </div>
  </section>
`;

const orderPanel = (state: GameState): string => `
  <section class="top-panel order-panel">
    <h1>行动顺序</h1>
    <div class="order-track">
      ${state.turnOrder
        .map((id, index) => {
          const investigator = investigatorsById.get(id);
          if (!investigator) return "";
          return `${index > 0 ? '<b class="order-arrow">›</b>' : ""}<div class="order-token relation-${investigator.relation} ${index === state.currentOrderIndex ? "current" : ""}" title="${investigator.relation}">${portrait(investigator, "token")}<i></i></div>`;
        })
        .join("")}
    </div>
  </section>
`;

const strategyCard = (card: StrategyCard, index: number, used: boolean): string => `
  <button class="strategy-card card card-${index + 1} ${used ? "used" : ""}" type="button" data-card-id="${card.id}" title="${escapeAttr(card.effectText)}" ${assetStyle(card.asset)}>
    <span class="card-cost">${card.cost}</span>
    <strong>${card.name}</strong>
    <div class="card-art"><span>${card.name.slice(0, 2)}</span></div>
    <p>${card.tags.join(" / ")}</p>
    <div class="card-pips">
      ${Array.from({ length: 4 }, (_, i) => `<i class="${i < Math.max(1, card.cost) ? "filled" : ""}"></i>`).join("")}
    </div>
  </button>
`;

const deck = (title: string, asset: AssetRef): string => `
  <div class="deck-block">
    <h3>${title}</h3>
    <button class="deck-card" type="button" ${assetStyle(asset)} aria-label="${title}">
      <span></span>
    </button>
  </div>
`;

export const mountGame = (root: HTMLElement): void => {
  let state = initialGameState();
  let hasEntered = false;
  let lastDealAnimationId = -1;

  const render = () => {
    const playerTeam = investigators.filter((item) => item.team === "player");
    const opponentTeam = investigators.filter((item) => item.team === "opponent");
    const hand = state.handIds.map((id) => strategyCardsById.get(id)).filter((card): card is StrategyCard => Boolean(card));
    const currentInvestigator = investigatorsById.get(getCurrentInvestigatorId(state));

    root.innerHTML = `
      <main class="game-shell">
        <div class="stage-viewport">
        <div class="game-stage">
          <aside class="left-column">
            ${investigatorCard(playerTeam[0], state, true)}
            <div class="ally-list">
              ${playerTeam.slice(1).map((item) => investigatorCard(item, state)).join("")}
            </div>
            <section class="control-panel investigate-panel" role="button" tabindex="0" aria-label="执行调查区域" data-investigate-execute>
              <h2>调查（可进行1 - 3次）</h2>
              <div class="investigate-options">
                ${([1, 2, 3] as const)
                  .map((count) => `<button class="${state.selectedInvestigations === count ? "selected" : ""}" type="button" data-investigate-count="${count}">${count}次</button>`)
                  .join("")}
              </div>
            </section>
            <section class="control-panel points-panel">
              <h2>剩余情报</h2>
              <strong data-points>${state.intelligencePoints}</strong>
            </section>
          </aside>

          <section class="center-column">
            ${progress(state.intelligenceProgress)}
            ${orderPanel(state)}
            <section class="scene-panel" ${assetStyle(assetRefs.sceneMain)}>
              <div class="scene-vignette"></div>
              <div class="scene-gate">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="scene-sigil"></div>
              <div class="status-message ${state.pendingStrategy ? "targeting" : ""}">
                <strong>${currentInvestigator?.name ?? "调查员"}</strong>
                <span>${state.pendingStrategy?.prompt ?? state.message}</span>
                ${state.pendingStrategy ? '<button type="button" data-cancel-targeting>取消</button>' : ""}
              </div>
            </section>
            <section class="hand-area hand">
              ${hand.map((card, index) => strategyCard(card, index, false)).join("")}
            </section>
          </section>

          <aside class="right-column ${state.environmentExpanded ? "environment-open" : ""}">
            <div class="opponent-list">${opponentTeam.map((item) => opponentCard(item, state)).join("")}</div>
            <section class="environment-card ${state.environmentExpanded ? "expanded" : ""}" role="button" tabindex="0" aria-label="展开当前环境" data-environment-toggle ${assetStyle(currentEnvironment.asset)}>
              <div class="environment-thumb"></div>
              <div>
                <p>${currentEnvironment.subtitle}：</p>
                <h2>${currentEnvironment.name}</h2>
                <small>${currentEnvironment.effectText}</small>
              </div>
            </section>
            <section class="decks">
              ${deck("策略牌堆", assetRefs.strategyBack)}
              ${deck("策略弃牌堆", assetRefs.intelligenceBack)}
            </section>
            <section class="action-log ${state.logOpen ? "open" : ""}">
              <button type="button" data-log-toggle>
                <span>${iconSvg("archive")}</span>
                行动记录
                <b>⌄</b>
              </button>
              <ol>
                ${state.actionLog.map((item) => `<li>${item}</li>`).join("")}
              </ol>
            </section>
          </aside>
        </div>
        </div>
      </main>
    `;

    bindEvents(root, state, (next) => {
      state = next;
      render();
      animateUpdate(root);
    });

    window.render_game_to_text = () => renderStateSummary(state);
    window.advanceTime = () => undefined;

    if (!hasEntered) {
      hasEntered = true;
      animateEntrance(root, state.newlyDealtCardIds);
      lastDealAnimationId = state.dealAnimationId;
    } else if (lastDealAnimationId !== state.dealAnimationId) {
      layoutCards(true, state.newlyDealtCardIds);
      lastDealAnimationId = state.dealAnimationId;
    } else {
      layoutCards(false);
    }
  };

  render();
};

const bindEvents = (
  root: HTMLElement,
  state: GameState,
  setState: (next: GameState) => void
) => {
  root.querySelectorAll<HTMLButtonElement>("[data-investigate-count]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedInvestigations = Number(button.dataset.investigateCount) as 1 | 2 | 3;
      setState(selectInvestigationCount(state, selectedInvestigations));
    });
  });

  const executeInvestigation = () => {
    const result = investigate(state);
    setState(result.next);
    pulsePoints(root, `+${result.gained}`);
  };

  root.querySelector("[data-investigate-execute]")?.addEventListener("click", executeInvestigation);
  root.querySelector("[data-investigate-execute]")?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      executeInvestigation();
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-card-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const cardId = button.dataset.cardId;
      if (!cardId) return;

      const result = prepareStrategy(state, cardId);
      if (!result.ok) {
        gsap.fromTo(button, { x: -4 }, { x: 0, duration: 0.32, ease: "elastic.out(1, 0.2)" });
        setState(result.next);
        return;
      }

      setState(result.next);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-investigator]").forEach((card) => {
    card.addEventListener("click", () => {
      const investigatorId = card.dataset.investigator;
      if (!investigatorId || !state.pendingStrategy) return;
      const result = selectStrategyTarget(state, investigatorId);
      if (!result.ok) {
        gsap.fromTo(card, { x: -4 }, { x: 0, duration: 0.32, ease: "elastic.out(1, 0.2)" });
      }
      setState(result.next);
    });
  });

  root.querySelectorAll(".icon-button").forEach((button) => {
    button.addEventListener("click", (event) => event.stopPropagation());
  });

  root.querySelector("[data-cancel-targeting]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    setState(cancelPendingStrategy(state));
  });

  const toggleEnvironmentSection = () => setState(toggleEnvironment(state));
  root.querySelector("[data-environment-toggle]")?.addEventListener("click", toggleEnvironmentSection);
  root.querySelector("[data-environment-toggle]")?.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleEnvironmentSection();
    }
  });

  root.querySelector("[data-log-toggle]")?.addEventListener("click", () => {
    setState({ ...state, logOpen: !state.logOpen });
  });
};

const animateEntrance = (root: HTMLElement, newlyDealtIds: string[]) => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  gsap.defaults({ ease: "power3.out", duration: 0.7 });
  const tl = gsap.timeline();
  tl.from(".left-column, .right-column", { autoAlpha: 0, y: 18, stagger: 0.08 })
    .from(".top-panel", { autoAlpha: 0, y: -12, stagger: 0.08 }, "-=0.35")
    .from(".scene-gate span", { autoAlpha: 0, y: -18, stagger: 0.08 }, "-=0.3");

  layoutCards(true, newlyDealtIds);

  gsap.to(root.querySelectorAll(".scene-gate span"), {
    y: -8,
    autoAlpha: 0.35,
    repeat: -1,
    yoyo: true,
    stagger: 0.08,
    duration: 1.6,
    ease: "sine.inOut"
  });
};

const layoutCards = (animate: boolean, dealtIds: string[] = []) => {
  const handElement = document.querySelector(".hand");
  if (!handElement) return;

  const cards = Array.from(handElement.querySelectorAll<HTMLElement>(".card"));
  if (!cards.length) return;

  const count = cards.length;
  const center = (count - 1) / 2;
  const rotationSpread = 22;
  const finalVars = (index: number) => ({
    xPercent: -50,
    x: (index - center) * 70,
    y: (() => {
      const t = (index - center) / Math.max(center, 1);
      const f = -Math.abs(t);
      return -f * 18;
    })(),
    rotation: (index - center) * (rotationSpread / Math.max(count - 1, 1)),
    scale: 1
  });

  cards.forEach((card, index) => {
    gsap.set(card, {
      ...finalVars(index),
      transformOrigin: "50% 100%"
    });
  });

  if (!animate) return;

  const dealt = dealtIds.length ? cards.filter((card) => dealtIds.includes(card.dataset.cardId ?? "")) : cards;
  gsap.set(dealt, { xPercent: -50, x: -180, y: 120, rotation: -20, scale: 0.9, transformOrigin: "50% 100%" });

  const tl = gsap.timeline();
  dealt.forEach((card, sequenceIndex) => {
    const cardIndex = cards.indexOf(card);
    tl.to(card, { ...finalVars(cardIndex), duration: 0.7, ease: "power3.out" }, sequenceIndex * 0.06);
  });
};

const animateUpdate = (root: HTMLElement) => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  gsap.fromTo(root.querySelector("[data-points]"), { scale: 1.18 }, { scale: 1, duration: 0.45, ease: "back.out(2)" });
  gsap.fromTo(root.querySelector(".progress-line .active"), { scale: 1.4 }, { scale: 1, duration: 0.45, ease: "back.out(2)" });
};

const pulsePoints = (root: HTMLElement, label: string) => {
  const target = root.querySelector(".points-panel");
  if (!target) return;

  const marker = document.createElement("span");
  marker.className = "point-float";
  marker.textContent = label;
  target.append(marker);
  gsap.fromTo(
    marker,
    { autoAlpha: 0, y: 12, scale: 0.8 },
    {
      autoAlpha: 1,
      y: -38,
      scale: 1,
      duration: 0.75,
      ease: "power2.out",
      onComplete: () => marker.remove()
    }
  );
};
