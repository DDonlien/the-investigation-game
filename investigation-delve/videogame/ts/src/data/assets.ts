export type AssetSlot =
  | "portrait"
  | "card"
  | "cardBack"
  | "environment"
  | "scene";

export interface AssetRef {
  slot: AssetSlot;
  id: string;
  src: string | null;
  alt: string;
}

export const assetRefs: Record<string, AssetRef> = {
  sceneMain: {
    slot: "scene",
    id: "scene-main",
    src: null,
    alt: "当前调查场景"
  },
  strategyBack: {
    slot: "cardBack",
    id: "strategy-back",
    src: null,
    alt: "策略牌堆"
  },
  intelligenceBack: {
    slot: "cardBack",
    id: "intelligence-back",
    src: null,
    alt: "策略弃牌堆"
  },
  environmentCurrent: {
    slot: "environment",
    id: "environment-current",
    src: null,
    alt: "当前环境"
  }
};

export const portraitAsset = (investigatorId: string, name: string): AssetRef => ({
  slot: "portrait",
  id: `portrait-${investigatorId}`,
  src: null,
  alt: name
});

export const cardAsset = (cardId: string, name: string): AssetRef => ({
  slot: "card",
  id: `card-${cardId}`,
  src: null,
  alt: name
});
