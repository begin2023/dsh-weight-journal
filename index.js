/**
 * Weight journal — Host half.
 *
 * One durable JSON document holds the daily entries and the reader's settings.
 * The Web page reads and writes it through two authenticated Fetch routes on
 * `ctx.connection.fetch` (the same carrier every shipped Remote route uses), so
 * the browser needs no extra transport. The model reaches the very same
 * operations through the `weight_journal` tool, which is the single writer for
 * both callers.
 *
 * Storage is plugin-owned data, not configuration: it lives beside the profile's
 * other plugin stores under `$DSH_HOME/storages` and is written atomically.
 *
 * @module dsh-weight-journal
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

export const name = 'weight-journal'

/** The Fetch-route carrier; without it this Host half has nothing to serve. */
export const inject = ['connection']

/** Route prefix owned by this plugin. */
const ROUTE_PREFIX = '/api/weight-journal'

/** One entry per calendar day. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u

/** Accepted weight range in kilograms. */
const MIN_WEIGHT = 20
const MAX_WEIGHT = 400

/** Longest accepted free-text note. */
const MAX_NOTE = 280

/** Accepted height range in centimetres. */
const MIN_HEIGHT = 80
const MAX_HEIGHT = 260

/**
 * The value a fresh journal reports before anything is recorded.
 * @returns {{ entries: never[], settings: { heightCm: null, goalWeight: null } }} a fresh empty state.
 */
function emptyState() {
  return { entries: [], settings: { heightCm: null, goalWeight: null } }
}

/** A rejection the route reports as a structured failure instead of a 500. */
class JournalError extends Error {
  /**
   * @param {string} code - stable machine-readable failure code.
   * @param {string} message - human-readable reason.
   */
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

/**
 * Absolute path of the journal document.
 * @returns {string} path under the Harness home.
 */
function journalPath() {
  const home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')
  return join(home, 'storages', 'weight-journal.json')
}

/**
 * Today's local calendar date as `YYYY-MM-DD`.
 * @param {Date} [now] - instant to read; defaults to the current clock.
 * @returns {string} the local date key.
 */
function localDateKey(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Round a weight to the journal's one-decimal precision.
 * @param {number} value - kilograms.
 * @returns {number} kilograms with one decimal.
 */
function roundWeight(value) {
  return Math.round(value * 10) / 10
}

/**
 * Validate and normalise one weight supplied by either caller.
 * @param {unknown} value - candidate weight in kilograms.
 * @returns {number} the normalised weight.
 */
function normalizeWeight(value) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(numeric)) throw new JournalError('invalid_weight', 'weight must be a number in kilograms')
  if (numeric < MIN_WEIGHT || numeric > MAX_WEIGHT) {
    throw new JournalError('invalid_weight', `weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT} kg`)
  }
  return roundWeight(numeric)
}

/**
 * Validate a calendar date key, rejecting impossible days such as 2026-02-30.
 * @param {unknown} value - candidate `YYYY-MM-DD` key.
 * @returns {string} the accepted key.
 */
function normalizeDate(value) {
  const text = String(value ?? '').trim()
  if (!DATE_PATTERN.test(text)) throw new JournalError('invalid_date', 'date must be formatted YYYY-MM-DD')
  const [year, month, day] = text.split('-').map(Number)
  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    throw new JournalError('invalid_date', `date ${text} is not a real calendar day`)
  }
  return text
}

/**
 * Validate an optional free-text note.
 * @param {unknown} value - candidate note.
 * @returns {string} the accepted note, possibly empty.
 */
function normalizeNote(value) {
  if (value === undefined || value === null) return ''
  const text = String(value).trim()
  if (text.length > MAX_NOTE) throw new JournalError('invalid_note', `note must be at most ${MAX_NOTE} characters`)
  return text
}

/**
 * Validate one optional centimetre reading.
 * @param {unknown} value - candidate height, or null to clear it.
 * @returns {number | null} the accepted height.
 */
function normalizeHeight(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < MIN_HEIGHT || numeric > MAX_HEIGHT) {
    throw new JournalError('invalid_height', `height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT} cm`)
  }
  return Math.round(numeric)
}

/**
 * Validate one optional goal weight.
 * @param {unknown} value - candidate goal, or null to clear it.
 * @returns {number | null} the accepted goal.
 */
function normalizeGoal(value) {
  if (value === null || value === undefined || value === '') return null
  return normalizeWeight(value)
}

/**
 * Coerce a stored document into the shape this build reads, discarding rows a
 * partial write or an older hand-edited file could not have produced.
 * @param {unknown} raw - parsed document.
 * @returns {{ entries: Array<{ date: string, weight: number, note: string }>, settings: { heightCm: number | null, goalWeight: number | null } }} the readable state.
 */
function readStateFrom(raw) {
  const document = raw !== null && typeof raw === 'object' ? raw : {}
  const rows = Array.isArray(document.entries) ? document.entries : []
  const entries = []
  for (const row of rows) {
    if (row === null || typeof row !== 'object') continue
    try {
      entries.push({
        date: normalizeDate(row.date),
        weight: normalizeWeight(row.weight),
        note: normalizeNote(row.note),
      })
    } catch {
      // A row this build cannot read is not a reason to lose the rest.
    }
  }
  entries.sort((left, right) => left.date.localeCompare(right.date))
  const settings = document.settings !== null && typeof document.settings === 'object' ? document.settings : {}
  let heightCm = null
  let goalWeight = null
  try {
    heightCm = normalizeHeight(settings.heightCm)
  } catch {
    heightCm = null
  }
  try {
    goalWeight = normalizeGoal(settings.goalWeight)
  } catch {
    goalWeight = null
  }
  return { entries, settings: { heightCm, goalWeight } }
}

/**
 * Read the journal document, returning the empty state before the first write.
 * @returns {Promise<ReturnType<typeof readStateFrom>>} the current state.
 */
async function readState() {
  let text
  try {
    text = await readFile(journalPath(), 'utf8')
  } catch (error) {
    if (error !== null && typeof error === 'object' && error.code === 'ENOENT') return emptyState()
    throw error
  }
  try {
    return readStateFrom(JSON.parse(text))
  } catch {
    throw new JournalError('unreadable_journal', `${journalPath()} is not valid JSON`)
  }
}

/**
 * Replace the journal document atomically.
 * @param {{ entries: unknown[], settings: unknown }} state - complete state to persist.
 * @returns {Promise<void>} resolution after the rename.
 */
async function writeState(state) {
  const target = journalPath()
  await mkdir(dirname(target), { recursive: true })
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify({ version: 1, ...state }, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
}

/**
 * Serialise read-modify-write cycles so two overlapping callers cannot lose an
 * entry; a rejected task still releases the next one.
 * @template T
 * @param {() => Promise<T>} task - the cycle to run alone.
 * @returns {Promise<T>} the cycle's result.
 */
function serialized() {
  let tail = Promise.resolve()
  return (task) => {
    const result = tail.then(task, task)
    tail = result.then(() => undefined, () => undefined)
    return result
  }
}

/**
 * Create the journal operations both callers share.
 * @returns {{ read: () => Promise<object>, record: (input: object) => Promise<object>, remove: (input: object) => Promise<object>, saveSettings: (input: object) => Promise<object> }} the operations.
 */
function createJournal() {
  const exclusive = serialized()

  /**
   * Record one day, replacing that day's earlier reading.
   * @param {{ date?: unknown, weight?: unknown, note?: unknown }} input - caller arguments.
   * @returns {Promise<object>} the state after the write.
   */
  const record = input => exclusive(async () => {
    const date = input.date === undefined || input.date === null || input.date === ''
      ? localDateKey()
      : normalizeDate(input.date)
    const weight = normalizeWeight(input.weight)
    const note = normalizeNote(input.note)
    const state = await readState()
    const entries = state.entries.filter(entry => entry.date !== date)
    entries.push({ date, weight, note })
    entries.sort((left, right) => left.date.localeCompare(right.date))
    const next = { entries, settings: state.settings }
    await writeState(next)
    return next
  })

  /**
   * Remove one day's reading.
   * @param {{ date?: unknown }} input - caller arguments.
   * @returns {Promise<object>} the state after the write.
   */
  const remove = input => exclusive(async () => {
    const date = normalizeDate(input.date)
    const state = await readState()
    const entries = state.entries.filter(entry => entry.date !== date)
    if (entries.length === state.entries.length) {
      throw new JournalError('entry_missing', `no weight is recorded for ${date}`)
    }
    const next = { entries, settings: state.settings }
    await writeState(next)
    return next
  })

  /**
   * Store the reader's height and goal.
   * @param {{ heightCm?: unknown, goalWeight?: unknown }} input - caller arguments.
   * @returns {Promise<object>} the state after the write.
   */
  const saveSettings = input => exclusive(async () => {
    const state = await readState()
    const heightCm = 'heightCm' in input ? normalizeHeight(input.heightCm) : state.settings.heightCm
    const goalWeight = 'goalWeight' in input ? normalizeGoal(input.goalWeight) : state.settings.goalWeight
    const next = { entries: state.entries, settings: { heightCm, goalWeight } }
    await writeState(next)
    return next
  })

  return {
    read: () => exclusive(readState),
    record,
    remove,
    saveSettings,
  }
}

/**
 * Compose a JSON response body.
 * @param {object} body - response envelope.
 * @returns {Response} a no-store JSON response.
 */
function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/**
 * Report one successful operation.
 * @param {object} value - the operation's value.
 * @returns {Response} the success envelope.
 */
function succeed(value) {
  return jsonResponse({ ok: true, value })
}

/**
 * Report one failed operation.
 * @param {unknown} error - the thrown value.
 * @returns {Response} the failure envelope.
 */
function failWith(error) {
  if (error instanceof JournalError) return jsonResponse({ ok: false, error: { code: error.code, message: error.message } })
  const message = error instanceof Error ? error.message : String(error)
  return jsonResponse({ ok: false, error: { code: 'write_failed', message } })
}

/**
 * Read the JSON body a route received, treating an absent body as `{}`.
 * @param {Request} request - the incoming Fetch request.
 * @returns {Promise<object>} the parsed body.
 */
async function readJsonBody(request) {
  let text
  try {
    text = await request.text()
  } catch {
    return {}
  }
  if (text.trim() === '') return {}
  try {
    const parsed = JSON.parse(text)
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    throw new JournalError('invalid_body', 'request body is not JSON')
  }
}

/**
 * Register the Host half.
 * @param {import('@deepseek-ai/cordis').Context} ctx - the plugin's context.
 * @returns {void}
 */
export function apply(ctx) {
  const journal = createJournal()

  ctx.effect(() => ctx.connection.fetch.register({
    path: `${ROUTE_PREFIX}/read`,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async () => {
      try {
        return succeed(await journal.read())
      } catch (error) {
        return failWith(error)
      }
    },
  }), 'weight-journal: read route')

  ctx.effect(() => ctx.connection.fetch.register({
    path: `${ROUTE_PREFIX}/write`,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        const body = await readJsonBody(request)
        switch (body.action) {
          case 'record':
            return succeed(await journal.record(body))
          case 'delete':
            return succeed(await journal.remove(body))
          case 'settings':
            return succeed(await journal.saveSettings(body))
          default:
            throw new JournalError('unknown_action', `unknown action ${JSON.stringify(body.action ?? null)}`)
        }
      } catch (error) {
        return failWith(error)
      }
    },
  }), 'weight-journal: write route')

  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.effect(() => toolCtx.tools.register({
      name: 'weight_journal',
      description:
        'Record, list, or delete this human\'s daily body weight in their local weight journal, and read the '
        + 'same journal the Weight journal page shows. One reading per calendar day: recording a date that '
        + 'already has one replaces it. Weights are kilograms. Use it when the human states a weight, asks '
        + 'what they weighed, or asks for a trend summary; do not invent readings.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['record', 'list', 'delete'],
            description: 'record writes one day, list returns recent entries with a summary, delete removes one day.',
          },
          date: { type: 'string', description: 'Calendar day as YYYY-MM-DD; defaults to today for record.' },
          weight: { type: 'number', description: 'Body weight in kilograms; required by record.' },
          note: { type: 'string', description: 'Optional short note stored beside the reading.' },
          limit: { type: 'integer', description: 'How many recent entries list returns; defaults to 14.' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['ok', 'message'],
          properties: {
            ok: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: String(value.message ?? '') }],
      },
      async execute(args) {
        try {
          const action = String(args?.action ?? '')
          if (action === 'record') {
            const date = args.date === undefined || args.date === null || args.date === ''
              ? localDateKey()
              : normalizeDate(args.date)
            const state = await journal.record({ date, weight: args.weight, note: args.note })
            const stored = state.entries.find(row => row.date === date)
            const total = state.entries.length
            return {
              ok: true,
              message: `Recorded ${stored.weight} kg for ${stored.date}${stored.note === '' ? '' : ` (note: ${stored.note})`}. `
                + `${total} day${total === 1 ? '' : 's'} in the journal.`,
            }
          }
          if (action === 'delete') {
            if (args.date === undefined || args.date === null || args.date === '') {
              throw new JournalError('invalid_date', 'delete needs the date to remove')
            }
            const state = await journal.remove({ date: args.date })
            return { ok: true, message: `Removed the reading for ${args.date}. ${state.entries.length} days remain.` }
          }
          if (action === 'list') {
            const state = await journal.read()
            const limit = Number.isFinite(Number(args.limit)) ? Math.max(1, Math.min(120, Math.trunc(Number(args.limit)))) : 14
            if (state.entries.length === 0) return { ok: true, message: 'The weight journal is empty.' }
            const recent = state.entries.slice(-limit)
            const latest = state.entries[state.entries.length - 1]
            const first = state.entries[0]
            const rows = recent.map((entry, index) => {
              const previous = index === 0
                ? state.entries[Math.max(0, state.entries.length - recent.length - 1)]
                : recent[index - 1]
              const delta = previous !== undefined && previous.date !== entry.date
                ? ` (${entry.weight - previous.weight >= 0 ? '+' : ''}${roundWeight(entry.weight - previous.weight)} kg)`
                : ''
              return `${entry.date}: ${entry.weight} kg${delta}${entry.note === '' ? '' : ` — ${entry.note}`}`
            })
            return {
              ok: true,
              message: `${state.entries.length} days recorded, ${first.date} to ${latest.date}. `
                + `Latest ${latest.weight} kg; overall change ${roundWeight(latest.weight - first.weight)} kg. `
                + `Most recent ${recent.length}:\n${rows.join('\n')}`,
            }
          }
          throw new JournalError('unknown_action', `unknown action ${JSON.stringify(args?.action ?? null)}`)
        } catch (error) {
          if (error instanceof JournalError) return { ok: false, message: `${error.message}` }
          return { ok: false, message: error instanceof Error ? error.message : String(error) }
        }
      },
    }), 'weight-journal: tool')
  })
}
