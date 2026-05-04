import {
  actionOrder,
  intelligenceDeckEntries,
  investigators,
  investigatorsById,
  strategyCards,
  strategyCardsById,
  type StrategyCard
} from "../data/tableLoader";

export type PhaseState = "action" | "ended";
export type TargetKind = "none" | "self" | "investigator" | "opponentInvestigator" | "twoInvestigators";

export interface PendingStrategy {
  cardId: string;
  prompt: string;
  targetKind: TargetKind;
  requiredTargets: number;
  selectedTargetIds: string[];
  validTargetIds: string[];
}

export interface GameState {
  intelligenceProgress: number;
  intelligencePoints: number;
  deckCursor: number;
  intelligenceDiscardIds: string[];
  round: number;
  lastPreview: string[];
  selectedInvestigations: 1 | 2 | 3;
  logOpen: boolean;
  environmentExpanded: boolean;
  phase: PhaseState;
  currentOrderIndex: number;
  turnOrder: string[];
  handIds: string[];
  strategyDeckCursor: number;
  strategyDiscardIds: string[];
  newlyDealtCardIds: string[];
  dealAnimationId: number;
  pendingStrategy: PendingStrategy | null;
  mechanismsByInvestigator: Record<string, string[]>;
  sanByInvestigator: Record<string, number>;
  temporarySanByInvestigator: Record<string, number>;
  actionLog: string[];
  message: string;
}

interface PlayResult {
  next: GameState;
  ok: boolean;
  requiresTarget?: boolean;
  message?: string;
}

const initialHandSize = 5;
const operationDrawCount = 2;

const cardName = (id: string): string => strategyCardsById.get(id)?.name ?? id;
const investigatorName = (id: string): string => investigatorsById.get(id)?.name ?? id;

const appendLog = (state: GameState, entry: string): string[] => [entry, ...state.actionLog].slice(0, 8);

const nextStrategyIds = (cursor: number, count: number): string[] =>
  Array.from({ length: count }, (_, i) => strategyCards[(cursor + i) % strategyCards.length]?.id).filter(Boolean);

const drawStrategyCards = (state: GameState, count = operationDrawCount): GameState => {
  const drawn = nextStrategyIds(state.strategyDeckCursor, count);
  if (!drawn.length) return state;

  return {
    ...state,
    handIds: [...state.handIds, ...drawn],
    strategyDeckCursor: state.strategyDeckCursor + drawn.length,
    newlyDealtCardIds: drawn,
    dealAnimationId: state.dealAnimationId + 1,
    actionLog: appendLog(state, `${investigatorName(state.turnOrder[state.currentOrderIndex])} 操作阶段开始，抽取 ${drawn.length} 张策略。`)
  };
};

const currentInvestigatorId = (state: GameState): string => state.turnOrder[state.currentOrderIndex];

const activeMechanisms = (state: GameState, investigatorId: string): string[] =>
  state.mechanismsByInvestigator[investigatorId] ?? [];

const withoutMechanism = (state: GameState, investigatorId: string, mechanismName: string): GameState => {
  const current = activeMechanisms(state, investigatorId);
  const index = current.indexOf(mechanismName);
  if (index < 0) return state;
  const nextMechanisms = current.filter((_, i) => i !== index);
  return {
    ...state,
    mechanismsByInvestigator: {
      ...state.mechanismsByInvestigator,
      [investigatorId]: nextMechanisms
    }
  };
};

const isMad = (state: GameState, investigatorId: string): boolean => (state.sanByInvestigator[investigatorId] ?? 0) <= 0;

const entryAt = (cursor: number) => intelligenceDeckEntries[cursor % intelligenceDeckEntries.length];

const peekEntries = (cursor: number, count: number, fromBottom = false) =>
  Array.from({ length: count }, (_, i) => {
    const index = fromBottom
      ? (intelligenceDeckEntries.length - 1 - ((cursor + i) % intelligenceDeckEntries.length) + intelligenceDeckEntries.length) %
        intelligenceDeckEntries.length
      : (cursor + i) % intelligenceDeckEntries.length;
    return intelligenceDeckEntries[index];
  }).filter(Boolean);

const applySanLoss = (state: GameState, investigatorId: string, amount: number): GameState => {
  const investigator = investigatorsById.get(investigatorId);
  const current = state.sanByInvestigator[investigatorId] ?? investigator?.san ?? 0;
  const nextSan = Math.max(0, current - amount);
  const nextState: GameState = {
    ...state,
    sanByInvestigator: { ...state.sanByInvestigator, [investigatorId]: nextSan }
  };

  if (nextSan > 0) return nextState;

  return {
    ...nextState,
    mechanismsByInvestigator: {
      ...nextState.mechanismsByInvestigator,
      [investigatorId]: []
    },
    actionLog: appendLog(nextState, `${investigatorName(investigatorId)} 的 SAN 归零，陷入疯狂，弃置其身上的个体机制。`)
  };
};

const resolveInvestigation = (
  state: GameState,
  investigatorId: string,
  count: number,
  options: { fromBottom?: boolean; coercedBonus?: number } = {}
): { next: GameState; gained: number; revealed: string[]; forbidden: boolean } => {
  const totalCount = Math.max(0, count + (options.coercedBonus ?? 0));
  const revealed = peekEntries(state.deckCursor, totalCount, options.fromBottom);
  const gained = revealed.reduce((sum, entry) => sum + entry.points, 0);
  const forbidden = revealed.some((entry) => entry.isForbiddenTruth);
  const discardIds = revealed.map((entry) => entry.id);
  let next: GameState = {
    ...state,
    deckCursor: state.deckCursor + totalCount,
    intelligenceDiscardIds: [...discardIds, ...state.intelligenceDiscardIds].slice(0, 40),
    intelligencePoints: state.intelligencePoints + gained,
    intelligenceProgress: Math.min(25, state.intelligenceProgress + totalCount),
    lastPreview: revealed.map((entry) => (entry.isForbiddenTruth ? "禁忌真相" : `${entry.points}点情报`))
  };

  if (forbidden) {
    const mechanisms = activeMechanisms(next, investigatorId);
    const seesGod = mechanisms.includes("直视神 · I");
    if (seesGod) {
      next = withoutMechanism(next, investigatorId, "直视神 · I");
      next = {
        ...next,
        message: `${investigatorName(investigatorId)} 调查到【禁忌真相】，但【直视神 · I】将其洗回，本轮继续。`
      };
    } else {
      const sinking = mechanisms.includes("沉沦 · I");
      const currentSan = next.sanByInvestigator[investigatorId] ?? 0;
      const sanLoss = sinking ? 2 : 1;
      if (sinking && currentSan <= 1) {
        next = withoutMechanism(next, investigatorId, "沉沦 · I");
        const target = investigatorsById.get(investigatorId);
        next = {
          ...next,
          sanByInvestigator: {
            ...next.sanByInvestigator,
            [investigatorId]: Math.min(target?.maxSan ?? currentSan, currentSan + 1)
          },
          round: next.round + 1,
          deckCursor: 0,
          message: `${investigatorName(investigatorId)} 调查到【禁忌真相】，【沉沦 · I】改为恢复 1 点 SAN，新一轮开始。`
        };
      } else {
        next = applySanLoss(withoutMechanism(next, investigatorId, "沉沦 · I"), investigatorId, sanLoss);
        next = {
          ...next,
          round: next.round + 1,
          deckCursor: 0,
          message: `${investigatorName(investigatorId)} 调查到【禁忌真相】，消耗 ${sanLoss} 点 SAN，新一轮开始。`
        };
      }
    }
  }

  return { next, gained, revealed: next.lastPreview, forbidden };
};

export const initialGameState = (): GameState => {
  const handIds = strategyCards.slice(0, initialHandSize).map((card) => card.id);
  const sanByInvestigator = Object.fromEntries(investigators.map((investigator) => [investigator.id, investigator.san]));
  const base: GameState = {
    intelligenceProgress: 1,
    intelligencePoints: 0,
    deckCursor: 0,
    intelligenceDiscardIds: [],
    round: 1,
    lastPreview: [],
    selectedInvestigations: 2,
    logOpen: false,
    environmentExpanded: false,
    phase: "action",
    currentOrderIndex: 0,
    turnOrder: [...actionOrder],
    handIds,
    strategyDeckCursor: handIds.length,
    strategyDiscardIds: [],
    newlyDealtCardIds: [],
    dealAnimationId: 0,
    pendingStrategy: null,
    mechanismsByInvestigator: {},
    sanByInvestigator,
    temporarySanByInvestigator: {},
    actionLog: ["游戏开始。情报进度从 1 开始。"],
    message: "当前调查员进入操作阶段。"
  };

  return drawStrategyCards(base);
};

export const getCurrentInvestigatorId = currentInvestigatorId;

export const selectInvestigationCount = (state: GameState, selectedInvestigations: 1 | 2 | 3): GameState => ({
  ...state,
  selectedInvestigations,
  message: `已选择调查 ${selectedInvestigations} 步。`
});

const advanceOperation = (state: GameState): GameState => {
  let currentIndex = state.currentOrderIndex;
  let guard = 0;
  let nextState = state;

  do {
    currentIndex = (currentIndex + 1) % nextState.turnOrder.length;
    const investigatorId = nextState.turnOrder[currentIndex];
    const mechanisms = activeMechanisms(nextState, investigatorId);
    if (isMad(nextState, investigatorId)) {
      nextState = {
        ...nextState,
        actionLog: appendLog(nextState, `${investigatorName(investigatorId)} 已陷入疯狂，跳过其操作阶段。`)
      };
      guard += 1;
      continue;
    }
    if (mechanisms.includes("异时癖 · I")) {
      nextState = withoutMechanism(nextState, investigatorId, "异时癖 · I");
      nextState = {
        ...nextState,
        actionLog: appendLog(nextState, `${investigatorName(investigatorId)} 的【异时癖 · I】生效，直接跳过其操作阶段。`)
      };
      guard += 1;
      continue;
    }
    break;
  } while (guard < nextState.turnOrder.length);

  const investigatorId = nextState.turnOrder[currentIndex];
  const blind = activeMechanisms(nextState, investigatorId).includes("盲从 · I");
  const started: GameState = {
    ...nextState,
    currentOrderIndex: currentIndex,
    phase: "action",
    selectedInvestigations: 2,
    pendingStrategy: null,
    message: blind
      ? `${investigatorName(investigatorId)} 进入操作阶段，受【盲从 · I】影响，必须首先调查。`
      : `${investigatorName(investigatorId)} 进入操作阶段。`
  };

  return drawStrategyCards(started);
};

export const investigate = (state: GameState): { next: GameState; gained: number } => {
  if (state.phase !== "action") {
    return { gained: 0, next: { ...state, message: "当前不在可调查的操作阶段。" } };
  }

  const investigatorId = currentInvestigatorId(state);
  const mechanisms = activeMechanisms(state, investigatorId);
  const rangeBonus = mechanisms.includes("沉沦 · II") ? 1 : 0;
  const coerced = mechanisms.find((item) => item.startsWith("胁迫 +"));
  const coercedBonus = coerced ? Number.parseInt(coerced.replace(/[^\d]/g, ""), 10) || 0 : 0;
  const count = state.selectedInvestigations + rangeBonus;
  let result = resolveInvestigation(state, investigatorId, count, { coercedBonus });
  let resolvedState = result.next;

  if (coerced) {
    resolvedState = withoutMechanism(resolvedState, investigatorId, coerced);
  }
  if (mechanisms.includes("盲从 · I")) {
    resolvedState = withoutMechanism(resolvedState, investigatorId, "盲从 · I");
  }

  const afterInvestigation: GameState = {
    ...resolvedState,
    phase: "ended",
    pendingStrategy: null,
    message: `${investigatorName(currentInvestigatorId(state))} 完成调查，操作阶段结束。`,
    actionLog: appendLog(
      resolvedState,
      `${investigatorName(currentInvestigatorId(state))} 调查 ${count + coercedBonus} 张，获得 ${result.gained} 点情报。`
    )
  };

  return { gained: result.gained, next: advanceOperation(afterInvestigation) };
};

const targetDescriptorFor = (card: StrategyCard, state: GameState): PendingStrategy => {
  const text = card.effectText;
  const selfId = currentInvestigatorId(state);
  const blocked = new Set(
    Object.entries(state.mechanismsByInvestigator)
      .filter(([, mechanisms]) => mechanisms.includes("不可直视神 · I"))
      .map(([id]) => id)
  );
  const legalInvestigators = investigators
    .filter((investigator) => !isMad(state, investigator.id) && (investigator.id === selfId || !blocked.has(investigator.id)))
    .map((investigator) => investigator.id);
  const otherInvestigators = legalInvestigators.filter((id) => id !== selfId);
  const opponentIds = investigators
    .filter((investigator) => !isMad(state, investigator.id) && investigator.team !== investigatorsById.get(selfId)?.team && !blocked.has(investigator.id))
    .map((investigator) => investigator.id);

  if (card.name === "献祭 · II") {
    return {
      cardId: card.id,
      targetKind: "investigator",
      requiredTargets: 1,
      selectedTargetIds: [],
      validTargetIds: legalInvestigators.filter((id) => (state.sanByInvestigator[id] ?? 0) > 1),
      prompt: `请选择 1 位 SAN 大于 1 的调查员，结算【${card.name}】。`
    };
  }

  if (text.includes("指定另(1)位「调查员」")) {
    return {
      cardId: card.id,
      targetKind: "investigator",
      requiredTargets: 1,
      selectedTargetIds: [],
      validTargetIds: otherInvestigators,
      prompt: `请选择另 1 位调查员，结算【${card.name}】。`
    };
  }

  if (text.includes("指定(1)位其他队伍的「调查员」")) {
    return {
      cardId: card.id,
      targetKind: "opponentInvestigator",
      requiredTargets: 1,
      selectedTargetIds: [],
      validTargetIds: opponentIds,
      prompt: `请选择 1 位其他队伍调查员，结算【${card.name}】。`
    };
  }

  if (text.includes("交换任意(2)位「调查员」")) {
    return {
      cardId: card.id,
      targetKind: "twoInvestigators",
      requiredTargets: 2,
      selectedTargetIds: [],
      validTargetIds: legalInvestigators,
      prompt: `请选择 2 位调查员交换调查顺位。`
    };
  }

  if (text.includes("指定(1)位「调查员」") || text.includes("对(1)位「调查员」布置")) {
    return {
      cardId: card.id,
      targetKind: "investigator",
      requiredTargets: 1,
      selectedTargetIds: [],
      validTargetIds: legalInvestigators,
      prompt: `请选择 1 位调查员，结算【${card.name}】。`
    };
  }

  if (text.includes("对你自己布置") || text.includes("对自己使用")) {
    return {
      cardId: card.id,
      targetKind: "self",
      requiredTargets: 1,
      selectedTargetIds: [selfId],
      validTargetIds: [selfId],
      prompt: `【${card.name}】将对当前调查员自己生效。`
    };
  }

  return {
    cardId: card.id,
    targetKind: "none",
    requiredTargets: 0,
    selectedTargetIds: [],
    validTargetIds: [],
    prompt: `【${card.name}】无需指定调查员。`
  };
};

const removeFromHand = (state: GameState, cardId: string): GameState => {
  const index = state.handIds.indexOf(cardId);
  if (index < 0) return state;
  return {
    ...state,
    handIds: state.handIds.filter((_, i) => i !== index),
    strategyDiscardIds: [cardId, ...state.strategyDiscardIds]
  };
};

const payForCard = (state: GameState, card: StrategyCard): PlayResult => {
  if (!state.handIds.includes(card.id)) {
    return { ok: false, next: { ...state, message: "这张策略不在当前手牌中。" } };
  }
  const dynamicCost = card.name === "胁迫 · I" ? Math.min(Math.max(state.selectedInvestigations, 1), state.intelligencePoints) : card.cost;
  if (state.intelligencePoints < dynamicCost) {
    return { ok: false, next: { ...state, message: `情报不足：需要 ${card.cost}，当前 ${state.intelligencePoints}。` } };
  }
  return {
    ok: true,
    next: {
      ...removeFromHand(state, card.id),
      intelligencePoints: state.intelligencePoints - dynamicCost
    }
  };
};

const withMechanism = (state: GameState, targetId: string, mechanismName: string): GameState => ({
  ...state,
  mechanismsByInvestigator: {
    ...state.mechanismsByInvestigator,
    [targetId]: [...(state.mechanismsByInvestigator[targetId] ?? []), mechanismName]
  }
});

const endCurrentOperation = (state: GameState, reason: string): GameState =>
  advanceOperation({
    ...state,
    phase: "ended",
    pendingStrategy: null,
    message: reason,
    actionLog: appendLog(state, reason)
  });

const moveCardToDeckBottom = (state: GameState, cardId: string): GameState => ({
  ...state,
  strategyDiscardIds: state.strategyDiscardIds.filter((id) => id !== cardId)
});

const resolveKnownEffect = (state: GameState, card: StrategyCard, targetIds: string[]): GameState => {
  let next = state;
  const selfId = currentInvestigatorId(state);
  const text = card.effectText;
  const firstTargetId = targetIds[0];

  if (firstTargetId && firstTargetId !== selfId && activeMechanisms(next, firstTargetId).includes("照亮前路 · I")) {
    next = withoutMechanism(next, firstTargetId, "照亮前路 · I");
    return {
      ...next,
      pendingStrategy: null,
      newlyDealtCardIds: [],
      message: `${investigatorName(firstTargetId)} 的【照亮前路 · I】使【${card.name}】无效。`,
      actionLog: appendLog(next, `${investigatorName(selfId)} 使用【${card.name}】，被【照亮前路 · I】无效并弃置。`)
    };
  }

  if (card.name === "布局 · I") {
    const targetId = targetIds[0];
    const mechanisms = [...(next.mechanismsByInvestigator[targetId] ?? [])];
    const removed = mechanisms.shift();
    const extraDiscard = next.handIds.find((id) => id !== card.id);
    next = {
      ...next,
      handIds: extraDiscard ? next.handIds.filter((id) => id !== extraDiscard) : next.handIds,
      strategyDiscardIds: extraDiscard ? [extraDiscard, ...next.strategyDiscardIds] : next.strategyDiscardIds,
      mechanismsByInvestigator: { ...next.mechanismsByInvestigator, [targetId]: mechanisms },
      message: removed
        ? `弃置一张手牌，并移除 ${investigatorName(targetId)} 身上的【${removed}】。`
        : `${investigatorName(targetId)} 身上没有可移除的个体机制。`
    };
  } else if (card.name === "胁迫 · I") {
    const targetId = targetIds[0] ?? selfId;
    const amount = Math.min(Math.max(state.selectedInvestigations, 1), state.intelligencePoints + Math.max(card.cost, 0));
    next = withMechanism(next, targetId, `胁迫 +${amount}`);
    next = { ...next, message: `【${card.name}】已布置到 ${investigatorName(targetId)}，其下一次调查受到胁迫 +${amount}。` };
  } else if (card.type === "个体机制" || text.includes("布置")) {
    const targetId = targetIds[0] ?? selfId;
    next = withMechanism(next, targetId, card.name);
    if (card.name === "虚假信仰 · I") {
      const bonus = Object.fromEntries(
        investigators
          .filter((investigator) => !isMad(next, investigator.id) && (next.sanByInvestigator[investigator.id] ?? 0) < investigator.maxSan)
          .map((investigator) => [investigator.id, 1])
      );
      next = { ...next, temporarySanByInvestigator: bonus };
    }
    next = { ...next, message: `【${card.name}】已布置到 ${investigatorName(targetId)}。` };
  } else if (card.name === "反转 · I" || card.name === "反转 · II") {
    const currentId = currentInvestigatorId(next);
    const turnOrder = [...next.turnOrder].reverse();
    next = {
      ...next,
      turnOrder,
      currentOrderIndex: Math.max(0, turnOrder.indexOf(currentId)),
      message: card.name === "反转 · II" ? "调查顺位已反转，并记录跳过效果。" : "调查顺位已反转。"
    };
    if (card.name === "反转 · II") {
      return endCurrentOperation(next, `${investigatorName(selfId)} 使用【反转 · II】，反转调查顺位并跳过当前操作阶段。`);
    }
  } else if (card.name === "回溯 · I") {
    const recovered = next.intelligenceDiscardIds[0];
    next = {
      ...next,
      intelligenceDiscardIds: recovered ? next.intelligenceDiscardIds.slice(1) : next.intelligenceDiscardIds,
      lastPreview: recovered ? [`已从情报弃牌区调整 ${recovered}`] : [],
      message: recovered
        ? "已从情报弃牌区选取 1 张情报并调整到卡组顶部。"
        : "情报弃牌区为空，【回溯 · I】仅记录使用。"
    };
  } else if (card.name === "禁忌仪式 · I") {
    next = {
      ...next,
      lastPreview: ["辅助：禁忌仪式已插入情报卡组"],
      message: "已将【禁忌仪式】作为辅助事件插入情报卡组；具体位置在当前原型中按顶部待结算。"
    };
  } else if (card.name === "砥砺前行 · I") {
    const gathered = Object.values(next.mechanismsByInvestigator).flat();
    next = {
      ...next,
      mechanismsByInvestigator: gathered.length ? { [selfId]: gathered } : {},
      message: gathered.length ? "场上所有个体机制已转移到当前调查员。" : "场上没有个体机制可转移。"
    };
  } else if (card.name === "破釜沉舟 · I") {
    next = { ...next, mechanismsByInvestigator: {}, temporarySanByInvestigator: {}, message: "已弃置场上所有个体机制。" };
  } else if (card.name === "破釜沉舟 · II") {
    next = { ...next, strategyDiscardIds: [...next.handIds, ...next.strategyDiscardIds], handIds: [], message: "已弃置所有当前手牌。" };
  } else if (card.name === "跳过 · I") {
    return endCurrentOperation(next, `${investigatorName(selfId)} 使用【跳过 · I】，当前操作阶段结束。`);
  } else if (card.name === "平衡 · I" || card.name === "平衡 · II" || card.name === "平衡 · III") {
    next = drawStrategyCards(next, 2);
    next = { ...next, message: `【${card.name}】抽取 2 张策略。${card.name !== "平衡 · I" ? "多人指挥者差异在当前原型中折算为当前手牌。" : ""}` };
  } else if (card.name === "埋葬过去 · I") {
    const extraDiscards = next.handIds.slice(0, 2);
    const recoverable = next.strategyDiscardIds.filter((id) => id !== card.id).slice(0, 2);
    next = {
      ...next,
      handIds: [...next.handIds.filter((id) => !extraDiscards.includes(id)), ...recoverable],
      strategyDiscardIds: [
        ...extraDiscards,
        ...next.strategyDiscardIds.filter((id) => !recoverable.includes(id) && id !== card.id)
      ],
      message: `弃置 ${extraDiscards.length} 张手牌，并从策略弃牌区回收 ${recoverable.length} 张策略。`
    };
  } else if (card.name === "圆滑 · I" && targetIds.length === 2) {
    const [a, b] = targetIds;
    const turnOrder = next.turnOrder.map((id) => (id === a ? b : id === b ? a : id));
    next = { ...next, turnOrder, currentOrderIndex: turnOrder.indexOf(selfId), message: `${investigatorName(a)} 与 ${investigatorName(b)} 的调查顺位已交换。` };
  } else if (card.name === "献祭 · I" || card.name === "献祭 · II") {
    const targetId = targetIds[0];
    const target = investigatorsById.get(targetId);
    const selfSan = Math.max(0, (next.sanByInvestigator[selfId] ?? 0) - 1);
    const targetSan =
      card.name === "献祭 · I"
        ? Math.min(target?.maxSan ?? 0, (next.sanByInvestigator[targetId] ?? 0) + 1)
        : Math.max(0, (next.sanByInvestigator[targetId] ?? 0) - 1);
    next = {
      ...next,
      sanByInvestigator: { ...next.sanByInvestigator, [selfId]: selfSan, [targetId]: targetSan },
      message: `【${card.name}】已结算 SAN。`
    };
  } else if (card.name === "傀儡 · I") {
    const targetId = targetIds[0];
    const count = next.selectedInvestigations;
    const first = resolveInvestigation(next, selfId, count);
    const second = resolveInvestigation(first.next, targetId, count);
    next = {
      ...second.next,
      message: `【傀儡 · I】使 ${investigatorName(selfId)} 与 ${investigatorName(targetId)} 各调查 ${count} 张，共获得 ${
        first.gained + second.gained
      } 点情报。`
    };
  } else if (card.name === "俄罗斯转轮 · I") {
    const targetId = targetIds[0];
    let rouletteState = next;
    let totalGained = 0;
    for (let i = 0; i < 6; i += 1) {
      const investigatorId = i % 2 === 0 ? selfId : targetId;
      const result = resolveInvestigation(rouletteState, investigatorId, 1);
      rouletteState = result.next;
      totalGained += result.gained;
      if (result.forbidden) break;
    }
    next = {
      ...rouletteState,
      message: `【俄罗斯转轮 · I】自动结算轮流调查，累计获得 ${totalGained} 点情报。拒绝调查分支待后续加入确认控件。`
    };
  } else if (card.name.startsWith("窥探")) {
    const roll = (next.deckCursor % 6) + 1;
    const count = card.name === "窥探 · II" || card.name === "窥探 · IV" ? roll : 3;
    const fromBottom = card.name === "窥探 · III" || card.name === "窥探 · IV";
    const preview = peekEntries(next.deckCursor, count, fromBottom).map((entry) =>
      entry.isForbiddenTruth ? "禁忌真相" : `${entry.points}点情报`
    );
    next = { ...next, lastPreview: preview, message: `窥探结果：${preview.join(" / ")}。` };
  } else if (card.name === "凝视 · I") {
    const preview = peekEntries(next.deckCursor, 2).map((entry) => (entry.isForbiddenTruth ? "禁忌真相" : `${entry.points}点情报`));
    next = { ...next, lastPreview: preview, message: `正向窥探并调整 2 张：${preview.join(" / ")}。当前原型保留原顺序。` };
  } else if (card.name === "调整 · I") {
    const index = Math.max(1, Math.min(6, next.selectedInvestigations));
    const preview = peekEntries(next.deckCursor + index - 1, 1).map((entry) => (entry.isForbiddenTruth ? "禁忌真相" : `${entry.points}点情报`));
    next = { ...next, lastPreview: preview, message: `窥探第 ${index} 张并调整：${preview.join(" / ")}。当前原型保留原顺序。` };
  } else if (card.name === "内化 · I") {
    const remaining = Math.max(0, intelligenceDeckEntries.length - (next.deckCursor % intelligenceDeckEntries.length));
    const discardCount = Math.floor(remaining / 2);
    const discarded = peekEntries(next.deckCursor, discardCount);
    next = {
      ...next,
      deckCursor: next.deckCursor + discardCount,
      intelligenceDiscardIds: [...discarded.map((entry) => entry.id), ...next.intelligenceDiscardIds].slice(0, 40),
      lastPreview: [`弃置 ${discardCount} 张情报${discarded.some((entry) => entry.isForbiddenTruth) ? "，禁忌真相已洗回剩余卡组" : ""}`],
      message: `已从顶部弃置剩余情报卡组的一半，共 ${discardCount} 张。`
    };
  } else if (card.name === "偷天换日 · I") {
    next = { ...next, message: "已记录与另一位指挥者交换手牌；当前单机原型将在操作阶段结束时自动视作换回。" };
  } else if (card.name === "信仰 · I") {
    const extraDiscards = next.handIds.slice(0, 2);
    next = {
      ...next,
      handIds: next.handIds.filter((id) => !extraDiscards.includes(id)),
      strategyDiscardIds: [...extraDiscards, ...next.strategyDiscardIds],
      intelligencePoints: next.intelligencePoints + 1,
      message: `弃置 ${extraDiscards.length} 张手牌，并从其他队伍情报区取得 1 点情报。`
    };
  } else if (card.name === "俄罗斯转轮 · I") {
    next = { ...next, message: `已指定 ${investigatorName(targetIds[0])}。俄罗斯转轮的连续调查/拒绝分支已进入待确认流程。` };
  } else {
    next = { ...next, message: `【${card.name}】已支付并记录。复杂分支按卡面文本待进一步界面化。` };
  }

  return {
    ...next,
    pendingStrategy: null,
    newlyDealtCardIds: [],
    actionLog: appendLog(next, `${investigatorName(selfId)} 使用【${card.name}】。${next.message}`)
  };
};

export const prepareStrategy = (state: GameState, cardId: string): PlayResult => {
  const card = strategyCardsById.get(cardId);
  if (!card) return { ok: false, next: { ...state, message: "找不到策略卡牌数据。" } };
  if (state.phase !== "action") {
    return { ok: false, next: { ...state, message: "当前操作阶段已经结束，不能继续使用策略。" } };
  }
  const currentId = currentInvestigatorId(state);
  if (activeMechanisms(state, currentId).includes("盲从 · I")) {
    return { ok: false, next: { ...state, message: "当前调查员受到【盲从 · I】影响，必须首先进行调查。" } };
  }
  if (!state.handIds.includes(card.id)) {
    return { ok: false, next: { ...state, message: "这张策略不在当前手牌中。" } };
  }
  const previewCost = card.name === "胁迫 · I" ? Math.min(Math.max(state.selectedInvestigations, 1), state.intelligencePoints) : card.cost;
  if (state.intelligencePoints < previewCost) {
    return { ok: false, next: { ...state, message: `情报不足：需要 ${previewCost}，当前 ${state.intelligencePoints}。` } };
  }

  const descriptor = targetDescriptorFor(card, state);
  if (descriptor.requiredTargets > 0 && descriptor.validTargetIds.length < descriptor.requiredTargets) {
    return { ok: false, next: { ...state, message: `没有合法目标可结算【${card.name}】。` } };
  }
  if (descriptor.requiredTargets > 0 && descriptor.targetKind !== "self") {
    return {
      ok: true,
      requiresTarget: true,
      next: {
        ...state,
        pendingStrategy: descriptor,
        message: descriptor.prompt
      }
    };
  }

  return resolveStrategy(state, cardId, descriptor.selectedTargetIds);
};

export const selectStrategyTarget = (state: GameState, investigatorId: string): PlayResult => {
  const pending = state.pendingStrategy;
  if (!pending) return { ok: false, next: state };
  if (!pending.validTargetIds.includes(investigatorId)) {
    return { ok: false, next: { ...state, message: "该调查员不是此策略的合法目标。" } };
  }

  const selectedTargetIds = pending.selectedTargetIds.includes(investigatorId)
    ? pending.selectedTargetIds
    : [...pending.selectedTargetIds, investigatorId];

  if (selectedTargetIds.length < pending.requiredTargets) {
    return {
      ok: true,
      requiresTarget: true,
      next: {
        ...state,
        pendingStrategy: { ...pending, selectedTargetIds },
        message: `已选择 ${selectedTargetIds.length}/${pending.requiredTargets} 个目标。`
      }
    };
  }

  return resolveStrategy(state, pending.cardId, selectedTargetIds);
};

export const cancelPendingStrategy = (state: GameState): GameState => ({
  ...state,
  pendingStrategy: null,
  message: "已取消策略目标选择。"
});

export const resolveStrategy = (state: GameState, cardId: string, targetIds: string[] = []): PlayResult => {
  const card = strategyCardsById.get(cardId);
  if (!card) return { ok: false, next: { ...state, message: "找不到策略卡牌数据。" } };

  const payment = payForCard(state, card);
  if (!payment.ok) return payment;

  return { ok: true, next: resolveKnownEffect(payment.next, card, targetIds) };
};

export const toggleEnvironment = (state: GameState): GameState => ({
  ...state,
  environmentExpanded: !state.environmentExpanded,
  message: state.environmentExpanded ? "已收起环境效果。" : "已展开环境效果。"
});

export const renderStateSummary = (state: GameState): string =>
  JSON.stringify({
    round: state.round,
    progress: state.intelligenceProgress,
    intelligencePoints: state.intelligencePoints,
    currentInvestigator: investigatorName(currentInvestigatorId(state)),
    phase: state.phase,
    selectedInvestigations: state.selectedInvestigations,
    hand: state.handIds.map(cardName),
    turnOrder: state.turnOrder.map(investigatorName),
    san: Object.fromEntries(Object.entries(state.sanByInvestigator).map(([id, value]) => [investigatorName(id), value])),
    mechanisms: Object.fromEntries(
      Object.entries(state.mechanismsByInvestigator)
        .filter(([, values]) => values.length)
        .map(([id, values]) => [investigatorName(id), values])
    ),
    lastPreview: state.lastPreview,
    discardCount: state.strategyDiscardIds.length,
    intelligenceDiscardCount: state.intelligenceDiscardIds.length,
    pendingStrategy: state.pendingStrategy?.prompt ?? null,
    pendingTargets: state.pendingStrategy?.validTargetIds.map(investigatorName) ?? [],
    environmentExpanded: state.environmentExpanded,
    message: state.message
  });
