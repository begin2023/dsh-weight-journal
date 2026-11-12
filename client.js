/**
 * Weight journal — browser half.
 *
 * One main-panel page plus the sidebar entry that opens it. The page is a
 * three-band dashboard: today's state and the record composer, the trend chart,
 * then weekly movement beside the recent entries. All of it composes from the
 * host theme's `--dsw-alias-*` tokens, so it follows light/dark and every
 * shipped theme without a local palette.
 *
 * A third registration puts a reminder capsule in `shell.overlay` — the frame's
 * click-through floating layer — so the day's state stays visible from every
 * panel, speaking a different language on each beat.
 *
 * Data reaches the browser through the Host half's two authenticated Fetch
 * routes; the store below owns the fetch, the snapshot, and the subscriptions
 * the slot renderer turns into hook props.
 *
 * Hand-written bundle in the official `__ModuleLoader__` format: no build step,
 * no Harness Client package import, React from the browser module table.
 */

window.__ModuleLoader__.load({
  id: 'dsh-weight-journal',
  factory(require) {
    'use strict'

    const React = require('react')
    const h = React.createElement

    /** Locale namespace for this page's copy. */
    const NS = 'weight.journal'
    /** The sidebar entry id and the matching `main` panel key. */
    const PANEL_ID = 'weight'
    /** Milliseconds in one day. */
    const DAY_MS = 86_400_000
    /** A line breaks where two records are further apart than this. */
    const MAX_GAP_MS = 21 * DAY_MS
    /** Trailing-window size of the mean line, in readings. */
    const MEAN_WINDOW = 7
    /** Overlay cell id of the frame-wide reminder capsule. */
    const REMINDER_ID = 'weight-reminder'
    /** How long one reminder language holds before the next beat. */
    const REMINDER_BEAT_MS = 5_400

    /* ------------------------------------------------------------------ copy */

    const ZH = {
      panel: '体重手账',
      'head.subtitle': '每天一条记录，看清长期趋势',
      'head.back': '返回对话',
      'head.settings': '设置',
      'hero.kicker': '当前体重',
      'hero.noData': '还没有记录',
      'hero.updatedToday': '今天更新',
      'hero.updatedOn': '{date} 更新',
      'hero.goal': '目标 {weight} kg',
      'hero.remaining': '还差 {weight} kg',
      'hero.reached': '已达成目标',
      'hero.progress': '已完成 {percent}%',
      'hero.start': '起始 {weight} kg',
      'kpi.avg7': '7 日均值',
      'kpi.change30': '30 天变化',
      'kpi.min': '最低',
      'kpi.streak': '连续记录',
      'kpi.unit': '天',
      'chart.title': '体重走势',
      'chart.empty': '记录第一条体重，走势图就会出现在这里。',
      'chart.rangeEmpty': '这段时间没有记录。',
      'chart.mean': '{n} 次均线',
      'chart.goal': '目标',
      'chart.delta': '较上次 {value} kg',
      'chart.summary': '{count} 条记录，{min}–{max} kg，最新 {latest} kg',
      'range.7': '7 天',
      'range.30': '30 天',
      'range.90': '90 天',
      'range.all': '全部',
      'week.title': '每周变化',
      'week.empty': '至少需要两周的记录才能比较。',
      'week.hint': '零线上方为增重，下方为减重；周均为该周记录的平均体重。',
      'week.tip': '周均 {mean} kg · 较上周 {delta} kg',
      'recent.title': '最近记录',
      'recent.empty': '还没有记录。',
      'recent.confirm': '删除这条？',
      'recent.delete': '删除',
      'recent.cancel': '取消',
      'recent.open': '编辑 {date} 的记录',
      'composer.title': '记录体重',
      'composer.date': '日期',
      'composer.today': '今天',
      'composer.weight': '体重',
      'composer.note': '备注',
      'composer.notePlaceholder': '可选，例如「早起空腹」',
      'composer.save': '保存记录',
      'composer.update': '更新记录',
      'composer.overwrite': '该日期已有记录，保存后会覆盖。',
      'composer.saved': '已保存 {date} 的体重',
      'composer.invalid': '请输入 20–400 kg 之间的体重',
      'composer.failed': '保存失败：{message}',
      'settings.title': '个人设置',
      'settings.height': '身高（cm）',
      'settings.goal': '目标体重（kg）',
      'settings.hint': '留空则不显示 BMI 与目标进度。',
      'settings.seat': '提醒胶囊',
      'settings.seatHint': '拖动标题行中间的胶囊即可挪开它。',
      'settings.seatReset': '回到中间',
      'settings.seatDone': '胶囊回到中间了',
      'settings.save': '保存',
      'settings.cancel': '取消',
      'settings.failed': '保存失败：{message}',
      'error.title': '读取记录失败',
      'error.retry': '重试',
      loading: '读取中…',
      'start.title': '从今天的第一个数字开始',
      'start.text': '每天记一条，走势会自己长出来。身高和目标体重之后可以在「设置」里补上。',
      'start.rule1': '每天一条，重复保存即覆盖',
      'start.rule2': '悬停走势图可看当天数值',
      'start.rule3': '点任意一行可回填修改',
      'start.action': '记录今天的体重',
    }

    const EN = {
      panel: 'Weight journal',
      'head.subtitle': 'One line a day, so the trend is visible',
      'head.back': 'Back to conversation',
      'head.settings': 'Settings',
      'hero.kicker': 'Current weight',
      'hero.noData': 'Nothing recorded yet',
      'hero.updatedToday': 'Updated today',
      'hero.updatedOn': 'Updated {date}',
      'hero.goal': 'Goal {weight} kg',
      'hero.remaining': '{weight} kg to go',
      'hero.reached': 'Goal reached',
      'hero.progress': '{percent}% of the way',
      'hero.start': 'Started at {weight} kg',
      'kpi.avg7': '7-day mean',
      'kpi.change30': '30-day change',
      'kpi.min': 'Lowest',
      'kpi.streak': 'Streak',
      'kpi.unit': 'd',
      'chart.title': 'Weight trend',
      'chart.empty': 'Record your first weight and the trend appears here.',
      'chart.rangeEmpty': 'No readings in this window.',
      'chart.mean': '{n}-reading mean',
      'chart.goal': 'Goal',
      'chart.delta': '{value} kg vs. previous',
      'chart.summary': '{count} readings, {min}–{max} kg, latest {latest} kg',
      'range.7': '7d',
      'range.30': '30d',
      'range.90': '90d',
      'range.all': 'All',
      'week.title': 'Weekly movement',
      'week.empty': 'Two weeks of readings are needed to compare.',
      'week.hint': 'Above the zero line is a gain, below is a loss; each week uses its mean weight.',
      'week.tip': 'Mean {mean} kg · {delta} kg vs. last week',
      'recent.title': 'Recent entries',
      'recent.empty': 'Nothing recorded yet.',
      'recent.confirm': 'Delete this one?',
      'recent.delete': 'Delete',
      'recent.cancel': 'Cancel',
      'recent.open': 'Edit the reading for {date}',
      'composer.title': 'Record weight',
      'composer.date': 'Date',
      'composer.today': 'Today',
      'composer.weight': 'Weight',
      'composer.note': 'Note',
      'composer.notePlaceholder': 'Optional, e.g. before breakfast',
      'composer.save': 'Save',
      'composer.update': 'Update',
      'composer.overwrite': 'This day already has a reading; saving replaces it.',
      'composer.saved': 'Saved the weight for {date}',
      'composer.invalid': 'Enter a weight between 20 and 400 kg',
      'composer.failed': 'Could not save: {message}',
      'settings.title': 'Your details',
      'settings.height': 'Height (cm)',
      'settings.goal': 'Goal weight (kg)',
      'settings.hint': 'Leave a field empty to hide BMI or the goal progress.',
      'settings.seat': 'Reminder capsule',
      'settings.seatHint': 'Drag the capsule to move it out of the way.',
      'settings.seatReset': 'Back to the middle',
      'settings.seatDone': 'The capsule is back in the middle',
      'settings.save': 'Save',
      'settings.cancel': 'Cancel',
      'settings.failed': 'Could not save: {message}',
      'error.title': 'Could not read the journal',
      'error.retry': 'Retry',
      loading: 'Loading…',
      'start.title': 'Start with one number',
      'start.text': 'One reading a day and the trend builds itself. Height and a goal weight can be added later in Settings.',
      'start.rule1': 'One reading a day; saving again replaces it',
      'start.rule2': 'Hover the chart to read any day',
      'start.rule3': 'Click a row to load it back for editing',
      'start.action': 'Record today',
    }

    /* --------------------------------------------------------------- helpers */

    /**
     * Substitute `{name}` placeholders in one localized string.
     * @param {string} template - localized text.
     * @param {Record<string, string | number>} [values] - placeholder values.
     * @returns {string} the substituted text.
     */
    function fill(template, values) {
      if (values === undefined) return template
      return template.replace(/\{(\w+)\}/g, (whole, name) => (
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole
      ))
    }

    /**
     * Wrap a namespace translator so a missing namespace cannot blank the page.
     * @param {((key: string) => string) | undefined} translate - the slot's `t`.
     * @returns {(key: string, values?: Record<string, string | number>) => string} the safe translator.
     */
    function translator(translate) {
      return (key, values) => {
        let text = key
        if (typeof translate === 'function') {
          try {
            const resolved = translate(key)
            if (typeof resolved === 'string' && resolved !== '') text = resolved
          } catch {
            // A namespace the renderer could not bind still leaves readable keys.
          }
        }
        return fill(text, values)
      }
    }

    /**
     * Pad a number to two digits.
     * @param {number} value - number to pad.
     * @returns {string} two-digit text.
     */
    function pad2(value) {
      return String(value).padStart(2, '0')
    }

    /**
     * Today's local calendar key.
     * @returns {string} `YYYY-MM-DD`.
     */
    function todayKey() {
      const now = new Date()
      return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
    }

    /**
     * Local midnight of a calendar key.
     * @param {string} key - `YYYY-MM-DD`.
     * @returns {Date} the local date.
     */
    function keyToDate(key) {
      const [year, month, day] = key.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    /**
     * Stable UTC millisecond position of a calendar key, immune to DST shifts.
     * @param {string} key - `YYYY-MM-DD`.
     * @returns {number} milliseconds.
     */
    function keyToMs(key) {
      const [year, month, day] = key.split('-').map(Number)
      return Date.UTC(year, month - 1, day)
    }

    /**
     * Calendar key of a local date.
     * @param {Date} date - any local date.
     * @returns {string} `YYYY-MM-DD`.
     */
    function dateKey(date) {
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
    }

    /**
     * Calendar key of a UTC-millisecond position produced by {@link keyToMs}.
     * @param {number} ms - position on the calendar axis.
     * @returns {string} `YYYY-MM-DD`.
     */
    function msToKey(ms) {
      const date = new Date(ms)
      return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
    }

    /**
     * Round to one decimal without trailing `.0` noise in comparisons.
     * @param {number} value - raw number.
     * @returns {number} one-decimal number.
     */
    function round1(value) {
      return Math.round(value * 10) / 10
    }

    /**
     * One-decimal text for a weight.
     * @param {number | null | undefined} value - kilograms.
     * @returns {string} the formatted weight, or an em dash.
     */
    function kg(value) {
      if (value === null || value === undefined || !Number.isFinite(value)) return '—'
      return round1(value).toFixed(1)
    }

    /**
     * Signed one-decimal text for a change.
     * @param {number | null | undefined} value - kilogram delta.
     * @returns {string} the formatted delta, or an em dash.
     */
    function signedKg(value) {
      if (value === null || value === undefined || !Number.isFinite(value)) return '—'
      const rounded = round1(value)
      return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)}`
    }

    /**
     * Direction class of a change.
     * @param {number | null | undefined} value - kilogram delta.
     * @returns {'up' | 'down' | 'flat'} the movement.
     */
    function direction(value) {
      if (!Number.isFinite(value) || round1(value) === 0) return 'flat'
      return value > 0 ? 'up' : 'down'
    }

    /**
     * Mean of a numeric list.
     * @param {number[]} values - numbers.
     * @returns {number | null} the mean, or null for an empty list.
     */
    function mean(values) {
      if (values.length === 0) return null
      let total = 0
      for (const value of values) total += value
      return total / values.length
    }

    /**
     * Locale id used for calendar formatting.
     * @param {{ getLocale?: () => unknown } | undefined} locale - the locale service.
     * @returns {string} a BCP 47 tag.
     */
    function localeTag(locale) {
      try {
        const snapshot = locale && typeof locale.getLocale === 'function' ? locale.getLocale() : undefined
        const id = snapshot && typeof snapshot === 'object'
          ? snapshot.id ?? snapshot.locale ?? snapshot.preference
          : undefined
        if (typeof id === 'string' && id !== '') return id
      } catch {
        // Fall through to the browser preference.
      }
      return (typeof navigator !== 'undefined' && navigator.language) || 'en'
    }

    /**
     * Build the calendar formatters once per locale tag.
     * @param {string} tag - BCP 47 tag.
     * @returns {{ day: (key: string) => string, weekday: (key: string) => string, monthDay: (key: string) => string, full: (key: string) => string }} formatters.
     */
    function calendarFormatters(tag) {
      const safe = (options, fallback) => {
        try {
          return new Intl.DateTimeFormat(tag, options)
        } catch {
          return fallback
        }
      }
      const dayFormat = safe({ month: 'numeric', day: 'numeric' }, null)
      const weekdayFormat = safe({ weekday: 'short' }, null)
      const monthDayFormat = safe({ month: 'short', day: 'numeric' }, null)
      const fullFormat = safe({ year: 'numeric', month: 'long', day: 'numeric' }, null)
      return {
        day: (key) => (dayFormat === null ? key.slice(5) : dayFormat.format(keyToDate(key))),
        weekday: (key) => (weekdayFormat === null ? '' : weekdayFormat.format(keyToDate(key))),
        monthDay: (key) => (monthDayFormat === null ? key.slice(5) : monthDayFormat.format(keyToDate(key))),
        full: (key) => (fullFormat === null ? key : fullFormat.format(keyToDate(key))),
      }
    }

    /* ---------------------------------------------------------------- series */

    /**
     * The reading window a range id selects, in days before today.
     * @param {string} range - one of `7`, `30`, `90`, `all`.
     * @returns {number} window length in days, or Infinity.
     */
    function rangeDays(range) {
      if (range === '7') return 7
      if (range === '30') return 30
      if (range === '90') return 90
      return Number.POSITIVE_INFINITY
    }

    /**
     * Group readings into Monday-based weeks and compute each week's change.
     * @param {Array<{ date: string, weight: number }>} entries - sorted readings.
     * @param {number} limit - how many trailing weeks to return.
     * @returns {Array<{ key: string, mean: number, delta: number | null, days: number }>} the weeks.
     */
    function weeklyMovement(entries, limit) {
      const buckets = new Map()
      for (const entry of entries) {
        const date = keyToDate(entry.date)
        const offset = (date.getDay() + 6) % 7
        const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
        const key = dateKey(monday)
        const bucket = buckets.get(key)
        if (bucket === undefined) buckets.set(key, { key, weights: [entry.weight] })
        else bucket.weights.push(entry.weight)
      }
      const weeks = [...buckets.values()].sort((left, right) => left.key.localeCompare(right.key))
      const rows = weeks.map((week, index) => {
        const weekMean = mean(week.weights)
        const previous = weeks[index - 1]
        const previousMean = previous === undefined ? null : mean(previous.weights)
        return {
          key: week.key,
          mean: weekMean,
          delta: previousMean === null || previousMean === undefined ? null : weekMean - previousMean,
          days: week.weights.length,
        }
      })
      return rows.slice(-limit)
    }

    /**
     * Choose the axis step whose label count lands closest to the target, so a
     * short weight range still reads as a scale rather than one lonely line.
     * @param {number} min - padded minimum.
     * @param {number} max - padded maximum.
     * @param {number} target - preferred tick count.
     * @returns {{ ticks: number[], step: number }} the tick values.
     */
    function axisTicks(min, max, target) {
      const candidates = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50]
      let best = null
      for (const step of candidates) {
        const first = Math.ceil(min / step - 1e-9) * step
        const count = Math.floor((max - first) / step + 1e-9) + 1
        if (count < 2 || count > 14) continue
        // A two-line scale is nearly unreadable, so it scores worse than its
        // distance from the target would otherwise say.
        const score = Math.abs(count - target) + (count < 3 ? 3 : 0)
        if (best === null || score < best.score) best = { step, first, count, score }
      }
      if (best === null) return { ticks: [], step: 1 }
      const ticks = []
      for (let index = 0; index < best.count; index += 1) ticks.push(round1(best.first + index * best.step))
      return { ticks, step: best.step }
    }

    /**
     * Monotone cubic (Fritsch–Carlson) path through the points: smooth, and it
     * never overshoots a segment's endpoints, so a trend is never invented.
     * @param {Array<{ x: number, y: number }>} points - ascending x.
     * @returns {string} an SVG path.
     */
    function monotonePath(points) {
      const count = points.length
      if (count === 0) return ''
      if (count === 1) return `M${points[0].x} ${points[0].y}`
      const estimate = (value) => Math.round(value * 100) / 100
      const gaps = []
      const slopes = []
      for (let index = 0; index < count - 1; index += 1) {
        const gap = points[index + 1].x - points[index].x
        gaps.push(gap)
        slopes.push(gap === 0 ? 0 : (points[index + 1].y - points[index].y) / gap)
      }
      const tangents = new Array(count)
      tangents[0] = slopes[0]
      tangents[count - 1] = slopes[count - 2]
      for (let index = 1; index < count - 1; index += 1) {
        tangents[index] = slopes[index - 1] * slopes[index] <= 0
          ? 0
          : (slopes[index - 1] + slopes[index]) / 2
      }
      for (let index = 0; index < count - 1; index += 1) {
        if (slopes[index] === 0) {
          tangents[index] = 0
          tangents[index + 1] = 0
          continue
        }
        const left = tangents[index] / slopes[index]
        const right = tangents[index + 1] / slopes[index]
        const norm = left * left + right * right
        if (norm > 9) {
          const scale = 3 / Math.sqrt(norm)
          tangents[index] = scale * left * slopes[index]
          tangents[index + 1] = scale * right * slopes[index]
        }
      }
      let path = `M${estimate(points[0].x)} ${estimate(points[0].y)}`
      for (let index = 0; index < count - 1; index += 1) {
        const third = gaps[index] / 3
        const from = points[index]
        const to = points[index + 1]
        path += ` C${estimate(from.x + third)} ${estimate(from.y + tangents[index] * third)}`
          + ` ${estimate(to.x - third)} ${estimate(to.y - tangents[index + 1] * third)}`
          + ` ${estimate(to.x)} ${estimate(to.y)}`
      }
      return path
    }

    /**
     * Split readings into runs the line may join without crossing a long gap.
     * @param {Array<{ ms: number }>} points - ascending readings.
     * @returns {number[][]} index runs.
     */
    function runsOf(points) {
      if (points.length === 0) return []
      const runs = [[0]]
      for (let index = 1; index < points.length; index += 1) {
        const gap = points[index].ms - points[index - 1].ms
        if (gap > MAX_GAP_MS) runs.push([index])
        else runs[runs.length - 1].push(index)
      }
      return runs
    }

    /* ----------------------------------------------------------------- store */

    /**
     * Observable snapshot the slot renderer binds to hook props.
     * @returns {{ getSnapshot: () => object, subscribe: (listener: () => void) => () => void, publish: (next: object) => void }} the source.
     */
    function createSource() {
      const initial = { status: 'loading', entries: [], settings: { heightCm: null, goalWeight: null, reminder: null }, error: null }
      let snapshot = initial
      const listeners = new Set()
      return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
        publish: (next) => {
          snapshot = next
          for (const listener of [...listeners]) listener()
        },
      }
    }

    /**
     * Call one Host route and unwrap its envelope.
     * @param {string} path - route path after the plugin prefix.
     * @param {object} [body] - JSON body.
     * @returns {Promise<object>} the route's value.
     */
    async function callHost(path, body) {
      const response = await fetch(`api/weight-journal/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      if (payload === null || typeof payload !== 'object') throw new Error('Malformed response')
      if (payload.ok !== true) {
        const failure = payload.error !== null && typeof payload.error === 'object' ? payload.error : {}
        const error = new Error(typeof failure.message === 'string' ? failure.message : 'Request failed')
        error.code = typeof failure.code === 'string' ? failure.code : 'unknown'
        throw error
      }
      return payload.value
    }

    /**
     * Build the read/write actions both the page and its callbacks share.
     * @param {ReturnType<typeof createSource>} source - the observable snapshot.
     * @returns {{ reload: () => Promise<void>, save: (input: object) => Promise<object>, remove: (date: string) => Promise<object>, saveSettings: (patch: object) => Promise<object> }} the actions.
     */
    function createActions(source) {
      // The capsule's seat rides in `settings`, which an older Host build drops
      // from its reply. Holding the last seat it was given keeps the capsule
      // where the reader put it until the app is restarted onto this build.
      let seat = null
      const commit = (state) => {
        const settings = state.settings !== null && typeof state.settings === 'object' ? state.settings : {}
        const reminder = settings.reminder === undefined ? seat : settings.reminder
        source.publish({ status: 'ready', entries: state.entries, settings: { ...settings, reminder }, error: null })
      }
      // The reminder and the page mount together at startup; one read serves both.
      let pending = null
      return {
        reload() {
          if (pending !== null) return pending
          const current = source.getSnapshot()
          source.publish({ ...current, status: current.entries.length === 0 ? 'loading' : 'refreshing', error: null })
          pending = (async () => {
            try {
              commit(await callHost('read'))
            } catch (error) {
              source.publish({
                status: 'error',
                entries: current.entries,
                settings: current.settings,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          })()
          return pending.finally(() => {
            pending = null
          })
        },
        async save(input) {
          try {
            const state = await callHost('write', { action: 'record', ...input })
            commit(state)
            return { ok: true }
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : String(error) }
          }
        },
        async remove(date) {
          try {
            commit(await callHost('write', { action: 'delete', date }))
            return { ok: true }
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : String(error) }
          }
        },
        async saveSettings(patch) {
          try {
            const state = await callHost('write', { action: 'settings', ...patch })
            if ('reminder' in patch) seat = patch.reminder === null ? null : patch.reminder
            commit(state)
            return { ok: true }
          } catch (error) {
            return { ok: false, message: error instanceof Error ? error.message : String(error) }
          }
        },
      }
    }

    /* ---------------------------------------------------------------- styles */

    const CSS = `
.wj-page {
  --wj-inset: clamp(24px, 4vw, 48px);
  --wj-top: 28px;
  --wj-card-fill: var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2));
  --wj-card-stroke: var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l3));
  --wj-field: var(--dsw-alias-bg-layer-3);
  --wj-ring-color: var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  --wj-ring-width: var(--dsw-focus-ring-width, 2px);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family);
  font-size: 14px;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}
.wj-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  --dsh-scrollbar-width: 9px;
  --dsh-scrollbar-thumb-border: 2px;
}
.wj-content {
  box-sizing: border-box;
  max-width: calc(960px + 2 * var(--wj-inset));
  margin: 0 auto;
  padding: 0 var(--wj-inset) 56px;
}
@media (max-width: 767px) {
  .wj-page { --wj-inset: 20px; }
}

/* ---- head ---- */
.wj-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: var(--wj-top);
  margin-bottom: 20px;
}
[data-platform='darwin'] .wj-head {
  padding-top: calc(var(--wj-top) + var(--dsh-frame-top-clearance, 0px));
}
.wj-headText { min-width: 0; }
/* A central panel gets no title row of its own in the frame, so the way back to
   the Conversation sits above the title, on the column's own left edge. */
.wj-crumb {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 24px;
  margin: 0 0 4px -4px;
  padding: 0 7px 0 3px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.16s var(--ds-ease-in-out, ease), color 0.16s var(--ds-ease-in-out, ease);
}
.wj-crumb svg {
  flex: none;
  opacity: 0.8;
  transition: transform 0.16s var(--ds-ease-in-out, ease), opacity 0.16s var(--ds-ease-in-out, ease);
}
@media (hover: hover) {
  .wj-crumb:hover {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
  }
  .wj-crumb:hover svg { opacity: 1; transform: translateX(-1px); }
}
.wj-crumb:active { background: var(--dsw-alias-interactive-bg-active); }
.wj-crumb:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-title {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
}
.wj-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary);
}
.wj-actions { display: flex; flex: none; align-items: center; gap: 8px; }

/* ---- controls ---- */
.wj-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  height: 32px;
  padding: 0 14px;
  border: 0.5px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.16s var(--ds-ease-in-out, ease), color 0.16s var(--ds-ease-in-out, ease);
}
.wj-btn:active { background: var(--dsw-alias-interactive-bg-active); }
.wj-btn:disabled { opacity: 0.5; cursor: default; }
.wj-btn:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 2px; }
.wj-btn--quiet { border-color: var(--wj-card-stroke); color: var(--dsw-alias-label-secondary); }
.wj-btn--primary {
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary));
  color: var(--dsw-alias-label-primary-foreground);
  font-weight: 500;
}
.wj-btn--wide { width: 100%; height: 40px; border-radius: var(--dsw-radius-md); }
@media (hover: hover) {
  .wj-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
  .wj-btn--primary:hover {
    background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-brand-primary));
    color: var(--dsw-alias-label-primary-foreground);
  }
}

/* ---- cards ---- */
.wj-card {
  box-sizing: border-box;
  padding: 20px 22px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: var(--dsw-radius-xl);
  background: var(--wj-card-fill);
}
.wj-row { display: grid; gap: 16px; margin-top: 20px; }
.wj-row--hero { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); }
.wj-row--heroEmpty { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); }
/* The two lower cards hold different amounts of content; letting each end
   where its content ends beats stretching the short one into a tall void. */
.wj-row--lower { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: start; }
@container (max-width: 880px) {
  .wj-row--hero, .wj-row--heroEmpty, .wj-row--lower { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 767px) {
  .wj-value { font-size: 38px; }
  .wj-kpiValue { font-size: 15px; }
}
@container (max-width: 540px) {
  .wj-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; }
  .wj-kpi:nth-child(odd) { padding-left: 0; border-left: 0; }
  .wj-kpi:nth-child(n + 3) {
    padding-top: 12px;
    border-top: 0.5px solid var(--wj-card-stroke);
  }
}

/* ---- hero ---- */
.wj-hero { display: flex; flex-direction: column; gap: 16px; }
.wj-kicker {
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary);
}
.wj-valueRow { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
.wj-value {
  font-size: 44px;
  line-height: 1;
  font-weight: 500;
}
.wj-value--muted { color: var(--dsw-alias-label-tertiary); font-size: 24px; }
.wj-unit { font-size: 14px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
.wj-meta { margin-top: 8px; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-tertiary); }
.wj-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 9px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.wj-chip--down {
  color: var(--dsw-alias-state-success-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 13%, transparent);
}
.wj-chip--up {
  color: var(--dsw-alias-state-warn-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent);
}
.wj-chip--tiny { height: 20px; padding: 0 7px; font-size: 11px; }

.wj-progress { display: flex; flex-direction: column; gap: 7px; }
.wj-goalRow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 12px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.wj-track {
  position: relative;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--wj-field);
}
.wj-trackFill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: var(--dsw-alias-brand-primary);
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent),
    var(--dsw-alias-brand-primary));
  transition: width 0.5s var(--ds-ease-in-out, ease);
}

.wj-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-top: 14px;
  border-top: 0.5px solid var(--wj-card-stroke);
  /* The composer beside the hero card is the taller column; pin the figures to
     the card's bottom edge so the spare height becomes a margin, not a void. */
  margin-top: auto;
}
.wj-kpi { min-width: 0; padding-right: 8px; }
.wj-kpi + .wj-kpi {
  padding-left: 14px;
  border-left: 0.5px solid var(--wj-card-stroke);
}
.wj-kpiLabel {
  font-size: 11px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wj-kpiValue { margin-top: 2px; font-size: 16px; line-height: 23px; font-weight: 500; white-space: nowrap; }
.wj-kpiValue small { font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-tertiary); }

/* ---- composer ---- */
.wj-composer { display: flex; flex-direction: column; gap: 12px; }
.wj-cardTitle { margin: 0; font-size: 14px; line-height: 22px; font-weight: 500; }
.wj-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.wj-label { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.wj-dateRow { display: flex; align-items: center; gap: 8px; }
.wj-input {
  box-sizing: border-box;
  height: 34px;
  min-width: 0;
  padding: 0 10px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: var(--dsw-radius-md);
  background: var(--wj-field);
  color: inherit;
  font: inherit;
  font-size: 13px;
  transition: border-color 0.16s var(--ds-ease-in-out, ease);
}
.wj-input:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.wj-dateRow .wj-input { flex: 1; }
.wj-dateRow input[type='date']::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
.wj-weightRow { display: flex; align-items: stretch; gap: 8px; }
.wj-step {
  flex: none;
  width: 38px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: var(--dsw-radius-md);
  background: var(--wj-field);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.16s var(--ds-ease-in-out, ease);
}
.wj-step:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-weightField { position: relative; flex: 1; min-width: 0; }
.wj-weightInput {
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  padding: 0 34px 0 12px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: var(--dsw-radius-md);
  background: var(--wj-field);
  color: inherit;
  font: inherit;
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  appearance: textfield;
  transition: border-color 0.16s var(--ds-ease-in-out, ease);
}
.wj-weightInput::-webkit-outer-spin-button,
.wj-weightInput::-webkit-inner-spin-button { appearance: none; margin: 0; }
.wj-weightInput:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-weightUnit {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  pointer-events: none;
}
@media (hover: hover) {
  .wj-input:hover { border-color: var(--dsw-alias-border-l2); }
  .wj-step:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
}
.wj-hint { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.wj-feedback { min-height: 18px; font-size: 12px; line-height: 18px; }
.wj-feedback--ok { color: var(--dsw-alias-state-success-primary); }
.wj-feedback--error { color: var(--dsw-alias-state-error-primary); }

/* ---- chart ---- */
.wj-chartHead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.wj-chartTitle { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; min-width: 0; }
.wj-chartNote { font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.wj-seg {
  display: inline-flex;
  flex: none;
  gap: 2px;
  padding: 2px;
  border-radius: 10px;
  background: var(--wj-field);
}
.wj-segBtn {
  height: 26px;
  padding: 0 10px;
  border: 0.5px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.16s var(--ds-ease-in-out, ease), color 0.16s var(--ds-ease-in-out, ease);
}
.wj-segBtn:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-segBtn[data-active='true'] {
  border-color: var(--wj-card-stroke);
  background: var(--wj-card-fill);
  color: var(--dsw-alias-label-primary);
}
@media (hover: hover) {
  .wj-segBtn:hover { color: var(--dsw-alias-label-primary); }
}
.wj-chartWrap { position: relative; width: 100%; }
.wj-chartSvg { display: block; width: 100%; touch-action: pan-y; }
.wj-axisText {
  fill: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-family: var(--dsw-font-family);
}
.wj-grid { stroke: var(--dsw-alias-border-l2); stroke-width: 1; opacity: 0.6; }
.wj-area { stroke: none; }
.wj-line {
  fill: none;
  stroke: var(--dsw-alias-brand-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.wj-mean {
  fill: none;
  stroke: var(--dsw-alias-label-tertiary);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 4 4;
  opacity: 0.85;
}
.wj-goalLine { stroke: var(--dsw-alias-state-success-primary); stroke-width: 1.2; stroke-dasharray: 5 5; opacity: 0.8; }
.wj-dot { fill: var(--wj-card-fill); stroke: var(--dsw-alias-brand-primary); stroke-width: 1.6; }
.wj-pulse { fill: var(--dsw-alias-brand-primary); opacity: 0.14; }
.wj-lastDot { fill: var(--dsw-alias-brand-primary); stroke: var(--wj-card-fill); stroke-width: 2; }
.wj-placeholder { stroke: var(--dsw-alias-border-l2); stroke-width: 1; stroke-dasharray: 3 5; opacity: 0.75; }
.wj-hoverLine { stroke: var(--dsw-alias-border-l2); stroke-width: 1; }
.wj-hoverDot { fill: var(--dsw-alias-brand-primary); stroke: var(--wj-card-fill); stroke-width: 2; }
.wj-tip {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  max-width: min(240px, 100%);
  padding: 8px 10px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: 10px;
  background: var(--dsw-alias-bg-overlay);
  box-shadow: 0 8px 20px var(--dsw-alias-bg-mask-2);
  pointer-events: none;
  transition: opacity 0.12s var(--ds-ease-in-out, ease);
}
.wj-tipDate { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }
.wj-tipValue { font-size: 15px; line-height: 21px; font-weight: 500; white-space: nowrap; }
.wj-tipValue small { font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-tertiary); }
.wj-tipDelta { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.wj-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}
.wj-emptyTitle { font-size: 13px; color: var(--dsw-alias-label-secondary); }
.wj-empty--overlay { position: absolute; inset: 0; pointer-events: none; }
.wj-emptyMark { display: block; margin-bottom: 2px; color: var(--dsw-alias-border-l2); }

/* ---- first run ---- */
.wj-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 24px 36px;
  margin-top: 20px;
  text-align: center;
}
.wj-startMark { display: block; color: var(--dsw-alias-border-l2); }
.wj-startTitle { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; }
.wj-startText {
  max-width: 420px;
  margin: -6px 0 0;
  font-size: 13px;
  line-height: 21px;
  color: var(--dsw-alias-label-tertiary);
}
.wj-startRules {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wj-startRules li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 12px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: 14px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.wj-startRules li::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary);
  opacity: 0.6;
}

/* ---- weekly bars ---- */
.wj-bars {
  display: flex;
  align-items: stretch;
  gap: 6px;
  height: 132px;
  margin-top: 12px;
  /* One continuous zero line behind the columns: drawn per column it broke into
     dashes at every gap and the bars looked like they hung from nothing. */
  background-image: linear-gradient(var(--dsw-alias-border-l3), var(--dsw-alias-border-l3));
  background-size: 100% 1px;
  background-position: 0 calc(50% - 0.5px);
  background-repeat: no-repeat;
}
.wj-barCol { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.wj-barHalf { display: flex; flex: 1; min-height: 0; }
.wj-barHalf--down { align-items: flex-start; }
.wj-barHalf--up { align-items: flex-end; }
.wj-bar {
  width: 100%;
  min-height: 2px;
  border-radius: 4px;
  transform-origin: center;
  animation: wj-bar-grow 0.45s var(--ds-ease-in-out, ease) both;
}
.wj-bar--down {
  background: var(--dsw-alias-state-success-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 72%, transparent);
  border-radius: 0 0 4px 4px;
}
.wj-bar--up {
  background: var(--dsw-alias-state-warn-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 68%, transparent);
  border-radius: 4px 4px 0 0;
}
/* The zero line carries the comparison; border-l2 vanished into the card, so
   it takes the next step up the stroke scale. */
.wj-barAxis { height: 1px; }
.wj-barLabels { display: flex; gap: 6px; margin-top: 8px; }
.wj-barLabel {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 0;
  font-size: 11px;
  line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.wj-barWeek {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wj-barDelta { font-size: 11px; line-height: 14px; font-weight: 500; }
.wj-barDelta--down { color: var(--dsw-alias-state-success-primary); }
.wj-barDelta--up { color: var(--dsw-alias-state-warn-primary); }
.wj-barDelta--flat { color: var(--dsw-alias-label-tertiary); }
@keyframes wj-bar-grow {
  from { transform: scaleY(0.2); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}

/* ---- recent list ---- */
.wj-listHead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 12px;
  margin-bottom: 4px;
}
.wj-rows { display: flex; flex-direction: column; margin: 0 -10px; }
.wj-rowItem {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  border-radius: 10px;
  transition: background 0.16s var(--ds-ease-in-out, ease);
}
.wj-rowMain {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 3px 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.wj-rowMain:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 2px; }
@media (hover: hover) {
  .wj-rowItem:hover { background: var(--dsw-alias-interactive-bg-hover); }
}
.wj-rowDate { display: flex; flex-direction: column; }
.wj-rowDay { font-size: 13px; line-height: 18px; font-weight: 500; }
.wj-rowWeek { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }
.wj-rowBody { display: flex; flex-direction: column; min-width: 0; }
.wj-rowWeight { font-size: 13px; line-height: 18px; font-weight: 500; }
.wj-rowWeight small { font-size: 11px; font-weight: 400; color: var(--dsw-alias-label-tertiary); }
.wj-rowNote {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wj-rowTail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.wj-iconBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-state-error-primary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.16s var(--ds-ease-in-out, ease), background 0.16s var(--ds-ease-in-out, ease);
}
.wj-rowItem:hover .wj-iconBtn,
.wj-rowItem:focus-within .wj-iconBtn { opacity: 1; }
@media (hover: none) {
  .wj-iconBtn { opacity: 1; }
}
@media (hover: hover) {
  .wj-iconBtn:hover { background: var(--dsw-alias-interactive-bg-hover-danger, var(--dsw-alias-interactive-bg-hover)); }
}
.wj-iconBtn:focus-visible { opacity: 1; outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
.wj-confirm { display: flex; align-items: center; gap: 6px; }
.wj-confirmText { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.wj-miniBtn {
  height: 28px;
  padding: 0 10px;
  border: 0.5px solid var(--wj-card-stroke);
  border-radius: 14px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.wj-miniBtn--danger {
  color: var(--dsw-alias-state-error-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);
}
.wj-miniBtn:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
@media (hover: hover) {
  .wj-miniBtn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
  .wj-miniBtn--danger:hover {
    background: var(--dsw-alias-interactive-bg-hover-danger, var(--dsw-alias-interactive-bg-hover));
    color: var(--dsw-alias-state-error-primary);
  }
}

/* ---- dialog ---- */
.wj-veil {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--dsw-alias-bg-mask-1);
  animation: wj-fade 0.14s var(--ds-ease-in-out, ease) both;
}
.wj-dialog {
  box-sizing: border-box;
  width: min(420px, 100%);
  max-height: 100%;
  overflow: auto;
  padding: 20px;
  border: 0;
  border-radius: var(--dsw-radius-xl);
  background: var(--dsw-alias-bg-layer-2);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  box-shadow: var(--dsw-elevation-prominent, 0 24px 64px var(--dsw-alias-bg-mask-2));
}
.wj-dialogHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.wj-dialogTitle { margin: 0; font-size: 15px; line-height: 22px; font-weight: 500; }
.wj-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: -4px -6px 0 0;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.wj-close:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 1px; }
@media (hover: hover) {
  .wj-close:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
}
.wj-dialogBody { display: flex; flex-direction: column; gap: 14px; }
.wj-dialogFoot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.wj-dialogFoot .wj-feedback { flex: 1; margin: 0; }
.wj-seatRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.wj-seatText { display: flex; flex: 1 1 auto; flex-direction: column; gap: 3px; min-width: 0; }
.wj-seatText .wj-hint { line-height: 16px; }
.wj-seatRow .wj-btn { flex: none; }
.wj-seatRow .wj-btn[disabled] { opacity: 0.45; cursor: default; }
@keyframes wj-fade { from { opacity: 0; } to { opacity: 1; } }

/* ---- reminder ---- */
.wj-reminderLayer {
  /* Fixed rather than absolute: the slot host is free to wrap this entry in a
     box of its own, and then left/top would be measured from that box. Fixed
     pins the seat to the viewport, which is exactly what the stored fractions
     are fractions of. */
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  pointer-events: none;
}
.wj-reminder {
  --wj-ring-width: var(--dsw-focus-ring-width, 2px);
  --wj-ring-color: var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: max-content;
  /* The longest shipped line measures ~235px; the cap is headroom, not a target. */
  max-width: 264px;
  height: 30px;
  padding: 0 9px 0 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font-family: var(--dsw-font-family);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  letter-spacing: 0.005em;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
  -webkit-app-region: no-drag;
  animation: wj-rise 540ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease,
    box-shadow 160ms ease;
}
/* Held: the capsule lifts off the strip and stops trying to be a link. */
.wj-reminder.is-dragging {
  cursor: grabbing;
  border-color: var(--dsw-alias-border-l3);
  background: var(--dsw-alias-bg-layer-3);
  box-shadow: var(--dsw-elevation-prominent, 0 8px 20px var(--dsw-alias-bg-mask-2));
  animation: none;
}
.wj-reminder.is-dragging .wj-reminderGo { opacity: 0; }
.wj-reminderGlyph {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-secondary);
  transition: color 200ms ease;
}
.wj-reminderText {
  min-width: 116px;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
}
.wj-reminderLine {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
  animation: wj-beat 640ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.wj-reminderGo {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  color: var(--dsw-alias-label-tertiary);
  opacity: 0.55;
  transition: opacity 160ms ease, transform 160ms ease;
}
.wj-reminder.is-recorded .wj-reminderGlyph { color: var(--dsw-alias-brand-primary); }
.wj-reminder:not(.is-recorded) .wj-reminderGlyph circle { animation: wj-wait 3.4s ease-in-out infinite; }
.wj-reminder:focus-visible { outline: var(--wj-ring-width) solid var(--wj-ring-color); outline-offset: 2px; }
.wj-reminder:focus-visible .wj-reminderGo { opacity: 1; transform: translateX(1px); }
@media (hover: hover) {
  .wj-reminder:hover {
    border-color: var(--dsw-alias-border-l3);
    background: var(--dsw-alias-bg-layer-3);
  }
  .wj-reminder:hover .wj-reminderGo { opacity: 1; transform: translateX(1px); }
}
@keyframes wj-rise {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}
@keyframes wj-beat {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
@keyframes wj-wait {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.3; }
}

/* ---- misc ---- */
@media (prefers-reduced-motion: reduce) {
  .wj-page *, .wj-page *::before, .wj-page *::after,
  .wj-reminder, .wj-reminder * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`

    /* ----------------------------------------------------------------- icons */

    /**
     * The sidebar panel glyph: a handle over a scale body, inherited from the
     * row's own colour.
     * @param {{ size: number, active?: boolean }} props - the sidebar's icon share.
     * @returns {import('react').ReactElement} the glyph.
     */
    function PanelIcon({ size }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 36 36',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M12.6 13.4v-2.2a5.4 5.4 0 0 1 10.8 0v2.2',
        stroke: 'currentColor',
        strokeWidth: 2.1,
        strokeLinecap: 'round',
        opacity: 0.75,
      }),
      h('rect', {
        x: 7.2,
        y: 12.6,
        width: 21.6,
        height: 17.2,
        rx: 5.4,
        fill: 'currentColor',
        opacity: 0.13,
      }),
      h('rect', {
        x: 7.2,
        y: 12.6,
        width: 21.6,
        height: 17.2,
        rx: 5.4,
        stroke: 'currentColor',
        strokeWidth: 2.1,
      }),
      h('path', {
        d: 'M13.6 21.2h8.8',
        stroke: 'currentColor',
        strokeWidth: 2.1,
        strokeLinecap: 'round',
        opacity: 0.6,
      }))
    }

    /**
     * Trash glyph for one entry row.
     * @param {{ size?: number }} props - glyph size.
     * @returns {import('react').ReactElement} the glyph.
     */
    function TrashIcon({ size = 15 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M2.9 4.1h10.2M6.3 4.1V2.9h3.4v1.2M4.2 4.1l.6 8.1a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.6-8.1',
        stroke: 'currentColor',
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    /**
     * Close glyph for the settings dialog.
     * @param {{ size?: number }} props - glyph size.
     * @returns {import('react').ReactElement} the glyph.
     */
    function CloseIcon({ size = 14 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M4 4l8 8M12 4l-8 8',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
      }))
    }

    /**
     * Sliders glyph for the settings action.
     * @param {{ size?: number }} props - glyph size.
     * @returns {import('react').ReactElement} the glyph.
     */
    function GearIcon({ size = 15 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M2.4 5.2h5M10.4 5.2h3.2M2.4 10.8h3.2M8.4 10.8h5.2',
        stroke: 'currentColor',
        strokeWidth: 1.3,
        strokeLinecap: 'round',
      }),
      h('circle', { cx: 9.1, cy: 5.2, r: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
      h('circle', { cx: 6.9, cy: 10.8, r: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }))
    }

    /**
     * Left chevron for the header's way back to the Conversation.
     * @param {{ size?: number }} props - Pixel size of the square glyph.
     * @returns {import('react').ReactElement} the glyph.
     */
    function ChevronLeftIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M9.8 3.6 5.4 8l4.4 4.4',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    /* ------------------------------------------------------------ sub views */

    /**
     * Chart legend chip.
     * @param {{ className: string, label: string }} props - swatch class and text.
     * @returns {import('react').ReactElement} the legend row.
     */
    function LegendItem({ className, label }) {
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } },
        h('span', {
          style: {
            display: 'inline-block',
            width: 12,
            height: 3,
            borderRadius: 2,
            background: className,
          },
        }),
        label)
    }

    /**
     * Measure an element's inline content width.
     * @returns {[import('react').RefObject<HTMLElement>, number]} the ref and its width.
     */
    function useMeasuredWidth() {
      const ref = React.useRef(null)
      const [width, setWidth] = React.useState(0)
      React.useEffect(() => {
        const node = ref.current
        if (node === null) return undefined
        const apply = (next) => setWidth(current => (Math.abs(current - next) < 1 ? current : next))
        apply(Math.round(node.getBoundingClientRect().width))
        if (typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver((records) => {
          for (const record of records) apply(Math.round(record.contentRect.width))
        })
        observer.observe(node)
        return () => observer.disconnect()
      }, [])
      return [ref, width]
    }

    /**
     * The chart's empty frame: the same axis rhythm as a real plot, with one
     * dashed horizon, so a first visit reads as a chart waiting for data rather
     * than a blank card.
     * @param {object} props - measured width, height, and copy.
     * @returns {import('react').ReactElement} the empty chart body.
     */
    function EmptyChart({ width, height, t, hasEntries }) {
      const pad = { top: 18, right: 16, bottom: 28, left: 44 }
      const plotWidth = Math.max(0, width - pad.left - pad.right)
      const plotHeight = height - pad.top - pad.bottom
      return h('div', { className: 'wj-chartWrap' },
        h('svg', {
          className: 'wj-chartSvg',
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          'aria-hidden': 'true',
        },
        [0, 1, 2, 3].map(index => h('line', {
          key: `frame-${index}`,
          className: 'wj-grid',
          x1: pad.left,
          x2: pad.left + plotWidth,
          y1: pad.top + (plotHeight * index) / 3,
          y2: pad.top + (plotHeight * index) / 3,
        })),
        h('line', {
          className: 'wj-placeholder',
          x1: pad.left,
          x2: pad.left + plotWidth,
          y1: pad.top + plotHeight * 0.46,
          y2: pad.top + plotHeight * 0.46,
        })),
        h('div', { className: 'wj-empty wj-empty--overlay' },
          h('svg', {
            className: 'wj-emptyMark',
            width: 64,
            height: 22,
            viewBox: '0 0 64 22',
            fill: 'none',
            'aria-hidden': 'true',
          },
          h('path', {
            d: 'M2 17.5C11 16.4 15.5 11.8 22.5 11.2C29.5 10.6 33.5 14 40 12.4C46.5 10.8 51 5.4 62 3.4',
            stroke: 'currentColor',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
            strokeDasharray: '4 4',
          })),
          h('span', { className: 'wj-emptyTitle' }, hasEntries ? t('chart.rangeEmpty') : t('chart.empty'))))
    }

    /**
     * The trend chart: axes, grid, a monotone curve with a soft fill, the mean
     * line, the goal line, and a crosshair readout.
     * @param {object} props - chart inputs.
     * @returns {import('react').ReactElement} the chart card body.
     */
    function TrendChart(props) {
      const { entries, range, settings, t, fmt, revision } = props
      const [wrapRef, width] = useMeasuredWidth()
      const [hover, setHover] = React.useState(null)
      const tipRef = React.useRef(null)
      // The tooltip is positioned from its own measured box: a Chinese readout
      // is wider and taller than the Latin one, and guessing overflowed it.
      const [tipBox, setTipBox] = React.useState({ width: 0, height: 0 })

      React.useEffect(() => { setHover(null) }, [range, revision])

      const height = 272
      const pad = { top: 18, right: 16, bottom: 28, left: 44 }
      const plotWidth = Math.max(0, width - pad.left - pad.right)
      const plotHeight = height - pad.top - pad.bottom
      const todayMs = keyToMs(todayKey())
      const windowDays = rangeDays(range)

      const points = React.useMemo(() => {
        const first = windowDays === Number.POSITIVE_INFINITY
          ? Number.NEGATIVE_INFINITY
          : todayMs - (windowDays - 1) * DAY_MS
        return entries
          .filter(entry => keyToMs(entry.date) >= first)
          .map(entry => ({ key: entry.date, ms: keyToMs(entry.date), weight: entry.weight }))
      }, [entries, range, todayMs, windowDays])

      const geometry = React.useMemo(() => {
        if (width <= 0 || plotWidth <= 0) return null
        if (points.length === 0) {
          return { empty: true, axis: { min: 0, max: 0, ticks: [] } }
        }
        // A single reading sits centred in a short window instead of being
        // pinned to the right edge of a long empty plane.
        let left
        let right
        if (points.length === 1) {
          left = points[0].ms - 3 * DAY_MS
          right = points[0].ms + 3 * DAY_MS
        } else {
          right = Math.max(todayMs, points[points.length - 1].ms)
          left = windowDays === Number.POSITIVE_INFINITY
            ? points[0].ms
            : Math.max(points[0].ms, todayMs - (windowDays - 1) * DAY_MS)
          if (right - left < 6 * DAY_MS) left = right - 6 * DAY_MS
        }
        const weights = points.map(point => point.weight)
        const low = Math.min(...weights)
        const high = Math.max(...weights)
        const centre = (low + high) / 2
        const span = Math.max(high - low, 2)
        let min = centre - span / 2 - span * 0.16
        let max = centre + span / 2 + span * 0.16
        // A reachable goal shares the readings' scale: the dashed line is the
        // point of the chart. An unreachable one stays out of the scale and is
        // still stated in the header.
        const target = settings.goalWeight
        let offScaleGoal = null
        if (target !== null && target !== undefined) {
          const scope = (max - min) * 1.5
          if (target >= min - scope && target <= max + scope) {
            const breathe = (max - min) * 0.06
            min = Math.min(min, target - breathe)
            max = Math.max(max, target + breathe)
          } else {
            offScaleGoal = target
          }
        }
        const { ticks } = axisTicks(min, max, 4)
        const x = (ms) => pad.left + ((ms - left) / (right - left)) * plotWidth
        const y = (weight) => pad.top + ((max - weight) / (max - min)) * plotHeight
        const plotted = points.map(point => ({ ...point, x: x(point.ms), y: y(point.weight) }))
        const runs = runsOf(points).map(run => run.map(index => plotted[index]))
        const meanPoints = []
        for (let index = MEAN_WINDOW - 1; index < points.length; index += 1) {
          const slice = points.slice(index - MEAN_WINDOW + 1, index + 1)
          const average = mean(slice.map(point => point.weight))
          if (average !== null) meanPoints.push({ x: x(points[index].ms), y: y(average) })
        }
        const baseline = pad.top + plotHeight
        const areas = runs.map((run) => {
          if (run.length < 2) return ''
          const curve = monotonePath(run)
          return `${curve} L${run[run.length - 1].x} ${baseline} L${run[0].x} ${baseline} Z`
        })
        const xTicks = []
        const tickCount = Math.max(2, Math.min(5, Math.round(plotWidth / 110)))
        for (let index = 0; index <= tickCount; index += 1) {
          const ms = left + ((right - left) * index) / tickCount
          xTicks.push({ x: x(ms), label: fmt.day(msToKey(ms)) })
        }
        const goal = target
        const goalY = goal !== null && goal !== undefined && goal >= min && goal <= max ? y(goal) : null
        const showDots = plotWidth / plotted.length >= 7
        return {
          empty: false,
          plotted,
          runs,
          areas,
          meanPoints,
          xTicks,
          ticks,
          min,
          max,
          baseline,
          left,
          right,
          goalY,
          goal,
          offScaleGoal,
          showDots,
          x,
          y,
        }
      }, [points, plotWidth, plotHeight, width, pad.left, pad.top, todayMs, windowDays, settings.goalWeight, fmt])

      /**
       * Track the pointer against the nearest reading.
       * @param {import('react').PointerEvent<SVGSVGElement>} event - pointer movement.
       * @returns {void}
       */
      const onPointerMove = (event) => {
        if (geometry === null || geometry.empty) return
        const rect = event.currentTarget.getBoundingClientRect()
        const local = event.clientX - rect.left
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        geometry.plotted.forEach((point, index) => {
          const distance = Math.abs(point.x - local)
          if (distance < bestDistance) {
            bestDistance = distance
            best = index
          }
        })
        setHover(bestDistance <= 44 ? best : null)
      }

      const hovered = hover === null || geometry === null || geometry.empty
        ? null
        : geometry.plotted[hover] ?? null
      const hoveredIndex = hovered === null ? -1 : entries.findIndex(entry => entry.date === hovered.key)
      const hoveredDelta = hoveredIndex > 0 ? hovered.weight - entries[hoveredIndex - 1].weight : null
      const lastPoint = geometry === null || geometry.empty
        ? null
        : geometry.plotted[geometry.plotted.length - 1]

      React.useEffect(() => {
        const node = tipRef.current
        if (node === null || node === undefined) return undefined
        const rect = node.getBoundingClientRect()
        if (Math.abs(rect.width - tipBox.width) > 0.5 || Math.abs(rect.height - tipBox.height) > 0.5) {
          setTipBox({ width: rect.width, height: rect.height })
        }
        return undefined
      }, [hovered === null ? '' : hovered.key, tipBox.width, tipBox.height])

      const tipWidth = Math.max(88, tipBox.width)
      const tipHeight = Math.max(40, tipBox.height)
      const tipHalf = Math.min(tipWidth, width) / 2 + 4
      const tipLeft = hovered === null
        ? 0
        : Math.min(Math.max(hovered.x, tipHalf), Math.max(tipHalf, width - tipHalf))
      const tipTop = hovered === null
        ? 0
        : hovered.y - tipHeight - 14 >= 0
          ? hovered.y - tipHeight - 14
          : hovered.y + 16

      return h('section', { className: 'wj-card', style: { marginTop: 20 } },
        h('div', { className: 'wj-chartHead' },
          h('div', { className: 'wj-chartTitle' },
            h('h2', { className: 'wj-cardTitle' }, t('chart.title')),
            h('span', { className: 'wj-chartNote', style: { display: 'inline-flex', alignItems: 'center', gap: 12 } },
              points.length > MEAN_WINDOW
                ? h(LegendItem, { className: 'var(--dsw-alias-label-tertiary)', label: t('chart.mean', { n: MEAN_WINDOW }) })
                : null,
              geometry === null || geometry.empty || geometry.goalY === null
                ? null
                : h(LegendItem, {
                  className: 'var(--dsw-alias-state-success-primary)',
                  label: `${t('chart.goal')} ${kg(geometry.goal)}`,
                }))),
          h('div', { className: 'wj-seg', role: 'group', 'aria-label': t('chart.title') },
            ['7', '30', '90', 'all'].map(value => h('button', {
              key: value,
              type: 'button',
              className: 'wj-segBtn',
              'data-active': value === range ? 'true' : 'false',
              'aria-pressed': value === range,
              onClick: () => props.onRange(value),
            }, t(`range.${value}`))))),

        h('div', { className: 'wj-chartWrap', ref: wrapRef },
          geometry === null || width <= 0
            ? h('div', { className: 'wj-empty', style: { height } }, t('loading'))
            : geometry.empty
              ? h(EmptyChart, { width, height, t, hasEntries: entries.length > 0 })
              : h('svg', {
                className: 'wj-chartSvg',
                width,
                height,
                viewBox: `0 0 ${width} ${height}`,
                role: 'img',
                'aria-label': t('chart.summary', {
                  count: points.length,
                  min: kg(Math.min(...points.map(point => point.weight))),
                  max: kg(Math.max(...points.map(point => point.weight))),
                  latest: kg(points[points.length - 1].weight),
                }),
                onPointerMove,
                onPointerLeave: () => setHover(null),
              },
              h('defs', null,
                h('linearGradient', { id: 'wj-fill', x1: 0, y1: 0, x2: 0, y2: 1 },
                  h('stop', { offset: '0%', stopColor: 'var(--dsw-alias-brand-primary)', stopOpacity: 0.22 }),
                  h('stop', { offset: '72%', stopColor: 'var(--dsw-alias-brand-primary)', stopOpacity: 0.04 }),
                  h('stop', { offset: '100%', stopColor: 'var(--dsw-alias-brand-primary)', stopOpacity: 0 }))),

              geometry.ticks.map(value => h('g', { key: `tick-${value}` },
                h('line', {
                  className: 'wj-grid',
                  x1: pad.left,
                  x2: pad.left + plotWidth,
                  y1: geometry.y(value),
                  y2: geometry.y(value),
                }),
                h('text', {
                  className: 'wj-axisText',
                  x: pad.left - 9,
                  y: geometry.y(value),
                  textAnchor: 'end',
                  dominantBaseline: 'middle',
                }, kg(value)))),

              geometry.goalY === null ? null : h('g', null,
                h('line', {
                  className: 'wj-goalLine',
                  x1: pad.left,
                  x2: pad.left + plotWidth,
                  y1: geometry.goalY,
                  y2: geometry.goalY,
                }),
                h('text', {
                  className: 'wj-axisText',
                  x: pad.left + plotWidth,
                  y: geometry.goalY - 6,
                  textAnchor: 'end',
                  style: { fill: 'var(--dsw-alias-state-success-primary)' },
                }, t('chart.goal'))),

              geometry.offScaleGoal === null ? null : h('text', {
                className: 'wj-axisText',
                x: pad.left + plotWidth,
                y: geometry.baseline - 6,
                textAnchor: 'end',
                style: { fill: 'var(--dsw-alias-state-success-primary)' },
              }, `${t('chart.goal')} ${kg(geometry.offScaleGoal)} ${geometry.offScaleGoal < geometry.min ? '↓' : '↑'}`),

              geometry.areas.map((area, index) => (area === ''
                ? null
                : h('path', { key: `area-${index}`, className: 'wj-area', d: area, fill: 'url(#wj-fill)' }))),

              geometry.runs.map((run, index) => (run.length < 2
                ? null
                : h('path', { key: `line-${index}`, className: 'wj-line', d: monotonePath(run) }))),

              geometry.meanPoints.length < 2
                ? null
                : h('path', { className: 'wj-mean', d: monotonePath(geometry.meanPoints) }),

              geometry.showDots
                ? geometry.plotted.map(point => h('circle', {
                  key: `dot-${point.key}`,
                  className: 'wj-dot',
                  cx: point.x,
                  cy: point.y,
                  r: hovered !== null && hovered.key === point.key ? 0 : 2.4,
                }))
                : null,

              lastPoint === null ? null : h('g', null,
                h('circle', { className: 'wj-pulse', cx: lastPoint.x, cy: lastPoint.y, r: 10 }),
                h('circle', { className: 'wj-lastDot', cx: lastPoint.x, cy: lastPoint.y, r: 4.2 })),

              geometry.xTicks.map((tick, index) => h('text', {
                key: `xtick-${index}`,
                className: 'wj-axisText',
                x: tick.x,
                y: pad.top + plotHeight + 18,
                textAnchor: index === 0 ? 'start' : index === geometry.xTicks.length - 1 ? 'end' : 'middle',
              }, tick.label)),

              hovered === null ? null : h('g', null,
                h('line', {
                  className: 'wj-hoverLine',
                  x1: hovered.x,
                  x2: hovered.x,
                  y1: pad.top,
                  y2: geometry.baseline,
                }),
                h('circle', { className: 'wj-hoverDot', cx: hovered.x, cy: hovered.y, r: 4 }))),

          hovered === null ? null : h('div', {
            className: 'wj-tip',
            ref: tipRef,
            style: { left: tipLeft, top: tipTop, transform: 'translateX(-50%)' },
          },
          h('div', { className: 'wj-tipDate' }, `${fmt.monthDay(hovered.key)} · ${fmt.weekday(hovered.key)}`),
          h('div', { className: 'wj-tipValue' }, `${kg(hovered.weight)} `, h('small', null, 'kg')),
          hoveredDelta === null
            ? null
            : h('div', { className: 'wj-tipDelta' }, t('chart.delta', { value: signedKg(hoveredDelta) })))))
    }

    /**
     * The first-run band: what the page is for, the three rules a newcomer
     * needs, and the one action that starts the journal.
     * @param {object} props - copy and the start callback.
     * @returns {import('react').ReactElement} the empty-journal band.
     */
    function StartHere({ t, onStart }) {
      return h('section', { className: 'wj-card wj-start' },
        h('svg', {
          className: 'wj-startMark',
          width: 104,
          height: 44,
          viewBox: '0 0 104 44',
          fill: 'none',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M2 37H102', stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 5' }),
        h('path', {
          d: 'M6 31.5C18 30 24 22.5 34 21C44 19.5 50 25 60 22.5C70 20 76 11 92 7.5',
          stroke: 'var(--dsw-alias-brand-primary)',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeDasharray: '5 5',
          opacity: 0.75,
        }),
        h('circle', { cx: 92, cy: 7.5, r: 3.4, fill: 'var(--dsw-alias-brand-primary)' })),
        h('h2', { className: 'wj-startTitle' }, t('start.title')),
        h('p', { className: 'wj-startText' }, t('start.text')),
        h('ul', { className: 'wj-startRules' },
          h('li', null, t('start.rule1')),
          h('li', null, t('start.rule2')),
          h('li', null, t('start.rule3'))),
        h('button', { type: 'button', className: 'wj-btn wj-btn--primary', onClick: onStart }, t('start.action')))
    }

    /**
     * Diverging weekly-change bars.
     * @param {object} props - the weekly series and copy.
     * @returns {import('react').ReactElement} the weekly card.
     */
    function WeeklyBars({ weeks, t, fmt }) {
      // Only comparable weeks are drawn: a column without a previous week would
      // render an empty slot beside the zero line.
      const rows = weeks.filter(week => week.delta !== null)
      const deltas = rows.map(week => Math.abs(week.delta))
      const maxDelta = deltas.length === 0 ? 0 : Math.max(...deltas, 0.1)
      return h('section', { className: 'wj-card' },
        h('div', { className: 'wj-listHead' },
          h('h2', { className: 'wj-cardTitle' }, t('week.title'))),
        rows.length === 0
          ? h('div', { className: 'wj-empty', style: { padding: '32px 8px' } }, t('week.empty'))
          : h('div', null,
            h('div', { className: 'wj-bars' },
              rows.map((week) => {
                const delta = week.delta
                const share = delta === null ? 0 : Math.max(4, (Math.abs(delta) / maxDelta) * 100)
                const drop = delta !== null && delta <= 0
                return h('div', {
                  key: week.key,
                  className: 'wj-barCol',
                  title: t('week.tip', { mean: kg(week.mean), delta: signedKg(delta) }),
                },
                h('div', { className: 'wj-barHalf wj-barHalf--up' },
                  delta !== null && !drop
                    ? h('div', { className: 'wj-bar wj-bar--up', style: { height: `${share}%` } })
                    : null),
                h('div', { className: 'wj-barAxis' }),
                h('div', { className: 'wj-barHalf wj-barHalf--down' },
                  drop
                    ? h('div', { className: 'wj-bar wj-bar--down', style: { height: `${share}%` } })
                    : null))
              })),
            h('div', { className: 'wj-barLabels' },
              rows.map(week => h('span', { key: week.key, className: 'wj-barLabel' },
                h('span', { className: 'wj-barWeek' }, fmt.day(week.key)),
                h('span', { className: `wj-barDelta wj-barDelta--${direction(week.delta)}` }, signedKg(week.delta))))),
            h('p', { className: 'wj-hint', style: { margin: '12px 0 0' } }, t('week.hint'))))
    }

    /**
     * One entry row: the row body opens that day in the composer, and the tail
     * carries the change chip and an inline delete confirmation.
     * @param {object} props - the entry, its delta, and the row callbacks.
     * @returns {import('react').ReactElement} the row.
     */
    function EntryRow({ entry, delta, confirming, t, fmt, onSelect, onAskDelete, onCancelDelete, onDelete }) {
      return h('div', { className: 'wj-rowItem' },
        h('button', {
          type: 'button',
          className: 'wj-rowMain',
          'aria-label': t('recent.open', { date: fmt.full(entry.date) }),
          onClick: () => onSelect(entry),
        },
        h('span', { className: 'wj-rowDate' },
          h('span', { className: 'wj-rowDay' }, fmt.day(entry.date)),
          h('span', { className: 'wj-rowWeek' }, fmt.weekday(entry.date))),
        h('span', { className: 'wj-rowBody' },
          h('span', { className: 'wj-rowWeight' }, kg(entry.weight), ' ', h('small', null, 'kg')),
          entry.note === '' ? null : h('span', { className: 'wj-rowNote' }, entry.note))),
        h('span', { className: 'wj-rowTail' },
          delta === null
            ? null
            : h('span', { className: `wj-chip wj-chip--tiny wj-chip--${direction(delta)}` },
              direction(delta) === 'down' ? '↓' : direction(delta) === 'up' ? '↑' : '·',
              ' ',
              signedKg(delta)),
          confirming
            ? h('span', { className: 'wj-confirm' },
              h('span', { className: 'wj-confirmText' }, t('recent.confirm')),
              h('button', {
                type: 'button',
                className: 'wj-miniBtn wj-miniBtn--danger',
                onClick: () => onDelete(entry.date),
              }, t('recent.delete')),
              h('button', {
                type: 'button',
                className: 'wj-miniBtn',
                onClick: () => onCancelDelete(),
              }, t('recent.cancel')))
            : h('button', {
              type: 'button',
              className: 'wj-iconBtn',
              'aria-label': `${t('recent.delete')} ${fmt.full(entry.date)}`,
              onClick: () => onAskDelete(entry.date),
            }, h(TrashIcon, null))))
    }

    /**
     * Settings dialog for the height and goal that drive BMI and progress.
     * @param {object} props - current settings and dialog callbacks.
     * @returns {import('react').ReactElement} the dialog.
     */
    function SettingsDialog({ settings, t, saving, feedback, onClose, onSubmit, onResetSeat }) {
      const [height, setHeight] = React.useState(settings.heightCm === null ? '' : String(settings.heightCm))
      const [goal, setGoal] = React.useState(settings.goalWeight === null ? '' : kg(settings.goalWeight))
      const first = React.useRef(null)
      const dialogRef = React.useRef(null)

      React.useEffect(() => {
        if (first.current !== null) first.current.focus()
      }, [])

      React.useEffect(() => {
        /**
         * Close on Escape and keep Tab inside the dialog.
         * @param {KeyboardEvent} event - the key press.
         * @returns {void}
         */
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
            return
          }
          if (event.key !== 'Tab' || dialogRef.current === null) return
          const focusable = dialogRef.current.querySelectorAll('input, button')
          if (focusable.length === 0) return
          const firstNode = focusable[0]
          const lastNode = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === firstNode) {
            event.preventDefault()
            lastNode.focus()
          } else if (!event.shiftKey && document.activeElement === lastNode) {
            event.preventDefault()
            firstNode.focus()
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => document.removeEventListener('keydown', onKeyDown, true)
      }, [onClose])

      return h('div', {
        className: 'wj-veil',
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
      },
      h('div', {
        className: 'wj-dialog',
        role: 'dialog',
        'aria-labelledby': 'wj-settings-title',
        ref: dialogRef,
      },
      h('div', { className: 'wj-dialogHead' },
        h('h2', { className: 'wj-dialogTitle', id: 'wj-settings-title' }, t('settings.title')),
        h('button', {
          type: 'button',
          className: 'wj-close',
          'aria-label': t('settings.cancel'),
          onClick: onClose,
        }, h(CloseIcon, null))),
      h('div', { className: 'wj-dialogBody' },
        h('label', { className: 'wj-field' },
          h('span', { className: 'wj-label' }, t('settings.height')),
          h('input', {
            className: 'wj-input',
            type: 'number',
            inputMode: 'numeric',
            min: 80,
            max: 260,
            step: 1,
            value: height,
            ref: first,
            onChange: (event) => setHeight(event.target.value),
            placeholder: '175',
          })),
        h('label', { className: 'wj-field' },
          h('span', { className: 'wj-label' }, t('settings.goal')),
          h('input', {
            className: 'wj-input',
            type: 'number',
            inputMode: 'decimal',
            min: 20,
            max: 400,
            step: 0.1,
            value: goal,
            onChange: (event) => setGoal(event.target.value),
            placeholder: '68.0',
          })),
        h('p', { className: 'wj-hint', style: { margin: 0 } }, t('settings.hint')),
        h('div', { className: 'wj-seatRow' },
          h('div', { className: 'wj-seatText' },
            h('span', { className: 'wj-label' }, t('settings.seat')),
            h('span', { className: 'wj-hint' }, t('settings.seatHint'))),
          h('button', {
            type: 'button',
            className: 'wj-btn wj-btn--quiet',
            disabled: saving || settings === null || settings === undefined || settings.reminder === null || settings.reminder === undefined,
            onClick: () => onResetSeat(),
          }, t('settings.seatReset')))),
      h('div', { className: 'wj-dialogFoot' },
        h('span', {
          className: `wj-feedback${feedback === null ? '' : feedback.ok ? ' wj-feedback--ok' : ' wj-feedback--error'}`,
        }, feedback === null ? '' : feedback.text),
        h('button', { type: 'button', className: 'wj-btn', onClick: onClose }, t('settings.cancel')),
        h('button', {
          type: 'button',
          className: 'wj-btn wj-btn--primary',
          disabled: saving,
          onClick: () => onSubmit({
            heightCm: height.trim() === '' ? null : Number(height),
            goalWeight: goal.trim() === '' ? null : Number(goal),
          }),
        }, saving ? '…' : t('settings.save')))))
    }

    /* -------------------------------------------------------------- reminder */

    /**
     * The reminder's beats, in cycle order: today's state spoken in one language
     * per beat. `today` receives an already-localized weight, so the digits
     * follow the beat's own language too. Every line is kept short on purpose —
     * the capsule is a fixed width and a long string would be clipped.
     */
    const REMINDER_VOICES = [
      {
        lang: 'zh',
        tag: 'zh-CN',
        open: '打开体重手账',
        drag: '拖动可移动',
        empty: '今天还没记录',
        today: (w) => `今天 ${w} kg`,
        first: '第一条记录，开始了',
        lighter: (d) => `比上次轻 ${d} kg · 继续保持`,
        heavier: (d) => `比上次重 ${d} kg · 需要加油`,
        steady: '和上次持平 · 稳住就好',
        hints: ['晚饭清淡一点', '别暴饮暴食', '少喝含糖饮料', '饭后走一走', '早点睡，别熬夜', '饭前先喝杯水', '主食减一点', '睡前别加餐'],
      },
      {
        lang: 'en',
        tag: 'en-US',
        open: 'Open the weight journal',
        drag: 'Drag to move',
        empty: 'Nothing yet today',
        today: (w) => `${w} kg today`,
        first: 'First reading, good start',
        lighter: (d) => `Down ${d} kg · keep it up`,
        heavier: (d) => `Up ${d} kg · keep going`,
        steady: 'Holding steady · stay with it',
        hints: ['Keep dinner light', 'No overeating', 'Skip sugary drinks', 'A short walk after', 'Sleep a little earlier', 'A glass of water first', 'Pile the greens high', 'No snacks after nine'],
      },
      {
        lang: 'ja',
        tag: 'ja-JP',
        open: '体重手帳を開く',
        drag: 'ドラッグで移動',
        empty: '今日はまだ未記録',
        today: (w) => `今日 ${w} kg`,
        first: '最初の記録、いい出発',
        lighter: (d) => `前回より ${d} kg 減 · その調子`,
        heavier: (d) => `前回より ${d} kg 増 · もう一息`,
        steady: '前回と同じ · このまま',
        hints: ['夕食はあっさりと', '食べ過ぎに注意', '甘い飲み物を控えめに', '食後に少し歩く', '早めに休む', '食前に水を一杯', '主食は控えめに', '夜食は抜きで'],
      },
      {
        lang: 'fr',
        tag: 'fr-FR',
        open: 'Ouvrir le journal de poids',
        drag: 'Glisser pour déplacer',
        empty: 'Rien aujourd’hui',
        today: (w) => `${w} kg aujourd’hui`,
        first: 'Première mesure, ça démarre',
        lighter: (d) => `${d} kg de moins · continuez`,
        heavier: (d) => `${d} kg de plus · courage`,
        steady: 'Stable · tenez bon',
        hints: ['Dîner léger ce soir', 'Évitez l’excès', 'Moins de sucres', 'Marchez un peu', 'Couchez-vous plus tôt', 'Un verre d’eau avant', 'Portions plus petites', 'Rien après le dîner'],
      },
      {
        lang: 'es',
        tag: 'es-ES',
        open: 'Abrir el diario de peso',
        drag: 'Arrastra para mover',
        empty: 'Nada aún hoy',
        today: (w) => `${w} kg hoy`,
        first: 'Primera lectura, buen inicio',
        lighter: (d) => `${d} kg menos · sigue así`,
        heavier: (d) => `${d} kg más · ánimo`,
        steady: 'Sin cambios · mantén',
        hints: ['Cena ligera', 'Sin excesos', 'Menos azúcar', 'Camina un poco', 'Duerme temprano', 'Agua antes de comer', 'Raciones pequeñas', 'Nada antes de dormir'],
      },
      {
        lang: 'de',
        tag: 'de-DE',
        open: 'Gewichtstagebuch öffnen',
        drag: 'Ziehen zum Verschieben',
        empty: 'Heute noch nichts',
        today: (w) => `Heute ${w} kg`,
        first: 'Erste Messung, guter Start',
        lighter: (d) => `${d} kg weniger · weiter so`,
        heavier: (d) => `${d} kg mehr · dranbleiben`,
        steady: 'Unverändert · bleib dabei',
        hints: ['Abends leicht essen', 'Nicht überessen', 'Weniger Zucker', 'Kurz spazieren', 'Früher schlafen', 'Erst ein Glas Wasser', 'Kleinere Portionen', 'Nichts vor dem Schlafen'],
      },
      {
        lang: 'ru',
        tag: 'ru-RU',
        open: 'Открыть дневник веса',
        drag: 'Перетащите, чтобы сдвинуть',
        empty: 'Нет записи',
        today: (w) => `Сегодня ${w} кг`,
        first: 'Первая запись, начало',
        lighter: (d) => `Минус ${d} кг · так держать`,
        heavier: (d) => `Плюс ${d} кг · не сдавайся`,
        steady: 'Без изменений · держись',
        hints: ['Ужин полегче', 'Без переедания', 'Меньше сахара', 'Пройдись после еды', 'Ложись пораньше', 'Стакан воды до еды', 'Порции поменьше', 'Не есть перед сном'],
      },
      {
        lang: 'pt',
        tag: 'pt-PT',
        open: 'Abrir o diário de peso',
        drag: 'Arraste para mover',
        empty: 'Nada ainda hoje',
        today: (w) => `${w} kg hoje`,
        first: 'Primeira leitura, bom começo',
        lighter: (d) => `Menos ${d} kg · continue`,
        heavier: (d) => `Mais ${d} kg · força`,
        steady: 'Estável · mantenha',
        hints: ['Jantar leve', 'Sem exageros', 'Menos açúcar', 'Ande um pouco', 'Deite-se cedo', 'Água antes da refeição', 'Porções menores', 'Nada antes de dormir'],
      },
    ]

    /**
     * One beat's register. The capsule walks the languages one at a time and
     * gives each its three beats in this order, so within a language it states
     * the day, then the change, then a tip, before moving on.
     */
    const REMINDER_KINDS = ['today', 'delta', 'hint']

    /** One formatter per beat language, built once and reused. */
    const weightFormatters = new Map()

    /**
     * A weight in one language's own decimal separator and digits.
     * @param {string} tag - BCP 47 tag of the beat's language.
     * @param {number} value - kilograms.
     * @returns {string} the formatted weight.
     */
    function spokenWeight(tag, value) {
      let formatter = weightFormatters.get(tag)
      if (formatter === undefined) {
        try {
          formatter = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        } catch {
          formatter = null
        }
        weightFormatters.set(tag, formatter)
      }
      if (formatter === null) return kg(value)
      try {
        return formatter.format(value)
      } catch {
        return kg(value)
      }
    }

    /**
     * The line one beat says: the day's state, the change since the previous
     * reading, or a tip — in the beat's own language.
     * @param {object} voice - the beat's language pack.
     * @param {string} kind - one of REMINDER_KINDS.
     * @param {number} block - how many language turns the cycle has taken.
     * @param {{ weight: number } | null} reading - today's reading, if any.
     * @param {{ weight: number } | null} previous - the reading before today's.
     * @returns {string} the line to show.
     */
    function reminderLine(voice, kind, block, reading, previous) {
      const amount = value => spokenWeight(voice.tag, value)
      // Each language walks its own list of tips in order, one per pass, so a
      // tip never repeats until the list is spent (a pass is every language
      // holding the capsule once).
      if (kind === 'hint') {
        const pass = Math.floor(block / REMINDER_VOICES.length)
        return voice.hints[pass % voice.hints.length]
      }
      // An unrecorded day is nudged the same way whichever fact beat comes up.
      if (reading === null) return voice.empty
      if (kind === 'today') return voice.today(amount(reading.weight))
      if (previous === null) return voice.first
      // Readings are stored to one decimal, so the difference is snapped back
      // to that grid before it is classified as up, down or level.
      const change = Math.round((reading.weight - previous.weight) * 10) / 10
      if (change === 0) return voice.steady
      return change < 0 ? voice.lighter(amount(-change)) : voice.heavier(amount(change))
    }

    /**
     * The capsule's glyph: a falling trend whose last point is the day itself,
     * hollow until the day is recorded. Reads as a fragment of the chart rather
     * than a second copy of the sidebar icon.
     * @param {{ recorded: boolean }} props - whether today already has a reading.
     * @returns {import('react').ReactElement} the glyph.
     */
    function TrendMark({ recorded }) {
      return h('svg', {
        width: 18,
        height: 12,
        viewBox: '0 0 18 12',
        fill: 'none',
        'aria-hidden': 'true',
        style: { display: 'block' },
      },
      h('path', {
        d: 'M1.6 3.5 5.7 6.2 9.3 4.5 12 8.1',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
      h('circle', {
        cx: 14.6,
        cy: 8.9,
        r: 2,
        fill: recorded ? 'currentColor' : 'none',
        stroke: recorded ? 'none' : 'currentColor',
        strokeWidth: recorded ? undefined : 1.2,
      }))
    }

    /**
     * Read one stored seat, ignoring anything that is not a pair of fractions.
     * @param {unknown} value - candidate from the store.
     * @returns {{ x: number, y: number } | null} the seat, or null for the default.
     */
    function reminderSeat(value) {
      if (value === null || typeof value !== 'object') return null
      const x = Number(value.x)
      const y = Number(value.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
    }

    /**
     * Keep a capsule centre inside the window, with a small breathing margin.
     * @param {{ x: number, y: number }} point - wanted centre in pixels.
     * @param {{ width: number, height: number }} bounds - the viewport's size.
     * @param {{ width: number, height: number }} size - the capsule's size.
     * @returns {{ x: number, y: number }} the allowed centre.
     */
    function settleSeatPoint(point, bounds, size) {
      const margin = 4
      const halfX = size.width / 2
      const halfY = size.height / 2
      const leastX = halfX + margin
      const leastY = halfY + margin
      const mostX = Math.max(leastX, bounds.width - halfX - margin)
      const mostY = Math.max(leastY, bounds.height - halfY - margin)
      return {
        x: Math.min(Math.max(point.x, leastX), mostX),
        y: Math.min(Math.max(point.y, leastY), mostY),
      }
    }

    /**
     * The frame-wide reminder: a 30px capsule at the top of the window that
     * speaks today's state in one of several languages, changing on a timer.
     * Clicking it opens the journal page. It can be dragged: another theme may
     * put something under the middle of the title row, and the seat is kept as a
     * fraction of the frame so a resize does not send it back to the middle.
     * @param {object} props - slot runtime props plus the injected journal face.
     * @returns {import('react').ReactElement} the capsule.
     */
    function WeightReminder(props) {
      const useJournal = typeof props.useJournal === 'function' ? props.useJournal : null
      const snapshot = useJournal === null ? null : useJournal(value => value)
      const actions = props.actions
      const loaded = React.useRef(false)

      // The capsule is always mounted, so it — not the page — owns the first
      // read; the page's own reload joins the same request.
      React.useEffect(() => {
        if (loaded.current) return
        loaded.current = true
        if (actions && typeof actions.reload === 'function') actions.reload()
      }, [actions])

      // The cycle opens on the reader's own language and then walks on; each
      // language holds the capsule for REMINDER_KINDS.length beats in a row.
      const [beat, setBeat] = React.useState(() => {
        const primary = String(localeTag(props.locale)).toLowerCase().split(/[-_]/)[0]
        const found = REMINDER_VOICES.findIndex(voice => voice.lang === primary)
        return (found < 0 ? 0 : found) * REMINDER_KINDS.length
      })

      React.useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const cycle = REMINDER_VOICES.length * REMINDER_KINDS.length
        const timer = window.setInterval(() => {
          setBeat(current => (current + 1) % cycle)
        }, REMINDER_BEAT_MS)
        return () => window.clearInterval(timer)
      }, [])

      const ready = snapshot !== null && snapshot.status !== 'loading'
      const stored = ready && snapshot.settings !== null && typeof snapshot.settings === 'object'
        ? reminderSeat(snapshot.settings.reminder)
        : null
      const seatKey = stored === null ? '' : `${stored.x}:${stored.y}`

      const [live, setLive] = React.useState(null)
      const [dragging, setDragging] = React.useState(false)
      const [bounds, setBounds] = React.useState(() =>
        typeof window === 'undefined' ? null : { width: window.innerWidth, height: window.innerHeight })
      const [size, setSize] = React.useState(null)
      const gripRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const movedRef = React.useRef(false)
      const saveTimer = React.useRef(0)

      // Once the store holds the seat, the pixel override has done its job. This
      // is also what brings the capsule home when the seat is cleared.
      React.useEffect(() => {
        setLive(null)
      }, [seatKey])

      // Measuring in a layout effect keeps the capsule from painting centred and
      // then jumping to a seat the reader chose earlier.
      const useLayout = typeof React.useLayoutEffect === 'function' ? React.useLayoutEffect : React.useEffect
      useLayout(() => {
        if (!ready || typeof window === 'undefined') return undefined
        /**
         * Record the window and the capsule's own box.
         * @returns {void}
         */
        const measure = () => {
          setBounds({ width: window.innerWidth, height: window.innerHeight })
          if (gripRef.current === null) return
          const own = gripRef.current.getBoundingClientRect()
          // A capsule that has not been laid out reports zeroes; keeping the last
          // real box beats clamping against nothing.
          if (own.width > 0 && own.height > 0) setSize({ width: own.width, height: own.height })
        }
        measure()
        window.addEventListener('resize', measure)
        let observer = null
        if (typeof ResizeObserver !== 'undefined' && gripRef.current !== null) {
          observer = new ResizeObserver(measure)
          observer.observe(gripRef.current)
        }
        return () => {
          window.removeEventListener('resize', measure)
          if (observer !== null) observer.disconnect()
        }
      }, [ready])

      React.useEffect(() => () => {
        if (typeof window === 'undefined') return
        if (saveTimer.current !== 0) window.clearTimeout(saveTimer.current)
      }, [])

      // An unreadable journal still leaves the day unrecorded as far as the
      // reminder is concerned; the page owns explaining the failure.
      const entries = snapshot === null || snapshot.status === 'error' ? [] : snapshot.entries
      const today = todayKey()
      let at = -1
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        if (entries[index].date === today) {
          at = index
          break
        }
      }
      const reading = at < 0 ? null : entries[at]
      const previous = at <= 0 ? null : entries[at - 1]

      // Until the first read lands there is nothing true to say, and "nothing
      // yet today" would be a claim. The capsule holds its breath for those
      // frames — the read is local, so it is a few milliseconds.
      if (snapshot === null || snapshot.status === 'loading') return null

      const block = Math.floor(beat / REMINDER_KINDS.length)
      const kind = REMINDER_KINDS[beat % REMINDER_KINDS.length]
      const voice = REMINDER_VOICES[block % REMINDER_VOICES.length]
      const text = reminderLine(voice, kind, block, reading, previous)

      // Where the capsule sits. `live` is the pixel centre while the pointer
      // holds it, so the drag follows without a write per frame.
      const settled = stored !== null && bounds !== null && size !== null
        ? settleSeatPoint({ x: stored.x * bounds.width, y: stored.y * bounds.height }, bounds, size)
        : null
      const point = live !== null ? live : settled

      /**
       * The centre the capsule occupies right now, defaulted to the built-in seat.
       * @returns {{ x: number, y: number } | null} the centre, or null before measuring.
       */
      const currentPoint = () => {
        if (point !== null) return point
        if (bounds === null || size === null) return null
        // Before the first drag the capsule still sits where the stylesheet put
        // it; ask the DOM rather than assume, so the grab starts without a jump.
        if (gripRef.current !== null) {
          const own = gripRef.current.getBoundingClientRect()
          if (own.width > 0 && own.height > 0) return { x: own.left + own.width / 2, y: own.top + own.height / 2 }
        }
        return { x: bounds.width / 2, y: 10 + size.height / 2 }
      }

      /**
       * Write the seat back as fractions of the window.
       * @param {{ x: number, y: number }} next - the centre in pixels.
       * @returns {void}
       */
      const persist = (next) => {
        if (bounds === null || bounds.width <= 0 || bounds.height <= 0) return
        if (actions === null || typeof actions.saveSettings !== 'function') return
        const round = value => Math.round(value * 1000) / 1000
        actions.saveSettings({ reminder: { x: round(next.x / bounds.width), y: round(next.y / bounds.height) } })
      }

      /**
       * Start a drag, remembering where the pointer and the capsule began.
       * @param {PointerEvent} event - the press.
       * @returns {void}
       */
      const grab = (event) => {
        if (event.button !== undefined && event.button !== 0) return
        const from = currentPoint()
        if (from === null) return
        if (saveTimer.current !== 0) {
          window.clearTimeout(saveTimer.current)
          saveTimer.current = 0
        }
        const grip = event.currentTarget
        if (typeof grip.setPointerCapture === 'function' && typeof event.pointerId === 'number') {
          try {
            grip.setPointerCapture(event.pointerId)
          } catch {
            // The pointer is already gone; the click will simply open the page.
          }
        }
        movedRef.current = false
        dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, from }
      }

      /**
       * Follow the pointer once it has travelled past the click threshold.
       * @param {PointerEvent} event - the move.
       * @returns {void}
       */
      const carry = (event) => {
        const state = dragRef.current
        if (state === null) return
        if (typeof state.id === 'number' && typeof event.pointerId === 'number' && state.id !== event.pointerId) return
        const dx = event.clientX - state.x
        const dy = event.clientY - state.y
        if (!movedRef.current && Math.hypot(dx, dy) < 3) return
        if (!movedRef.current) {
          movedRef.current = true
          setDragging(true)
        }
        const wanted = { x: state.from.x + dx, y: state.from.y + dy }
        setLive(bounds === null || size === null ? wanted : settleSeatPoint(wanted, bounds, size))
      }

      /**
       * Finish a drag: keep the seat, and swallow the click that follows it.
       * @param {PointerEvent} event - the release.
       * @returns {void}
       */
      const release = (event) => {
        const state = dragRef.current
        if (state === null) return
        dragRef.current = null
        setDragging(false)
        const grip = event.currentTarget
        if (typeof grip.releasePointerCapture === 'function' && typeof state.id === 'number') {
          try {
            grip.releasePointerCapture(state.id)
          } catch {
            // Already released by the browser.
          }
        }
        if (!movedRef.current) return
        const wanted = { x: state.from.x + (event.clientX - state.x), y: state.from.y + (event.clientY - state.y) }
        const next = bounds === null || size === null ? wanted : settleSeatPoint(wanted, bounds, size)
        window.setTimeout(() => {
          movedRef.current = false
        }, 0)
        persist(next)
      }

      /**
       * Abandon a drag the browser cancelled.
       * @returns {void}
       */
      const cancel = () => {
        dragRef.current = null
        setDragging(false)
        setLive(null)
      }

      /**
       * Move the capsule with the arrow keys, saving once the keys go quiet.
       * @param {KeyboardEvent} event - the key press.
       * @returns {void}
       */
      const nudge = (event) => {
        const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
        const step = steps[event.key]
        if (step === undefined) return
        const from = currentPoint()
        if (from === null) return
        event.preventDefault()
        const distance = event.shiftKey ? 24 : 8
        const wanted = { x: from.x + step[0] * distance, y: from.y + step[1] * distance }
        const next = bounds === null || size === null ? wanted : settleSeatPoint(wanted, bounds, size)
        setLive(next)
        if (saveTimer.current !== 0) window.clearTimeout(saveTimer.current)
        saveTimer.current = window.setTimeout(() => {
          saveTimer.current = 0
          persist(next)
        }, 500)
      }

      const layerStyle = point === null
        ? undefined
        : { left: `${point.x}px`, top: `${point.y}px`, transform: 'translate(-50%, -50%)' }
      const className = `wj-reminder${reading === null ? '' : ' is-recorded'}${dragging ? ' is-dragging' : ''}`

      return h('div', { className: 'wj-reminderLayer', style: layerStyle },
        h('button', {
          type: 'button',
          ref: gripRef,
          className,
          lang: voice.tag,
          title: `${text} · ${voice.open} · ${voice.drag}`,
          'aria-label': `${text}. ${voice.open}`,
          onClick: () => {
            if (movedRef.current) return
            if (typeof props.open === 'function') props.open()
          },
          onPointerDown: grab,
          onPointerMove: carry,
          onPointerUp: release,
          onPointerCancel: cancel,
          onKeyDown: nudge,
        },
        h('span', { className: 'wj-reminderGlyph', 'aria-hidden': 'true' }, h(TrendMark, { recorded: reading !== null })),
        h('span', { className: 'wj-reminderText' },
          h('span', {
            key: `${voice.lang}:${kind}:${text}`,
            className: 'wj-reminderLine',
          }, text)),
        h('span', { className: 'wj-reminderGo', 'aria-hidden': 'true' },
          h('svg', { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', style: { display: 'block' } },
            h('path', {
              d: 'M4.5 2.5 8 6l-3.5 3.5',
              stroke: 'currentColor',
              strokeWidth: 1.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            })))))
    }

    /* ------------------------------------------------------------------ page */

    /**
     * The journal page: today's state and the composer, the trend chart, then
     * weekly movement beside the recent entries.
     * @param {object} props - slot runtime props plus the injected journal face.
     * @returns {import('react').ReactElement} the page.
     */
    function WeightJournalPage(props) {
      const t = translator(props.t)
      const tag = localeTag(props.locale)
      // One formatter set per locale, so the chart's geometry memo does not
      // re-run on every hover render.
      const fmt = React.useMemo(() => calendarFormatters(tag), [tag])
      const useJournal = typeof props.useJournal === 'function'
        ? props.useJournal
        : () => ({ status: 'loading', entries: [], settings: { heightCm: null, goalWeight: null, reminder: null }, error: null })
      const snapshot = useJournal(value => value)
      const actions = props.actions
      const entries = snapshot.entries
      const settings = snapshot.settings

      const [range, setRange] = React.useState('30')
      const [draftDate, setDraftDate] = React.useState(todayKey)
      const [draftWeight, setDraftWeight] = React.useState('')
      const [draftNote, setDraftNote] = React.useState('')
      const [feedback, setFeedback] = React.useState(null)
      const [settingsOpen, setSettingsOpen] = React.useState(false)
      const [settingsSaving, setSettingsSaving] = React.useState(false)
      const [settingsFeedback, setSettingsFeedback] = React.useState(null)
      const [confirmDate, setConfirmDate] = React.useState(null)
      const [listError, setListError] = React.useState(null)
      const [saving, setSaving] = React.useState(false)
      const weightRef = React.useRef(null)

      React.useEffect(() => {
        if (actions && typeof actions.reload === 'function') actions.reload()
      }, [actions])

      const today = todayKey()
      const latest = entries.length === 0 ? null : entries[entries.length - 1]
      const first = entries.length === 0 ? null : entries[0]

      React.useEffect(() => {
        if (draftWeight !== '' || latest === null) return
        setDraftWeight(kg(latest.weight))
      }, [latest === null ? '' : latest.date])

      const recent = React.useMemo(() => [...entries].reverse().slice(0, 12), [entries])

      const stats = React.useMemo(() => {
        if (entries.length === 0) {
          return { avg7: null, change30: null, min: null, streak: 0 }
        }
        const weekAgo = keyToMs(today) - 6 * DAY_MS
        const monthAgo = keyToMs(today) - 30 * DAY_MS
        const lastWeek = entries.filter(entry => keyToMs(entry.date) >= weekAgo).map(entry => entry.weight)
        // No reading at or before today−30d means there is no 30-day change to
        // claim; falling back to the first entry would relabel a longer span.
        const before = [...entries].reverse().find(entry => keyToMs(entry.date) <= monthAgo)
        const weights = entries.map(entry => entry.weight)
        const present = new Set(entries.map(entry => entry.date))
        let streak = 0
        // The run reaches back from today; a day not yet recorded today leaves
        // yesterday's run intact instead of reading as a broken streak.
        const cursor = keyToDate(today)
        if (!present.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
        while (present.has(dateKey(cursor))) {
          streak += 1
          cursor.setDate(cursor.getDate() - 1)
        }
        return {
          avg7: mean(lastWeek),
          change30: latest === null || before === undefined ? null : latest.weight - before.weight,
          min: Math.min(...weights),
          streak,
        }
      }, [entries, latest, today])

      const goal = settings.goalWeight
      const goalProgress = (() => {
        if (goal === null || goal === undefined || latest === null || first === null) return null
        if (Math.abs(first.weight - goal) < 0.05) return null
        const share = (first.weight - latest.weight) / (first.weight - goal)
        return { share: Math.max(0, Math.min(1, share)), remaining: Math.abs(latest.weight - goal) }
      })()

      const bmi = settings.heightCm !== null && settings.heightCm !== undefined && latest !== null
        ? latest.weight / ((settings.heightCm / 100) ** 2)
        : null

      /**
       * Drop a stale save confirmation when the draft changes again.
       * @returns {void}
       */
      const clearFeedback = () => {
        if (feedback !== null) setFeedback(null)
      }

      const existing = entries.find(entry => entry.date === draftDate) ?? null
      const delta = latest === null || entries.length < 2 ? null : latest.weight - entries[entries.length - 2].weight

      /**
       * Save the composer's draft through the Host.
       * @returns {Promise<void>} resolution after the outcome is shown.
       */
      const submit = async () => {
        const value = Number(draftWeight)
        if (!Number.isFinite(value) || value < 20 || value > 400) {
          setFeedback({ ok: false, text: t('composer.invalid') })
          return
        }
        setSaving(true)
        const outcome = await actions.save({
          date: draftDate,
          weight: Math.round(value * 10) / 10,
          note: draftNote,
        })
        setSaving(false)
        if (outcome.ok) {
          setDraftNote('')
          setFeedback({ ok: true, text: t('composer.saved', { date: fmt.full(draftDate) }) })
        } else {
          setFeedback({ ok: false, text: t('composer.failed', { message: outcome.message }) })
        }
      }

      /**
       * Delete one day after the row's inline confirmation.
       * @param {string} date - the day to remove.
       * @returns {Promise<void>} resolution after the outcome.
       */
      const remove = async (date) => {
        const outcome = await actions.remove(date)
        setConfirmDate(null)
        // The row is where the removal happened, so the failure is reported there.
        setListError(outcome.ok ? null : outcome.message)
      }

      /**
       * Load a row into the composer for editing.
       * @param {{ date: string, weight: number, note: string }} entry - the row.
       * @returns {void}
       */
      const select = (entry) => {
        setDraftDate(entry.date)
        setDraftWeight(kg(entry.weight))
        setDraftNote(entry.note)
        setFeedback(null)
        if (weightRef.current !== null) weightRef.current.focus()
      }

      /**
       * Nudge the draft weight by one tenth.
       * @param {number} step - signed tenths.
       * @returns {void}
       */
      const nudge = (step) => {
        const current = Number(draftWeight)
        const base = Number.isFinite(current) && draftWeight.trim() !== ''
          ? current
          : latest === null ? 70 : latest.weight
        setDraftWeight((Math.round((base + step) * 10) / 10).toFixed(1))
        clearFeedback()
      }

      const saveSettings = async (patch) => {
        setSettingsSaving(true)
        const outcome = await actions.saveSettings(patch)
        setSettingsSaving(false)
        if (outcome.ok) {
          setSettingsOpen(false)
          setSettingsFeedback(null)
        } else {
          setSettingsFeedback({ ok: false, text: t('settings.failed', { message: outcome.message }) })
        }
      }

      // Clearing the seat stands on its own: the fields typed in the dialog are
      // left alone, so a reader can move the capsule without losing an edit.
      const resetSeat = async () => {
        setSettingsSaving(true)
        const outcome = await actions.saveSettings({ reminder: null })
        setSettingsSaving(false)
        setSettingsFeedback(outcome.ok
          ? { ok: true, text: t('settings.seatDone') }
          : { ok: false, text: t('settings.failed', { message: outcome.message }) })
      }

      const hero = h('section', { className: 'wj-card wj-hero' },
        h('div', null,
          h('div', { className: 'wj-kicker' }, t('hero.kicker')),
          h('div', { className: 'wj-valueRow' },
            latest === null
              ? h('span', { className: 'wj-value wj-value--muted' }, t('hero.noData'))
              : h('span', { className: 'wj-value' }, kg(latest.weight)),
            latest === null ? null : h('span', { className: 'wj-unit' }, 'kg'),
            delta === null
              ? null
              : h('span', { className: `wj-chip wj-chip--${direction(delta)}` },
                direction(delta) === 'down' ? '↓' : direction(delta) === 'up' ? '↑' : '·',
                ' ',
                signedKg(delta),
                ' kg')),
          h('div', { className: 'wj-meta' },
            latest === null
              ? t('head.subtitle')
              : [
                latest.date === today ? t('hero.updatedToday') : t('hero.updatedOn', { date: fmt.full(latest.date) }),
                bmi === null ? null : `BMI ${(Math.round(bmi * 10) / 10).toFixed(1)}`,
              ].filter(Boolean).join(' · ')),
          goalProgress === null
            ? null
            : h('div', { className: 'wj-progress', style: { marginTop: 14 } },
              h('div', { className: 'wj-goalRow' },
                h('span', null, t('hero.goal', { weight: kg(goal) })),
                h('span', null, goalProgress.remaining < 0.05
                  ? t('hero.reached')
                  : t('hero.remaining', { weight: kg(goalProgress.remaining) }))),
              h('div', {
                className: 'wj-track',
                role: 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': 100,
                'aria-valuenow': Math.round(goalProgress.share * 100),
                'aria-label': t('hero.progress', { percent: Math.round(goalProgress.share * 100) }),
              }, h('div', { className: 'wj-trackFill', style: { width: `${Math.round(goalProgress.share * 100)}%` } })),
              h('div', { className: 'wj-goalRow', style: { fontSize: 12 } },
                h('span', null, t('hero.start', { weight: kg(first.weight) })),
                h('span', null, t('hero.progress', { percent: Math.round(goalProgress.share * 100) }))))),
        h('div', { className: 'wj-kpis' },
          h('div', { className: 'wj-kpi' },
            h('div', { className: 'wj-kpiLabel' }, t('kpi.avg7')),
            h('div', { className: 'wj-kpiValue' }, stats.avg7 === null ? '—' : `${kg(stats.avg7)} kg`)),
          h('div', { className: 'wj-kpi' },
            h('div', { className: 'wj-kpiLabel' }, t('kpi.change30')),
            h('div', {
              className: 'wj-kpiValue',
              style: stats.change30 === null
                ? undefined
                : { color: direction(stats.change30) === 'down'
                  ? 'var(--dsw-alias-state-success-primary)'
                  : direction(stats.change30) === 'up'
                    ? 'var(--dsw-alias-state-warn-primary)'
                    : undefined },
            }, stats.change30 === null ? '—' : `${signedKg(stats.change30)} kg`)),
          h('div', { className: 'wj-kpi' },
            h('div', { className: 'wj-kpiLabel' }, t('kpi.min')),
            h('div', { className: 'wj-kpiValue' }, stats.min === null ? '—' : `${kg(stats.min)} kg`)),
          h('div', { className: 'wj-kpi' },
            h('div', { className: 'wj-kpiLabel' }, t('kpi.streak')),
            h('div', { className: 'wj-kpiValue' }, String(stats.streak), h('small', null, ` ${t('kpi.unit')}`)))))

      const composer = h('section', { className: 'wj-card wj-composer' },
        h('h2', { className: 'wj-cardTitle' }, t('composer.title')),
        h('div', { className: 'wj-field' },
          h('span', { className: 'wj-label' }, t('composer.weight')),
          h('div', { className: 'wj-weightRow' },
            h('button', {
              type: 'button',
              className: 'wj-step',
              'aria-label': '−0.1',
              onClick: () => nudge(-0.1),
            }, '−'),
            h('span', { className: 'wj-weightField' },
              h('input', {
                className: 'wj-weightInput',
                type: 'number',
                inputMode: 'decimal',
                step: 0.1,
                min: 20,
                max: 400,
                value: draftWeight,
                ref: weightRef,
                onChange: (event) => {
                  setDraftWeight(event.target.value)
                  clearFeedback()
                },
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submit()
                  }
                },
              }),
              h('span', { className: 'wj-weightUnit' }, 'kg')),
            h('button', {
              type: 'button',
              className: 'wj-step',
              'aria-label': '+0.1',
              onClick: () => nudge(0.1),
            }, '+'))),
        h('label', { className: 'wj-field' },
          h('span', { className: 'wj-label' }, t('composer.date')),
          h('span', { className: 'wj-dateRow' },
            h('input', {
              className: 'wj-input',
              type: 'date',
              value: draftDate,
              onChange: (event) => {
                setDraftDate(event.target.value === '' ? today : event.target.value)
                setFeedback(null)
              },
            }),
            draftDate === today
              ? null
              : h('button', {
                type: 'button',
                className: 'wj-miniBtn',
                onClick: () => {
                  setDraftDate(today)
                  clearFeedback()
                },
              }, t('composer.today')))),
        h('label', { className: 'wj-field' },
          h('span', { className: 'wj-label' }, t('composer.note')),
          h('input', {
            className: 'wj-input',
            type: 'text',
            maxLength: 280,
            value: draftNote,
            placeholder: t('composer.notePlaceholder'),
            onChange: (event) => {
              setDraftNote(event.target.value)
              clearFeedback()
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            },
          })),
        existing === null ? null : h('p', { className: 'wj-hint', style: { margin: 0 } }, t('composer.overwrite')),
        h('button', {
          type: 'button',
          className: 'wj-btn wj-btn--primary wj-btn--wide',
          disabled: saving,
          onClick: submit,
        }, saving ? '…' : existing === null ? t('composer.save') : t('composer.update')),
        h('p', {
          className: `wj-feedback${feedback === null ? '' : feedback.ok ? ' wj-feedback--ok' : ' wj-feedback--error'}`,
          role: 'status',
          'aria-live': 'polite',
          style: { margin: 0 },
        }, feedback === null ? '' : feedback.text))

      const recentCard = h('section', { className: 'wj-card' },
        h('div', { className: 'wj-listHead' },
          h('h2', { className: 'wj-cardTitle' }, t('recent.title')),
          listError === null
            ? h('span', { className: 'wj-hint' }, entries.length === 0 ? '' : `${entries.length}`)
            : h('span', { className: 'wj-feedback wj-feedback--error', role: 'status' }, listError)),
        recent.length === 0
          ? h('div', { className: 'wj-empty', style: { padding: '32px 8px' } }, t('recent.empty'))
          : h('div', { className: 'wj-rows' },
            recent.map((entry) => {
              const index = entries.findIndex(row => row.date === entry.date)
              return h(EntryRow, {
                key: entry.date,
                entry,
                delta: index > 0 ? entry.weight - entries[index - 1].weight : null,
                confirming: confirmDate === entry.date,
                t,
                fmt,
                onSelect: select,
                onAskDelete: setConfirmDate,
                onCancelDelete: () => setConfirmDate(null),
                onDelete: remove,
              })
            })))

      const weeks = React.useMemo(() => weeklyMovement(entries, 8), [entries])

      return h('div', { className: 'wj-page' },
        h('div', { className: 'wj-scroll' },
          h('div', { className: 'wj-content' },
            h('header', { className: 'wj-head' },
              h('div', { className: 'wj-headText' },
                typeof props.back === 'function'
                  ? h('button', {
                    type: 'button',
                    className: 'wj-crumb',
                    onClick: props.back,
                  }, h(ChevronLeftIcon, { size: 14 }), t('head.back'))
                  : null,
                h('h1', { className: 'wj-title' }, t('panel')),
                h('p', { className: 'wj-subtitle' }, t('head.subtitle'))),
              h('div', { className: 'wj-actions' },
                h('button', {
                  type: 'button',
                  className: 'wj-btn wj-btn--quiet',
                  onClick: () => {
                    setSettingsFeedback(null)
                    setSettingsOpen(true)
                  },
                }, h(GearIcon, null), t('head.settings')))),

            snapshot.status === 'error'
              ? h('section', { className: 'wj-card', style: { marginTop: 16 } },
                h('div', { className: 'wj-errorRow' },
                  h('div', null,
                    h('div', { className: 'wj-cardTitle' }, t('error.title')),
                    h('div', { className: 'wj-hint' }, snapshot.error ?? '')),
                  h('button', {
                    type: 'button',
                    className: 'wj-btn wj-btn--quiet',
                    onClick: () => actions.reload(),
                  }, t('error.retry'))))
              : null,

            h('div', {
              className: entries.length === 0 ? 'wj-row wj-row--hero wj-row--heroEmpty' : 'wj-row wj-row--hero',
            }, hero, composer),
            entries.length === 0
              ? h(StartHere, {
                t,
                onStart: () => {
                  if (weightRef.current !== null) weightRef.current.focus()
                },
              })
              : [
                h(TrendChart, {
                  key: 'chart',
                  entries,
                  range,
                  settings,
                  t,
                  fmt,
                  revision: entries.length,
                  onRange: setRange,
                }),
                h('div', { key: 'lower', className: 'wj-row wj-row--lower' },
                  h(WeeklyBars, { weeks, t, fmt }),
                  recentCard),
              ])),

        settingsOpen
          ? h(SettingsDialog, {
            settings,
            t,
            saving: settingsSaving,
            feedback: settingsFeedback,
            onClose: () => {
              setSettingsOpen(false)
              setSettingsFeedback(null)
            },
            onSubmit: saveSettings,
            onResetSeat: resetSeat,
          })
          : null)
    }

    /* ----------------------------------------------------------------- setup */

    /** Style element id, so a rebuilt module replaces its own sheet. */
    const STYLE_ID = 'dsh-weight-journal-style'

    /**
     * Register the browser half.
     * @param {object} ctx - the browser plugin context.
     * @returns {void}
     */
    function apply(ctx) {
      const locale = ctx.get('locale')

      ctx.effect(() => {
        if (locale === undefined || typeof locale.register !== 'function') return undefined
        const dispose = locale.register(NS, {
          zh: ZH,
          en: EN,
          ja: EN,
          es: EN,
          fr: EN,
          de: EN,
          ru: EN,
          pt: EN,
        })
        return () => {
          if (typeof dispose === 'function') dispose()
        }
      }, 'weight-journal: dictionaries')

      /**
       * Localized panel label, re-read on every projection.
       * @returns {string} the sidebar label.
       */
      const panelLabel = () => {
        let translate = null
        try {
          translate = locale === undefined || typeof locale.bind !== 'function' ? null : locale.bind(NS)
        } catch {
          translate = null
        }
        return translator(translate)('panel')
      }

      /**
       * Swap the central panel without touching the current Session.
       * @param {string | null} panelId - Registered main key, or null for the Conversation.
       * @returns {void}
       */
      function showPanel(panelId) {
        let layout = null
        try {
          layout = ctx.get('layout')
        } catch {
          layout = null
        }
        if (layout === null || layout === undefined || typeof layout.selectPanel !== 'function') return
        try {
          layout.selectPanel(panelId)
        } catch {
          // The panel key is not registered in this build; nothing to switch to.
        }
      }

      /**
       * Open the journal page, wherever the reader clicks the reminder.
       * @returns {void}
       */
      function openJournal() {
        showPanel(PANEL_ID)
      }

      /**
       * Return to the Conversation from the journal page's own header.
       * @returns {void}
       */
      function backToConversation() {
        showPanel(null)
      }

      ctx.effect(() => {
        const source = createSource()
        const bound = {
          hooks: { journal: { getSnapshot: source.getSnapshot, subscribe: source.subscribe } },
          actions: createActions(source),
          locale,
          open: openJournal,
          back: backToConversation,
        }

        const disposers = [
          ctx.slots.inject('main', () => ctx.slots.register({
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => bound,
          }, WeightJournalPage)),
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 40,
            locale: NS,
            label: panelLabel,
          }, PanelIcon)),
          // The overlay seat projects hooks rather than a translator, so the
          // capsule carries its own copy in the language of the current beat.
          ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: REMINDER_ID,
            order: 50,
            inject: () => bound,
          }, WeightReminder)),
        ]

        return () => {
          for (const dispose of disposers) {
            try {
              dispose()
            } catch {
              // A collapsed owner has already removed its own contribution.
            }
          }
        }
      }, 'weight-journal: page')

      ctx.effect(() => {
        if (typeof document === 'undefined') return undefined
        const previous = document.getElementById(STYLE_ID)
        if (previous !== null) previous.remove()
        const style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = CSS
        document.head.appendChild(style)
        return () => {
          const current = document.getElementById(STYLE_ID)
          if (current !== null) current.remove()
        }
      }, 'weight-journal: styles')
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    }
  },
})
