// scripts/update-locales.ts
// 递归处理嵌套 locales：
// 1. 以 en.json + zh_cn.json 为基准（递归展开为扁平 key）
// 2. 增量翻译其他语言：只翻译缺失的叶子字符串
// 3. 再把扁平结构还原成嵌套 JSON 写回文件（全部当对象，不再尝试数组）
// 4. 生成 locale 文件名时，将 '-' 替换为 '_'，然后全部小写
// 5. 调用翻译 API（OpenAI / Google）支持最多 3 次重试
// 6. 对同一语言中相同原文去重，只翻译一次，结果复用

import fs from 'fs/promises';
import path from 'path';

// 原始 locale（可能是嵌套结构）
type LocaleTree = any;
// 展平后的 key -> 文本
type FlatDict = Record<string, string>;

// ===================== 基本配置 =====================

// i18n 目录（使用工作目录，兼容 ESM / Bun）
const LOCALES_DIR = path.resolve(process.cwd(), 'i18n', 'locales');

// 基准文件（不要动文件名，下面逻辑依赖）
const BASE_EN_FILE = 'en.json';
const BASE_ZH_FILE = 'zh_cn.json';

// 想要自动翻译/维护的语言列表（传给翻译 API 的语言代码）
// 例如：'ja', 'zh-TW', 'zh-CN', 'fr', 'pt-BR' 等
const TARGET_LANGS: string[] = [
  "zh-TW",   // Chinese (Traditional)
  "es",      // Spanish
  "fr",      // French
  "de",      // German
  "ja",      // Japanese
  "ko",      // Korean
  "ru",      // Russian
  "pt",      // Portuguese
  "it",      // Italian
  "ar",      // Arabic
  "hi",      // Hindi
  "th",      // Thai
  "vi",      // Vietnamese
  "id",      // Indonesian
  "ms",      // Malay
  "nl",      // Dutch
  "sv",      // Swedish
  "da",      // Danish
  "fi",      // Finnish
  "pl",      // Polish
  "tr",      // Turkish
  "he",      // Hebrew
  "el",      // Greek
  "ro",      // Romanian
  "hu",      // Hungarian
  "uk",      // Ukrainian
  "bn",      // Bengali
  "fa",      // Persian (Farsi)
  "sw"       // Swahili
]

// 当前翻译器，可选: "openai" | "google"
const TRANSLATOR: 'openai' | 'google' = 'openai';

// ===================== API 配置 =====================

// OpenAI ChatGPT API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL =
  process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

// Google Translate API
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const GOOGLE_TRANSLATE_ENDPOINT =
  'https://translation.googleapis.com/language/translate/v2';

// ===================== 通用工具：读写 & 排序 =====================

/**
 * 读取 JSON 文件（可能是嵌套结构）
 */
async function readJson(filePath: string): Promise<LocaleTree> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      // 文件不存在，返回空对象，后续当作新文件处理
      return {};
    }
    throw err;
  }
}

/**
 * 递归排序 key，保证输出稳定
 */
function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object') {
    const sorted: any = {};
    Object.keys(value)
      .sort()
      .forEach((k) => {
        sorted[k] = sortKeysDeep(value[k]);
      });
    return sorted;
  }
  return value;
}

/**
 * 写入 JSON 文件（递归排序 + 美化缩进）
 */
async function writeJson(filePath: string, data: LocaleTree): Promise<void> {
  const sorted = sortKeysDeep(data);
  const json = JSON.stringify(sorted, null, 2) + '\n';
  await fs.writeFile(filePath, json, 'utf8');
}

// ===================== 扁平化 / 还原（全部当对象） =====================

/**
 * 扁平化嵌套对象：
 *   { a: { b: "x" }, c: "y" }
 * -> { "a.b": "x", "c": "y" }
 *
 * 只对叶子值为 string / number / boolean 的 key 进行收集。
 * 数组会按索引展开为路径的一部分（如 "list.0.name"），
 * 但在还原时也会当作普通对象来处理（不会再变回数组）。
 */
function flattenLocaleTree(
  obj: LocaleTree,
  prefix = ''
): FlatDict {
  const result: FlatDict = {};

  if (!obj || typeof obj !== 'object') {
    return result;
  }

  const isArray = Array.isArray(obj);
  const entries = Object.entries(obj) as [string, any][];

  for (const [rawKey, value] of entries) {
    const key = isArray ? String(rawKey) : rawKey;
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[fullKey] = String(value);
    } else if (value && typeof value === 'object') {
      const nested = flattenLocaleTree(value, fullKey);
      Object.assign(result, nested);
    }
    // 其他类型（null、undefined、function 等）直接忽略
  }

  return result;
}

/**
 * 从扁平结构还原成嵌套对象
 *   { "a.b": "x", "c": "y", "titles.401": "Sign-in Required" }
 * -> { a: { b: "x" }, c: "y", titles: { "401": "Sign-in Required" } }
 *
 * ✅ 这里**不再尝试数组重建**，所有段都当作普通对象属性。
 */
function unflattenToLocaleTree(flat: FlatDict): LocaleTree {
  const root: any = {};

  for (const [pathKey, value] of Object.entries(flat)) {
    const segments = pathKey.split('.');
    let curr: any = root;

    segments.forEach((seg, index) => {
      const isLast = index === segments.length - 1;

      if (isLast) {
        curr[seg] = value;
      } else {
        if (!curr[seg] || typeof curr[seg] !== 'object') {
          curr[seg] = {};
        }
        curr = curr[seg];
      }
    });
  }

  return root;
}

/**
 * 构建基准扁平词典：
 * - 先分别扁平化 en 和 zh
 * - keys = en.keys ∪ zh.keys
 * - 如果双方都有该 key，以 en 的 value 为主
 * - 如果只有一方有该 key，就用那一方的 value
 */
function buildBaseFlatDict(
  enTree: LocaleTree,
  zhTree: LocaleTree
): FlatDict {
  const enFlat = flattenLocaleTree(enTree);
  const zhFlat = flattenLocaleTree(zhTree);

  const base: FlatDict = {};
  const keys = new Set<string>([
    ...Object.keys(enFlat),
    ...Object.keys(zhFlat),
  ]);

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(enFlat, key)) {
      base[key] = enFlat[key]!!; // 双方都有时，优先 en
    } else if (Object.prototype.hasOwnProperty.call(zhFlat, key)) {
      base[key] = zhFlat[key]!!; // 只有 zh 有时，用 zh
    }
  }

  return base;
}

/**
 * 将语言码转换为文件用的 locale 代码：
 * - 替换 '-' 为 '_'
 * - 全部小写
 * 例如： "zh-TW" -> "zh_tw"  -> "zh_tw.json"
 */
function toFileLocaleCode(langCode: string): string {
  return langCode.replace(/-/g, '_').toLowerCase();
}

// ===================== 通用：带重试 =====================

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带最多 3 次重试的执行器（带 label 打 log）
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 500 } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(
      `[update-locales] [${label}] attempt ${attempt}/${retries}`
    );

    try {
      const result = await fn();
      if (attempt > 1) {
        console.log(
          `[update-locales] [${label}] succeeded on attempt ${attempt}`
        );
      }
      return result;
    } catch (err) {
      lastError = err;
      console.warn(
        `[update-locales] [${label}] failed on attempt ${attempt}:`,
        err
      );
      if (attempt < retries) {
        const delay = baseDelayMs * attempt;
        console.log(
          `[update-locales] [${label}] retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  console.error(
    `[update-locales] [${label}] exhausted all ${retries} retries, giving up.`
  );
  throw lastError;
}

// ===================== 翻译实现：OpenAI =====================

/**
 * 使用 OpenAI ChatGPT 翻译一组字符串
 * - texts: 待翻译的文本数组
 * - targetLang: 目标语言（如 "ja", "zh-TW", "fr"...）
 * 返回与 texts 顺序一一对应的翻译结果
 */
async function translateWithOpenAI(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('[update-locales] OPENAI_API_KEY is not set in env.');
  }

  if (!texts.length) return [];

  const messages = [
    {
      role: 'system',
      content: `你是一个专业的翻译引擎，请将用户提供的字符串数组翻译成 ${targetLang}。
要求：
- 仅返回 JSON 对象
- JSON 结构必须是：{ "translations": string[] }
- translations 数组长度必须与输入数组长度一致
- 保持数组顺序与输入一致
- 不要包含除 JSON 以外的任何内容`,
    },
    {
      role: 'user',
      content: JSON.stringify(texts),
    },
  ];

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages,
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  } as any);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`[OpenAI] API Error: ${error}`);
  }

  const json = (await res.json()) as any;
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('[OpenAI] Empty content in response');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`[OpenAI] Failed to parse JSON: ${String(e)}\ncontent: ${content}`);
  }

  if (!parsed || !Array.isArray(parsed.translations)) {
    throw new Error(
      `[OpenAI] Invalid JSON shape, expected { "translations": string[] }, got: ${content}`
    );
  }

  const translations: string[] = parsed.translations;
  if (translations.length !== texts.length) {
    throw new Error(
      `[OpenAI] translations length mismatch: expected ${texts.length}, got ${translations.length}`
    );
  }

  return translations;
}

// ===================== 翻译实现：Google =====================

/**
 * 使用 Google Translation API 进行批量翻译
 */
async function translateWithGoogle(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('[update-locales] GOOGLE_TRANSLATE_API_KEY is not set in env.');
  }

  if (!texts.length) return [];

  const url = `${GOOGLE_TRANSLATE_ENDPOINT}?key=${GOOGLE_TRANSLATE_API_KEY}`;
  const body = {
    q: texts,
    target: targetLang,
    format: 'text',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  } as any);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Google Translate API error: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const json = (await res.json()) as any;
  if (!json.data || !Array.isArray(json.data.translations)) {
    throw new Error('Unexpected response from Google Translate API');
  }

  const translations: string[] = json.data.translations.map(
    (t: any) => t.translatedText || ''
  );

  if (translations.length !== texts.length) {
    throw new Error(
      `[Google] translations length mismatch: expected ${texts.length}, got ${translations.length}`
    );
  }

  return translations;
}

// ===================== 翻译统一入口（带重试） =====================

async function translate(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (!texts.length) return [];

  if (TRANSLATOR === 'openai') {
    const label = `OpenAI ${targetLang}`;
    console.log(`[update-locales] Using ${label} translator`);
    return withRetry(
      label,
      () => translateWithOpenAI(texts, targetLang),
      { retries: 3, baseDelayMs: 800 }
    );
  }

  const label = `Google ${targetLang}`;
  console.log(`[update-locales] Using ${label} translator`);
  return withRetry(
    label,
    () => translateWithGoogle(texts, targetLang),
    { retries: 3, baseDelayMs: 800 }
  );
}

// ===================== 主流程 =====================

async function main(): Promise<void> {
  if (TRANSLATOR === 'openai' && !OPENAI_API_KEY) {
    console.error('[update-locales] ERROR: OPENAI_API_KEY is not set in env.');
    process.exit(1);
  }
  if (TRANSLATOR === 'google' && !GOOGLE_TRANSLATE_API_KEY) {
    console.error(
      '[update-locales] ERROR: GOOGLE_TRANSLATE_API_KEY is not set in env.'
    );
    process.exit(1);
  }

  await fs.mkdir(LOCALES_DIR, { recursive: true });

  const enPath = path.join(LOCALES_DIR, BASE_EN_FILE);
  const zhPath = path.join(LOCALES_DIR, BASE_ZH_FILE);

  const [enTree, zhTree] = await Promise.all([
    readJson(enPath),
    readJson(zhPath),
  ]);

  if (!Object.keys(enTree || {}).length && !Object.keys(zhTree || {}).length) {
    console.warn(
      '[update-locales] WARN: both en.json and zh_cn.json are empty or missing.'
    );
    return;
  }

  const baseFlat = buildBaseFlatDict(enTree, zhTree);
  const baseKeys = Object.keys(baseFlat);

  console.log(
    `[update-locales] Base dictionary built with ${baseKeys.length} keys (flattened).`
  );

  for (const langCode of TARGET_LANGS) {
    if (!langCode) continue;

    // 文件名用规范化后的代码（小写、'-' → '_'）
    const fileLocaleCode = toFileLocaleCode(langCode);
    // 避免误覆盖基准文件
    if (fileLocaleCode === 'en' || fileLocaleCode === 'zh_cn') {
      console.log(
        `[update-locales] Skip language "${langCode}" because it is a base locale (${fileLocaleCode}).`
      );
      continue;
    }

    const fileName = `${fileLocaleCode}.json`;
    const filePath = path.join(LOCALES_DIR, fileName);

    const localeTree = await readJson(filePath);
    const localeFlat = flattenLocaleTree(localeTree);

    const missingKeys = baseKeys.filter(
      (key) =>
        !Object.prototype.hasOwnProperty.call(localeFlat, key) ||
        localeFlat[key] === '' ||
        localeFlat[key] == null
    );

    if (!missingKeys.length) {
      console.log(
        `[update-locales] ${fileName} is already up to date (no missing leaf keys).`
      );
      continue;
    }

    const isNewFile = Object.keys(localeFlat).length === 0;

    console.log(
      `[update-locales] Translating ${missingKeys.length} keys for language "${langCode}" -> file "${fileName}" (${isNewFile ? 'new file' : 'incremental update'}).`
    );

    // ========== 去重优化部分：同一语言里，相同原文只翻译一次 ==========
    // 1. 构造 key -> 原文
    const keyToSourceText: Record<string, string> = {};
    missingKeys.forEach((key) => {
      keyToSourceText[key] = String(baseFlat[key]);
    });

    // 2. 构造 原文 -> 所有对应 key 的列表
    const sourceTextToKeys = new Map<string, string[]>();
    for (const [key, text] of Object.entries(keyToSourceText)) {
      if (!sourceTextToKeys.has(text)) {
        sourceTextToKeys.set(text, []);
      }
      sourceTextToKeys.get(text)!.push(key);
    }

    // 3. 唯一原文数组
    const uniqueSourceTexts = Array.from(sourceTextToKeys.keys());

    console.log(
      `[update-locales] ${fileName}: ${missingKeys.length} missing keys, ${uniqueSourceTexts.length} unique source texts.`
    );

    // 4. 只对唯一原文做一次 API 调用
    const uniqueTranslations = await translate(uniqueSourceTexts, langCode);

    // 5. 把唯一翻译结果映射回各个 key
    const translatedByKey: Record<string, string> = {};
    uniqueSourceTexts.forEach((src, idx) => {
      const translated = uniqueTranslations[idx];
      const keysForThisSrc = sourceTextToKeys.get(src) || [];
      keysForThisSrc.forEach((k) => {
        translatedByKey[k] = translated!;
      });
    });

    // 6. 合并已有 + 新翻译
    const mergedFlat: FlatDict = { ...localeFlat };
    missingKeys.forEach((key) => {
      mergedFlat[key] = translatedByKey[key]!!;
    });

    const newTree = unflattenToLocaleTree(mergedFlat);

    await writeJson(filePath, newTree);

    console.log(
      `[update-locales] ${fileName} saved with ${missingKeys.length} translated keys (${uniqueSourceTexts.length} API translated texts).`
    );
  }

  console.log('[update-locales] All locales updated successfully.');
}

main().catch((err) => {
  console.error('[update-locales] Fatal error:', err);
  process.exit(1);
});
