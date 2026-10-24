// Auto-generated radix conversion drill (2進 / 10進 / 16進, 8-bit values).
import type { Question } from "@/types";
import { randomInt, seededRandom, shuffled } from "./random";

type Radix = 2 | 10 | 16;

const RADIX_NAME: Record<Radix, string> = { 2: "2進数", 10: "10進数", 16: "16進数" };
const PAIRS: Array<[Radix, Radix]> = [[2, 10], [10, 2], [2, 16], [16, 2], [10, 16], [16, 10]];

export function formatRadix(value: number, radix: Radix): string {
  if (radix === 2) return value.toString(2).padStart(8, "0");
  if (radix === 16) return value.toString(16).toUpperCase().padStart(2, "0");
  return String(value);
}

const nibbleSwap = (v: number) => ((v & 0x0f) << 4) | (v >> 4);

/** Wrong answers a learner plausibly reaches: one flipped bit, off by one, swapped nibbles, off by 16. */
function distractors(value: number, random: () => number): number[] {
  const bit = (k: number) => value ^ (1 << k);
  const candidates = shuffled([
    bit(randomInt(random, 8)), bit(randomInt(random, 8)), value + 1, value - 1,
    nibbleSwap(value), value + 16, value - 16, bit(0), bit(7),
  ], random);
  const picked: number[] = [];
  for (const c of candidates) {
    if (c >= 0 && c <= 255 && c !== value && !picked.includes(c)) picked.push(c);
    if (picked.length === 3) return picked;
  }
  // Fallback guarantees three unique values even for edge cases.
  for (let c = 0; picked.length < 3; c++) if (c !== value && !picked.includes(c)) picked.push(c);
  return picked;
}

function binarySum(value: number): string {
  const terms = [128, 64, 32, 16, 8, 4, 2, 1].filter((w) => value & w);
  return terms.length ? terms.join(" + ") : "0";
}

function working(value: number, from: Radix, to: Radix): string {
  const bin = formatRadix(value, 2);
  const hex = formatRadix(value, 16);
  const nibbles = `${bin.slice(0, 4)} ${bin.slice(4)}`;
  const hi = value >> 4;
  const lo = value & 0x0f;
  const lines: string[] = [];
  if (from === 2 && to === 10) lines.push(`各桁の重みを足す：${bin}₂ = ${binarySum(value)} = ${value}`);
  if (from === 10 && to === 2) lines.push(`${value} を 2 の累乗の和に分ける：${value} = ${binarySum(value)}`, `重みのある桁を 1 にすると ${bin}₂`);
  if (from === 2 && to === 16) lines.push(`下位から4ビットずつ区切る：${nibbles}`, `それぞれを16進の1桁にする：${hi.toString(16).toUpperCase()} ${lo.toString(16).toUpperCase()} → ${hex}₁₆`);
  if (from === 16 && to === 2) lines.push(`16進の1桁を4ビットにする：${hex[0]} → ${bin.slice(0, 4)}、${hex[1]} → ${bin.slice(4)}`, `つなげて ${bin}₂`);
  if (from === 10 && to === 16) lines.push(`16 で割る：${value} ÷ 16 = ${hi} 余り ${lo}`, `商と余りを16進の桁にする：${hex}₁₆`);
  if (from === 16 && to === 10) lines.push(`各桁に重みを掛けて足す：${hex}₁₆ = ${hi} × 16 + ${lo} = ${value}`);
  lines.push("よくある誤り：1ビットの取り違え、±1 のずれ、上位と下位4ビットの入れ替え。");
  return lines.join("\n");
}

function makeQuestion(n: number, random: () => number): Question {
  const [from, to] = PAIRS[randomInt(random, PAIRS.length)] as [Radix, Radix];
  const value = 1 + randomInt(random, 255); // 1..255; 0 is too trivial
  const values = shuffled([value, ...distractors(value, random)], random);
  return {
    id: `radix-${n}`,
    exam: "A",
    field: "tech",
    major: "基礎理論",
    minor: "基礎理論",
    difficulty: 1,
    stem: `${RADIX_NAME[from]} ${formatRadix(value, from)} を${RADIX_NAME[to]}で表したものはどれか。`,
    choices: values.map((v) => formatRadix(v, to)),
    answer: values.indexOf(value),
    explanation: working(value, from, to),
    shuffle: false, // choices are already shuffled by the seeded PRNG
    source: { type: "original" },
  };
}

export function generateRadixQuestions(count: number, seed: number = Date.now()): Question[] {
  const random = seededRandom(seed);
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, i) => makeQuestion(i + 1, random));
}
