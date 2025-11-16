// composables/useCli.ts
import {ref, computed, watch, reactive} from 'vue'

/** ============ Types ============ */
export type Primitive = string | number | boolean

export type ArgType = 'string' | 'number' | 'boolean' | 'enum' | 'varstring'

export type ArgSpec = {
  name: string
  type?: ArgType
  required?: boolean
  description?: string
  variadic?: boolean            // consumes remaining positionals
  choices?: string[]            // for enum
  default?: Primitive | Primitive[]
}

export type OptionSpec = {
  name: string                  // long name, e.g. 'verbose'
  short?: string                // short alias, e.g. 'v'
  type?: ArgType
  required?: boolean
  description?: string
  multiple?: boolean            // can repeat and becomes array
  choices?: string[]
  default?: Primitive | Primitive[]
}

export type Parsed = {
  argv: string[]                // positional args after parsing
  options: Record<string, any>  // parsed flags
  raw: string                   // original input
}

export type CommandActionCtx = {
  println: (line?: string) => number
  print: (line: string) => number
  clear: () => void
  run: (input: string) => Promise<void>
  fullPath: string[]            // resolved command path
  parsed: Parsed                // parsed args/options
  signal: AbortSignal
  checkCancelled: () => void
  kv: {
    get<T = any>(key: string): T | undefined
    set<T = any>(key: string, value: T): void
    has(key: string): boolean
    delete(key: string): void
    keys(): string[]
  }
  popLine: (opts?: { onlyOutput?: boolean; onlyInput?: boolean }) => boolean
  replaceLast: (text: string, opts?: { onlyOutput?: boolean; onlyInput?: boolean }) => boolean
  removeLineById: (id: number) => boolean
  updateLineById: (id: number, text: string) => boolean
}

export type CommandAction = (ctx: CommandActionCtx) => void | Promise<void>

export type CommandSpec = {
  name: string
  alias?: string[]
  summary?: string              // short one-liner
  description?: string          // longer help
  args?: ArgSpec[]
  options?: OptionSpec[]
  subcommands?: CommandSpec[]
  action?: CommandAction
  hidden?: boolean
}

export type Middleware = (ctx: {
  path: string[]
  parsed: Parsed
}) => Promise<void> | void

/** ============ Registry state ============ */
const rootCommands = ref<CommandSpec[]>([])
type HistoryItem = { id: number; type: 'input' | 'output'; text: string }
const history = ref<HistoryItem[]>([])
let _hid = 1
const busy = ref(false)
const promptActive = ref(false)
const promptMask = ref(false)
const promptLabel = ref<string | null>(null)
let promptResolve: ((v: string) => void) | null = null
let promptReject: ((e: any) => void) | null = null

const KV_STORAGE_KEY = 'terminal.kv'          // change if you want namespacing
const kvData = reactive<Record<string, any>>({})

try {
  const raw = localStorage.getItem(KV_STORAGE_KEY)
  if (raw) Object.assign(kvData, JSON.parse(raw))
} catch { /* ignore */
}

let kvTimer: any
watch(kvData, () => {
  clearTimeout(kvTimer)
  kvTimer = setTimeout(() => {
    try {
      localStorage.setItem(KV_STORAGE_KEY, JSON.stringify(kvData))
    } catch {
    }
  }, 50)
}, {deep: true})

const kv = {
  get<T = any>(key: string): T | undefined {
    return kvData[key] as T | undefined
  },
  set<T = any>(key: string, value: T) {
    kvData[key] = value
  },
  has(key: string) {
    return Object.prototype.hasOwnProperty.call(kvData, key)
  },
  delete(key: string) {
    delete kvData[key]
  },
  keys() {
    return Object.keys(kvData)
  },
}

// when true, the UI should *not* disable the input even if busy=true
const interactiveBusyOverride = ref(false)

export function isPrompting() {
  return promptActive.value
}

let currentAbort: AbortController | null = null
const interrupted = ref(false)

export function interrupt() {
  if (promptActive.value) {
    cancelPrompt();
    return
  }
  if (currentAbort) {
    interrupted.value = true
    currentAbort.abort()
    history.value.push({id: _hid++, type: 'output', text: '^C'})
  }
}

function println(line = '') {
  const item: HistoryItem = {id: _hid++, type: 'output', text: line}
  history.value.push(item)
  return item.id
}

function print(line: string) {
  const item: HistoryItem = {id: _hid++, type: 'output', text: line}
  history.value.push(item)
  return item.id
}

function clear() {
  history.value.length = 0
}

/** ============ History helpers ============ */
function popLast(options?: { onlyOutput?: boolean; onlyInput?: boolean }) {
  const {onlyOutput = false, onlyInput = false} = options || {}
  for (let i = history.value.length - 1; i >= 0; i--) {
    const h = history.value[i]
    // @ts-ignore
    if (onlyOutput && h.type !== 'output') continue
    // @ts-ignore
    if (onlyInput && h.type !== 'input') continue
    history.value.splice(i, 1)
    return true
  }
  return false
}

function removeById(id: number) {
  const i = history.value.findIndex(h => h.id === id)
  if (i !== -1) {
    history.value.splice(i, 1);
    return true
  }
  return false
}

function replaceLast(text: string, options?: { onlyOutput?: boolean; onlyInput?: boolean }) {
  const {onlyOutput = false, onlyInput = false} = options || {}
  for (let i = history.value.length - 1; i >= 0; i--) {
    const h = history.value[i]
    // @ts-ignore
    if (onlyOutput && h.type !== 'output') continue
    // @ts-ignore
    if (onlyInput && h.type !== 'input') continue
    // @ts-ignore
    history.value[i] = {...h, text}
    return true
  }
  return false
}

function updateById(id: number, text: string) {
  const i = history.value.findIndex(h => h.id === id)
  if (i !== -1) {
    // @ts-ignore
    history.value[i] = {...history.value[i], text};
    return true
  }
  return false
}

/** ============ Tokenizer (quotes-aware) ============ */
function tokenize(input: string): string[] {
  if (!input.trim()) return []
  // respects "double", 'single', and backslash escapes within quotes
  const re = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|\\.|[^\s]+/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    let token = m[0]
    if (token.startsWith('"') || token.startsWith("'")) {
      token = token.slice(1, -1).replace(/\\(["'\\nrt])/g, (_, c) => {
        if (c === 'n') return '\n'
        if (c === 'r') return '\r'
        if (c === 't') return '\t'
        return c
      })
    } else if (token.startsWith('\\')) {
      token = token.slice(1)
    }
    out.push(token)
  }
  return out
}

/** ============ Option parser (GNU-ish) ============ */
function parseArgs(tokens: string[]): Parsed {
  const options: Record<string, any> = {}
  const argv: string[] = []
  let i = 0
  let endOfOptions = false

  while (i < tokens.length) {
    const t = tokens[i]

    // @ts-ignore
    if (endOfOptions || !t.startsWith('-') || t === '-') {
      // @ts-ignore
      argv.push(t)
      i++
      continue
    }

    if (t === '--') {
      endOfOptions = true;
      i++;
      continue
    }

    // --long=value or --long value
    // @ts-ignore
    if (t.startsWith('--')) {
      // @ts-ignore
      const eq = t.indexOf('=')
      if (eq !== -1) {
        // @ts-ignore
        const key = t.slice(2, eq)
        // @ts-ignore
        const val = t.slice(eq + 1)
        options[key] = val === '' ? true : val
        i++
      } else {
        // @ts-ignore
        const key = t.slice(2)
        const next = tokens[i + 1]
        if (!next || next.startsWith('-')) {
          options[key] = true
          i++
        } else {
          options[key] = next
          i += 2
        }
      }
      continue
    }

    // -abc or -k=value or -k value
    // @ts-ignore
    if (t.startsWith('-')) {
      // @ts-ignore
      // @ts-ignore
      if (t.length > 2 && t.includes('=')) {
        // -k=value
        // @ts-ignore
        const [k, v] = t.slice(1).split('=')
        // @ts-ignore
        // @ts-ignore
        options[k] = v ?? true
        i++
      } else { // @ts-ignore
        if (t.length > 2) {
          // -abc (bundle)
          // @ts-ignore
          const bundle = t.slice(1).split('')
          for (const k of bundle) options[k] = true
          i++
        } else {
          // -k value?
          // @ts-ignore
          const k = t.slice(1)
          const next = tokens[i + 1]
          if (!next || next.startsWith('-')) {
            options[k] = true
            i++
          } else {
            options[k] = next
            i += 2
          }
        }
      }
    }
  }

  return {argv, options, raw: tokens.join(' ')}
}

/** ============ Command resolution ============ */
function findCommand(path: string[]): { cmd?: CommandSpec; consumed: number; ancestors: CommandSpec[] } {
  let list = rootCommands.value
  const ancestors: CommandSpec[] = []
  let cmd: CommandSpec | undefined
  let consumed = 0

  for (const part of path) {
    const found = list.find(c =>
      c.name === part ||
      c.alias?.includes(part)
    )
    if (!found) break
    cmd = found
    ancestors.push(found)
    consumed++
    list = found.subcommands ?? []
  }
  return {cmd, consumed, ancestors}
}

/** ============ Coercion & validation ============ */
function coerce(val: any, type?: ArgType) {
  if (type === 'boolean') {
    if (val === true || val === false) return val
    if (val === undefined) return true
    const s = String(val).toLowerCase()
    return !(s === '0' || s === 'false' || s === 'no' || s === 'off')
  }
  if (type === 'number') {
    const n = Number(val)
    if (Number.isNaN(n)) throw new Error(`Expected number, got "${val}"`)
    return n
  }
  if (type === 'varstring') {
    if (val === true || val === undefined) return ''
    return String(val)
  }
  return val === undefined ? '' : String(val)
}

function buildHelp(cmd: CommandSpec, lineage: CommandSpec[]) {
  const path = [...lineage.map(c => c.name), cmd.name].join(' ')
  const usageParts = [path]
  if (cmd.options?.length) usageParts.push('[options]')
  if (cmd.args?.length) {
    for (const a of cmd.args) {
      const label = a.variadic ? `${a.name}...` : a.name
      usageParts.push(a.required ? `<${label}>` : `[${label}]`)
    }
  }

  const lines: string[] = []
  lines.push(`Usage: ${usageParts.join(' ')}`)
  if (cmd.summary) lines.push(`\n${cmd.summary}`)
  if (cmd.description) lines.push(`\n${cmd.description}`)

  if (cmd.subcommands?.some(s => !s.hidden)) {
    lines.push('\nCommands:')
    for (const s of cmd.subcommands!.filter(s => !s.hidden)) {
      const aliases = s.alias?.length ? ` (${s.alias.join(', ')})` : ''
      lines.push(`  ${s.name}${aliases}${s.summary ? ' - ' + s.summary : ''}`)
    }
  }

  const common: OptionSpec[] = [{
    name: 'help',
    short: 'h',
    description: 'Show help for this command',
    type: 'boolean'
  }]
  const opts: OptionSpec[] = [...(cmd.options ?? []), ...common]
  if (opts.length) {
    lines.push('\nOptions:')
    const pad = Math.max(...opts.map(o => `${o.short ? '-' + o.short + ', ' : '    '}--${o.name}`.length)) + 2
    for (const o of opts) {
      const left = `${o.short ? '-' + o.short + ', ' : '    '}--${o.name}`
      const right = [
        o.description ?? '',
        o.required === true ? '(required)' : '',
        o.default !== undefined ? `(default: ${Array.isArray(o.default) ? o.default.join(',') : String(o.default)})` : '',
        o.choices && o.choices.length > 0 ? `(choices: ${o.choices.join('|')})` : ''
      ].filter(Boolean).join(' ')
      lines.push(`  ${left.padEnd(pad)}${right}`)
    }
  }

  return lines.join('\n')
}

function mapShortToLong(opts: OptionSpec[]) {
  const map: Record<string, string> = {}
  for (const o of opts) {
    if (o.short) map[o.short] = o.name
  }
  return map
}

function applyDefaults(target: Record<string, any>, specs?: OptionSpec[]) {
  if (!specs) return
  for (const o of specs) {
    if (target[o.name] === undefined && o.default !== undefined) {
      target[o.name] = Array.isArray(o.default) ? [...o.default] : o.default
    }
  }
}

/** ============ Middleware ============ */
const beforeEach: Middleware[] = []
const afterEach: Middleware[] = []

/** ============ Public API ============ */
function register(spec: CommandSpec) {
  rootCommands.value.push(spec)
}

function unregister(name: string) {
  const i = rootCommands.value.findIndex(c => c.name === name)
  if (i !== -1) rootCommands.value.splice(i, 1)
}

const commandsFlat = computed(() => {
  const out: string[] = []
  const walk = (list: CommandSpec[], prefix: string[] = []) => {
    for (const c of list) {
      if (!c.hidden) out.push([...prefix, c.name].join(' '))
      if (c.subcommands?.length) walk(c.subcommands, [...prefix, c.name])
    }
  }
  walk(rootCommands.value)
  return out.sort()
})

/** ============ Runner ============ */
async function run(input: string) {
  const trimmed = input.trim()
  history.value.push({id: _hid++, type: 'input', text: trimmed})
  if (!trimmed) return

  // keep local refs for use inside catch (to show contextual help)
  let selectedCmd: CommandSpec | undefined
  let longOpts: OptionSpec[] = []

  try {
    const tokens = tokenize(trimmed)
    const parsed = parseArgs(tokens)

    // resolve path against command tree
    const found = findCommand(parsed.argv)
    const {cmd, consumed, ancestors} = found

    if (!cmd) {
      println(`Command not found: ${parsed.argv[0] ?? ''}. Try "help".`)
      return
    }

    // split consumed command tokens vs remaining positionals
    const remaining = parsed.argv.slice(consumed)

    // parent command with subs but no action -> show help
    const visibleSubs = (cmd.subcommands ?? []).filter(s => !s.hidden)
    if (visibleSubs.length && remaining.length === 0 && !cmd.action) {
      println(buildHelp(cmd, ancestors.slice(0, -1)))
      return
    }

    // map short -> long flags according to this command spec
    longOpts = cmd.options ?? []
    const shortMap = mapShortToLong(longOpts)

    // expand single-letter options to long names where possible
    for (const k of Object.keys(parsed.options)) {
      if (k.length === 1 && shortMap[k]) {
        parsed.options[shortMap[k]] = parsed.options[k]
        delete parsed.options[k]
      }
    }

    // If user passed options but this command requires a subcommand, complain
    if (visibleSubs.length && remaining.length > 0 && !cmd.action) {
      println(buildHelp(cmd, ancestors.slice(0, -1)))
      throw new Error('A subcommand is required before arguments/options.')
    }

    // Unknown option detection (after short->long expansion)
    {
      const known = new Set(['help', 'h', ...longOpts.map(o => o.name), ...longOpts.map(o => o.short).filter(Boolean) as string[]])
      const unknown = Object.keys(parsed.options).filter(k => !known.has(k))
      if (unknown.length) {
        println(buildHelp(cmd, ancestors.slice(0, -1)))
        throw new Error(`Unknown option${unknown.length > 1 ? 's' : ''}: ${unknown.map(x => (x.length === 1 ? '-' + x : '--' + x)).join(', ')}`)
      }
    }

    // help?
    if (parsed.options.help || parsed.options.h) {
      println(buildHelp(cmd, ancestors.slice(0, -1)))
      return
    }

    // build final argv/options by spec
    const finalOptions: Record<string, any> = {}
    const positionals: any[] = []

    // coerce options (type/choices)
    for (const o of longOpts) {
      const present = parsed.options[o.name]
      if (present === undefined) continue
      if (o.type && o.type !== 'boolean' && o.type !== 'varstring') {
        if (present === true || present === '' || present === undefined) {
          println(buildHelp(cmd, ancestors.slice(0, -1)))
          throw new Error(`Option --${o.name} requires a value`)
        }
      }
      if (o.multiple) {
        const arr = Array.isArray(present) ? present : [present]
        finalOptions[o.name] = arr.map(v => coerce(v, o.type))
      } else {
        finalOptions[o.name] = coerce(present, o.type)
      }
      if (o.choices && finalOptions[o.name] !== undefined) {
        const vals = Array.isArray(finalOptions[o.name]) ? finalOptions[o.name] : [finalOptions[o.name]]
        for (const v of vals) {
          if (!o.choices.includes(String(v))) {
            throw new Error(`Invalid value for --${o.name}. Allowed: ${o.choices.join(', ')}`)
          }
        }
      }
    }

    // apply defaults & required checks (options)
    applyDefaults(finalOptions, longOpts)
    for (const o of longOpts) {
      if (o.required && finalOptions[o.name] === undefined) {
        println(buildHelp(cmd, ancestors.slice(0, -1)))
        throw new Error(`Missing required option --${o.name}`)
      }
    }

    // coerce positional args
    const argSpecs = cmd.args ?? []
    let idx = 0
    for (const spec of argSpecs) {
      if (spec.variadic) {
        const rest = remaining.slice(idx).map(v => coerce(v, spec.type))
        if (spec.required && rest.length === 0) {
          println(buildHelp(cmd, ancestors.slice(0, -1)))
          throw new Error(`Missing required argument <${spec.name}...>`)
        }
        if (spec.choices?.length) {
          for (const v of rest) if (!spec.choices.includes(String(v))) {
            throw new Error(`Invalid value for ${spec.name}. Allowed: ${spec.choices.join(', ')}`)
          }
        }
        positionals.push(...rest)
        idx = remaining.length
        break
      } else {
        const val = remaining[idx]
        if (val === undefined) {
          if (spec.required && spec.default === undefined) {
            println(buildHelp(cmd, ancestors.slice(0, -1)))
            throw new Error(`Missing required argument <${spec.name}>`)
          }
          positionals.push(spec.default ?? undefined)
        } else {
          const coerced = coerce(val, spec.type)
          if (spec.choices?.length && !spec.choices.includes(String(coerced))) {
            throw new Error(`Invalid value for ${spec.name}. Allowed: ${spec.choices.join(', ')}`)
          }
          positionals.push(coerced)
          idx++
        }
      }
    }

    // any extra positionals?
    if (idx < remaining.length) {
      println(buildHelp(cmd, ancestors.slice(0, -1)))
      throw new Error(`Too many arguments. Got ${remaining.length}, expected ${idx}.`)
    }

    const ac = new AbortController()
    currentAbort = ac
    interrupted.value = false

    const ctxBase = {
      println, print, clear, run,
      fullPath: ancestors.map(a => a.name),
      parsed: {argv: positionals, options: finalOptions, raw: input},
      signal: ac.signal,
      checkCancelled: () => {
        if (ac.signal.aborted) throw new Error('Interrupted')
      },
      kv,
      popLine: (opts?: { onlyOutput?: boolean; onlyInput?: boolean }) => popLast(opts),
      replaceLast: (text: string, opts?: { onlyOutput?: boolean; onlyInput?: boolean }) => replaceLast(text, opts),
      removeLineById: (id: number) => removeById(id),
      updateLineById: (id: number, text: string) => updateById(id, text),
    }

    busy.value = true
    try {
      // beforeEach middleware
      for (const mw of beforeEach) await mw({path: ctxBase.fullPath, parsed: ctxBase.parsed})
      if (cmd.action) await cmd.action(ctxBase)
      // afterEach middleware
      for (const mw of afterEach) await mw({path: ctxBase.fullPath, parsed: ctxBase.parsed})
    } finally {
      busy.value = false
      currentAbort = null
    }
  } catch (e: any) {
    // Show contextual help for the selected command when we know it,
    // but avoid double-printing if we already printed it above.
    if (e?.name === 'AbortError' || e?.message === 'Interrupted') {
      println('Interrupted')
    } else {
      println(`Error: ${e?.message ?? String(e)}`)
    }
  }
}

/** ============ Interactive Prompt Helper ============ */
export function promptInput(message: string, opts?: { mask?: boolean }): Promise<string> {
  // show the label in history
  promptActive.value = true
  promptMask.value = !!opts?.mask
  promptLabel.value = opts?.mask ? `${message}` : `${message}`
  interactiveBusyOverride.value = true

  // print the label (no trailing input echo yet)
  history.value.push({ id: _hid++, type: 'output', text: promptLabel.value})

  return new Promise((resolve, reject) => {
    promptResolve = resolve
    promptReject = reject
  })
}

// Called by the Terminal component when user presses Enter during prompt mode
export function submitPromptInput(value: string) {
  if (!promptActive.value) return
  // echo masked or plain
  history.value[history.value.length - 1]!!.text += promptMask.value ? '' : value
  promptActive.value = false
  promptMask.value = false
  promptLabel.value = null
  interactiveBusyOverride.value = false
  const res = promptResolve;
  promptResolve = null;
  promptReject = null
  res?.(value)
}

// Called on interrupt (Ctrl+C) to cancel the prompt
export function cancelPrompt(reason = 'Interrupted') {
  if (!promptActive.value) return
  promptActive.value = false
  promptMask.value = false
  interactiveBusyOverride.value = false
  history.value.push({ id: _hid++, type: 'output', text: '^C'})
  const rej = promptReject;
  promptResolve = null;
  promptReject = null
  rej?.(new Error(reason))
}


/** ============ Built-in 'help' (top-level) ============ */
function topLevelHelp(opts?: { includeSubcommands?: boolean; style?: 'flat' | 'tree' }) {
  const {includeSubcommands = false, style = 'flat'} = opts ?? {}
  const lines: string[] = []

  const visible = (list: CommandSpec[]) => list.filter(c => !c.hidden)

  if (!includeSubcommands) {
    // top-level only
    lines.push('Available commands:')
    for (const c of visible(rootCommands.value)) {
      const aliases = c.alias?.length ? ` (${c.alias.join(', ')})` : ''
      lines.push(`  ${c.name}${aliases}${c.summary ? ' - ' + c.summary : ''}`)
    }
    return lines.join('\n')
  }

  // include subcommands
  if (style === 'flat') {
    lines.push('Available commands (flat):')
    const walkFlat = (list: CommandSpec[], prefix: string[] = []) => {
      for (const c of visible(list)) {
        const path = [...prefix, c.name].join(' ')
        const aliases = c.alias?.length ? ` (${c.alias.join(', ')})` : ''
        lines.push(`  ${path}${aliases}${c.summary ? ' - ' + c.summary : ''}`)
        if (c.subcommands?.length) walkFlat(c.subcommands, [...prefix, c.name])
      }
    }
    walkFlat(rootCommands.value)
  } else {
    lines.push('Available commands (tree):')
    const walkTree = (list: CommandSpec[], depth = 0) => {
      for (const c of visible(list)) {
        const aliases = c.alias?.length ? ` (${c.alias.join(', ')})` : ''
        const label = `${c.name}${aliases}${c.summary ? ' - ' + c.summary : ''}`
        lines.push(`${'  '.repeat(depth)}- ${label}`)
        if (c.subcommands?.length) walkTree(c.subcommands, depth + 1)
      }
    }
    walkTree(rootCommands.value)
  }

  return lines.join('\n')
}

// convenience
function registerBasicHelp() {
  register({
    name: 'help',
    summary: 'Show global or command help',
    args: [{name: 'cmd', description: 'Command path (optional)'}],
    options: [
      {name: 'all', short: 'a', type: 'boolean', description: 'Include subcommands in top-level help'},
      {name: 'tree', type: 'boolean', description: 'Render subcommands as a tree (with --all)'},
      {name: 'flat', type: 'boolean', description: 'Render subcommands as a flat list (with --all)'}
    ],
    action: ({println, parsed}) => {
      const query = (parsed.argv[0] as string | undefined)?.split(' ').filter(Boolean) ?? []
      if (query.length) {
        const {cmd} = findCommand(query)
        if (!cmd) {
          println(`No such command: ${query.join(' ')}`);
          return
        }
        println(buildHelp(cmd, []))
        return
      }

      const include = !!parsed.options.all
      const style: 'flat' | 'tree' =
        parsed.options.tree ? 'tree' :
          parsed.options.flat ? 'flat' :
            'flat'

      println(topLevelHelp({includeSubcommands: include, style}))
    }
  })
}

registerBasicHelp()

/** ============ Expose ============ */
export function useCli() {
  return {
    // state
    history, busy, commandsFlat,
    // registration
    register, unregister,
    // middleware
    beforeEach: (mw: Middleware) => beforeEach.push(mw),
    afterEach: (mw: Middleware) => afterEach.push(mw),
    // runtime
    run,
    // io helpers (if needed externally)
    println, print, clear,
    kv,
    popLast, removeById, replaceLast, updateById
  }
}
