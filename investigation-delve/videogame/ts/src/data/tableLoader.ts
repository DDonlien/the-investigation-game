import { cardAsset, portraitAsset, type AssetRef } from "./assets";
import registry from "./implementationRegistry.json";
import investigatorsCsv from "../../../../boardgame/game-design/调查深入-卡牌统计表/调查员.csv?raw";
import strategyCardsCsv from "../../../../boardgame/game-design/调查深入-卡牌统计表/策略卡牌.csv?raw";
import environmentCardsCsv from "../../../../boardgame/game-design/调查深入-卡牌统计表/环境卡牌.csv?raw";
import supportCardsCsv from "../../../../boardgame/game-design/调查深入-卡牌统计表/辅助卡牌.csv?raw";
import intelligenceCardsCsv from "../../../../boardgame/game-design/调查深入-卡牌统计表/情报卡牌.csv?raw";

export type TeamId = "player" | "opponent";
export type InvestigatorRelation = "self" | "ally" | "opponent";
export type ImplementationStatus = "implemented" | "stub" | "pending";

export interface ImplementationRef {
  effectHook?: string;
  awakeSkillHook?: string;
  madnessSkillHook?: string;
  status: ImplementationStatus;
}

export interface TableLinkedRecord {
  id: string;
  sourceTable: string;
  sourceName: string;
  version: string;
  implementation: ImplementationRef;
}

export interface Investigator extends TableLinkedRecord {
  name: string;
  profession: string;
  traits: string[];
  san: number;
  maxSan: number;
  team: TeamId;
  relation: InvestigatorRelation;
  active?: boolean;
  portrait: AssetRef;
  actions: string[];
  awakeSkill: string;
  madnessSkill: string;
}

export interface StrategyCard extends TableLinkedRecord {
  name: string;
  type: string;
  cost: number;
  count: number;
  effectText: string;
  tags: string[];
  asset: AssetRef;
}

export interface EnvironmentCard extends TableLinkedRecord {
  name: string;
  effectText: string;
  subtitle: string;
  asset: AssetRef;
}

export interface SupportCard extends TableLinkedRecord {
  name: string;
  actualType: string;
  cost: number;
  count: number;
  effectText: string;
  asset: AssetRef;
}

export interface IntelligenceCard extends TableLinkedRecord {
  name: string;
  points: number;
  count: number;
  effectText: string;
  isForbiddenTruth: boolean;
}

export interface IntelligenceDeckEntry {
  id: string;
  name: string;
  points: number;
  isForbiddenTruth: boolean;
}

type Row = Record<string, string>;
type RegistryBucket = Record<string, ImplementationRef>;
type ImplementationRegistry = {
  investigators: RegistryBucket;
  strategyCards: RegistryBucket;
  environmentCards: RegistryBucket;
  supportCards: RegistryBucket;
};

const implementationRegistry = registry as ImplementationRegistry;

const csvTables = {
  investigators: "调查员.csv",
  strategyCards: "策略卡牌.csv",
  environmentCards: "环境卡牌.csv",
  supportCards: "辅助卡牌.csv",
  intelligenceCards: "情报卡牌.csv"
} as const;

const parseCsv = (text: string): Row[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) =>
    headers.reduce<Row>((record, header, index) => {
      if (header) record[header] = (values[index] ?? "").trim();
      return record;
    }, {})
  );
};

const slugify = (value: string): string => {
  const normalized: Record<string, string> = {
    布局: "bu-ju",
    不可直视神: "bu-ke-zhi-shi-shen",
    沉沦: "chen-lun",
    砥砺前行: "di-li-qian-xing",
    俄罗斯转轮: "e-luo-si-zhuan-lun",
    反转: "fan-zhuan",
    蛮横无理: "man-heng-wu-li",
    欲加之罪: "yu-jia-zhi-zui"
  };

  const cleaned = value
    .replace(/[【】「」"“”]/g, "")
    .replace(/ · /g, "-")
    .replace(/\s+/g, "-")
    .trim();

  for (const [source, target] of Object.entries(normalized)) {
    if (cleaned.startsWith(source)) {
      return cleaned.replace(source, target).replace(/Ⅰ/g, "i").replace(/Ⅱ/g, "ii").replace(/III/g, "iii").replace(/II/g, "ii").replace(/I/g, "i").toLowerCase();
    }
  }

  return Array.from(cleaned)
    .map((char) => {
      if (/[\w-]/.test(char)) return char.toLowerCase();
      const code = char.codePointAt(0)?.toString(36) ?? "x";
      return `u${code}`;
    })
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const numberFrom = (value: string, fallback = 0): number => {
  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const implementationFor = (bucket: RegistryBucket | undefined, id: string): ImplementationRef =>
  bucket?.[id] ?? bucket?.["*"] ?? { effectHook: "pending.unregistered", status: "pending" };

const rowsWithName = (csv: string, nameKey: "姓名" | "名称"): Row[] =>
  parseCsv(csv).filter((row) => Boolean(row[nameKey]?.trim()));

const tagFromEffect = (effectText: string, fallback: string): string[] => {
  const tags = ["调查", "窥探", "调整", "跳过", "反转", "胁迫", "盲从", "回收"].filter((tag) =>
    effectText.includes(tag)
  );
  return tags.length ? tags : [fallback].filter(Boolean);
};

const investigatorRows = rowsWithName(investigatorsCsv, "姓名");
const strategyRows = rowsWithName(strategyCardsCsv, "名称");
const environmentRows = rowsWithName(environmentCardsCsv, "名称");
const supportRows = rowsWithName(supportCardsCsv, "名称");
const intelligenceRows = rowsWithName(intelligenceCardsCsv, "名称");

export const investigators: Investigator[] = investigatorRows.slice(0, 7).map((row, index) => {
  const name = row["姓名"];
  const id = slugify(name);
  const san = numberFrom(row["「SAN」"], 3);

  return {
    id,
    sourceTable: csvTables.investigators,
    sourceName: name,
    version: row["包含版本"] ?? "",
    implementation: implementationFor(implementationRegistry.investigators, id),
    name,
    profession: row["职业"] ?? "",
    traits: (row["调查风格"] ?? "").split(",").filter(Boolean),
    san,
    maxSan: san,
    team: index < 4 ? "player" : "opponent",
    relation: index === 0 ? "self" : index < 4 ? "ally" : "opponent",
    active: index === 0,
    portrait: portraitAsset(id, name),
    actions: ["skill", "archive", "effect"],
    awakeSkill: row["清醒技能"] ?? "",
    madnessSkill: row["疯狂技能"] ?? ""
  };
});

export const strategyCards: StrategyCard[] = strategyRows.map((row) => {
  const name = row["名称"];
  const id = slugify(name);
  const type = row["策略类型"] ?? "";
  const effectText = row["卡牌效果"] ?? "";

  return {
    id,
    sourceTable: csvTables.strategyCards,
    sourceName: name,
    version: row["包含版本"] ?? "",
    implementation: implementationFor(implementationRegistry.strategyCards, id),
    name,
    type,
    cost: numberFrom(row["单张费用消耗"]),
    count: numberFrom(row["数量"], 1),
    effectText,
    tags: tagFromEffect(effectText, type),
    asset: cardAsset(id, name)
  };
});

export const environmentCards: EnvironmentCard[] = environmentRows.map((row) => {
  const name = row["名称"];
  const id = slugify(name);

  return {
    id,
    sourceTable: csvTables.environmentCards,
    sourceName: name,
    version: row["包含版本"] ?? "",
    implementation: implementationFor(implementationRegistry.environmentCards, id),
    name,
    effectText: row["卡牌效果"] ?? "",
    subtitle: "当前环境",
    asset: {
      slot: "environment",
      id: `environment-${id}`,
      src: null,
      alt: name
    }
  };
});

export const supportCards: SupportCard[] = supportRows.map((row) => {
  const name = row["名称"];
  const id = slugify(name);

  return {
    id,
    sourceTable: csvTables.supportCards,
    sourceName: name,
    version: row["包含版本"] ?? "",
    implementation: implementationFor(implementationRegistry.supportCards, id),
    name,
    actualType: row["卡牌实际类型"] ?? "",
    cost: numberFrom(row["单张费用消耗"]),
    count: numberFrom(row["数量"], 1),
    effectText: row["卡牌效果"] ?? "",
    asset: cardAsset(id, name)
  };
});

export const intelligenceCards: IntelligenceCard[] = intelligenceRows.map((row) => {
  const name = row["名称"];
  const isForbiddenTruth = name.includes("禁忌真相");

  return {
    id: slugify(name),
    sourceTable: csvTables.intelligenceCards,
    sourceName: name,
    version: row["包含版本"] ?? "",
    implementation: { effectHook: isForbiddenTruth ? "intelligence.forbiddenTruth.sanLoss" : "intelligence.points", status: "stub" },
    name,
    points: isForbiddenTruth ? 0 : numberFrom(name, numberFrom(row["单张提供费用"], 1)),
    count: numberFrom(row["数量"], 1),
    effectText: row["卡牌效果"] ?? "",
    isForbiddenTruth
  };
});

export const hand = strategyCards.slice(0, 7);
export const currentEnvironment = environmentCards[0];
export const actionOrder = investigators.map((investigator) => investigator.id);
export const investigatorsById = new Map(investigators.map((investigator) => [investigator.id, investigator]));
export const strategyCardsById = new Map(strategyCards.map((card) => [card.id, card]));

export const intelligenceDeck = intelligenceCards.flatMap((card) =>
  Array.from({ length: card.count }, () => card.points)
);

export const intelligenceDeckEntries: IntelligenceDeckEntry[] = intelligenceCards.flatMap((card) =>
  Array.from({ length: card.count }, (_, index) => ({
    id: `${card.id}-${index + 1}`,
    name: card.name,
    points: card.points,
    isForbiddenTruth: card.isForbiddenTruth
  }))
);
