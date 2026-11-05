// A small JSON editor: a textarea for typing, over a layer that colors the visible lines.
// No dependencies. The parser reports where things are, so checks can point at a line.

// ---------------------------------------------------------------------------
// Parsing, with locations
// ---------------------------------------------------------------------------

const ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }

/**
 * Parses JSON text. Returns { value, locate } where locate(path) gives the { line, column, offset }
 * of the object or array at that path, or { error: { code, params, line, column, offset } }.
 */
export function parseJSON(text) {
  const n = text.length, offsets = new Map(), path = [] // the path to the value being read
  const key = p => p.join('\u0000')
  let i = 0
  const fail = (code, params = {}, at = i) => { throw { code, params, offset: at } }
  const quote = c => `“${c}”`
  const space = () => { while (i < n && (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t')) i++ }

  function value() {
    space()
    if (i >= n) fail('unexpected-end')
    const c = text[i]
    if (c === '{' || c === '[') offsets.set(key(path), i)
    if (c === '{') return object()
    if (c === '[') return array()
    if (c === '"') return string()
    if (c === '-' || (c >= '0' && c <= '9')) return number()
    for (const [word, v] of [['true', true], ['false', false], ['null', null]]) if (text.startsWith(word, i)) { i += word.length; return v }
    fail('unexpected-token', { token: quote(c) })
  }
  function object() {
    const out = {}
    i++; space()
    if (text[i] === '}') { i++; return out }
    for (;;) {
      space()
      if (text[i] !== '"') fail(i >= n ? 'unexpected-end' : text[i] === '}' ? 'trailing-comma' : 'expected-key')
      const name = string()
      space()
      if (text[i] !== ':') fail(i >= n ? 'unexpected-end' : 'expected-colon')
      i++
      path.push(name)
      out[name] = value()
      path.pop()
      space()
      if (text[i] === ',') { i++; continue }
      if (text[i] === '}') { i++; return out }
      fail(i >= n ? 'unexpected-end' : 'expected-comma', { close: quote('}') })
    }
  }
  function array() {
    const out = []
    i++; space()
    if (text[i] === ']') { i++; return out }
    for (;;) {
      space()
      if (text[i] === ']') fail('trailing-comma')
      path.push(out.length)
      out.push(value())
      path.pop()
      space()
      if (text[i] === ',') { i++; continue }
      if (text[i] === ']') { i++; return out }
      fail(i >= n ? 'unexpected-end' : 'expected-comma', { close: quote(']') })
    }
  }
  function string() {
    const start = i++
    let out = ''
    for (;;) {
      if (i >= n || text[i] === '\n') fail('unterminated-string', {}, start)
      const c = text[i++]
      if (c === '"') return out
      if (c < ' ') fail('control-character', {}, i - 1)
      if (c !== '\\') { out += c; continue }
      const e = text[i++]
      if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(i, i + 4))) { out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16)); i += 4 }
      else if (e in ESCAPES) out += ESCAPES[e]
      else fail('bad-escape', {}, i - 2)
    }
  }
  function number() {
    const m = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
    m.lastIndex = i
    const found = m.exec(text)
    if (!found || /[\w.]/.test(text[m.lastIndex] ?? '')) fail('bad-number')
    i = m.lastIndex
    return Number(found[0])
  }

  const where = offset => {
    let line = 1, start = 0
    for (let k = text.indexOf('\n'); k !== -1 && k < offset; k = text.indexOf('\n', k + 1)) { line++; start = k + 1 }
    return { line, column: offset - start + 1, offset }
  }
  try {
    const result = value()
    space()
    if (i < n) fail('extra-content')
    return { value: result, locate: target => { for (let p = [...target]; ; p.pop()) { const at = offsets.get(key(p)); if (at != null) return where(at); if (!p.length) return where(0) } } }
  } catch (error) {
    if (!error || !('code' in error)) throw error
    return { error: { code: error.code, params: error.params, ...where(Math.min(error.offset, n)) } }
  }
}

// ---------------------------------------------------------------------------
// Coloring
// ---------------------------------------------------------------------------

const TOKEN = /("(?:[^"\\]|\\.)*"?)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:]+)|(\s+)|([^\s]+?)/g
const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlight(line) {
  let html = ''
  for (const [, str, colon, num, literal, punct, space, other] of line.matchAll(TOKEN)) {
    if (str != null) html += `<span class="${colon ? 'key' : 'str'}">${escape(str)}</span>` + (colon ? `<span class="pun">${escape(colon)}</span>` : '')
    else if (num != null) html += `<span class="num">${num}</span>`
    else if (literal != null) html += `<span class="lit">${literal}</span>`
    else if (punct != null) html += `<span class="pun">${escape(punct)}</span>`
    else if (space != null) html += space
    else html += `<span class="odd">${escape(other)}</span>`
  }
  return html
}

// ---------------------------------------------------------------------------
// Editing
// ---------------------------------------------------------------------------

export class Editor {
  /** @param {HTMLElement} root  @param {{ label: string, onChange: (text: string) => void }} options */
  constructor(root, { label, onChange }) {
    this.onChange = onChange
    this.lines = ['']
    this.marks = new Map() // line -> severity
    root.classList.add('editor')
    root.innerHTML = '<div class="gutter" aria-hidden="true"><div class="gutter-lines"></div></div>' +
      '<div class="code"><div class="code-lines" aria-hidden="true"></div>' +
      '<textarea spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" wrap="off"></textarea></div>'
    this.gutter = root.querySelector('.gutter-lines')
    this.layer = root.querySelector('.code-lines')
    this.textarea = root.querySelector('textarea')
    this.textarea.setAttribute('aria-label', label)

    let timer = null, frame = null, releaseTab = false
    const changed = () => {
      this.lines = this.textarea.value.split('\n')
      this.paint()
      clearTimeout(timer)
      timer = setTimeout(() => this.onChange(this.textarea.value), 250)
    }
    const insert = s => {
      this.textarea.focus()
      if (!document.execCommand?.('insertText', false, s)) {
        const { selectionStart: a, selectionEnd: b } = this.textarea
        this.textarea.setRangeText(s, a, b, 'end')
        changed()
      }
    }
    // Tab: two spaces at the caret, or one step deeper for every line a selection touches.
    // Shift+Tab: one step shallower for those lines. Both stay on the undo stack.
    const indent = direction => {
      const t = this.textarea, { value, selectionStart: a, selectionEnd: b } = t
      const lines = value.slice(a, b).includes('\n')
      if (direction > 0 && !lines) { insert('  '); return }
      const start = value.lastIndexOf('\n', a - 1) + 1
      const stop = value.indexOf('\n', b > a && value[b - 1] === '\n' ? b - 1 : b)
      const end = stop === -1 ? value.length : stop
      const before = value.slice(start, end).split('\n')
      const after = before.map(line => direction > 0 ? `  ${line}` : line.replace(/^ {1,2}/, ''))
      const text = after.join('\n')
      if (text === value.slice(start, end)) return
      t.setSelectionRange(start, end)
      insert(text)
      const first = after[0].length - before[0].length
      t.setSelectionRange(Math.max(start, a + first), Math.max(start, b + text.length - (end - start)))
    }
    this.textarea.addEventListener('input', changed)
    this.textarea.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => { frame = null; this.paint() }) })
    this.textarea.addEventListener('focus', () => { releaseTab = false })
    this.textarea.addEventListener('keydown', e => {
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Escape') { releaseTab = true; return }
      if (e.key === 'Tab' && !releaseTab) { e.preventDefault(); indent(e.shiftKey ? -1 : 1) }
      else if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
        // keep the indentation, one step deeper after an opening bracket
        const { value, selectionStart } = this.textarea
        const line = value.slice(value.lastIndexOf('\n', selectionStart - 1) + 1, selectionStart)
        const indent = line.match(/^\s*/)[0] + (/[[{]\s*$/.test(line) ? '  ' : '')
        e.preventDefault()
        insert('\n' + indent)
      }
      if (e.key !== 'Escape') releaseTab = false
    })
    new ResizeObserver(() => this.paint()).observe(root)
  }

  get text() { return this.textarea.value }
  set text(value) {
    this.textarea.value = value
    this.textarea.scrollTop = this.textarea.scrollLeft = 0
    this.lines = value.split('\n')
    this.paint()
  }

  /** Marks lines with problems: [{ line, severity }] */
  mark(marks) {
    this.marks = new Map()
    for (const { line, severity } of marks) if (this.marks.get(line) !== 'error') this.marks.set(line, severity)
    this.paint()
  }

  /** Puts the caret at an offset and scrolls it into view */
  reveal(offset) {
    const t = this.textarea
    t.focus()
    t.setSelectionRange(offset, offset)
    const line = t.value.slice(0, offset).split('\n').length - 1, height = parseFloat(getComputedStyle(t).lineHeight)
    if (line * height < t.scrollTop || (line + 1) * height > t.scrollTop + t.clientHeight) t.scrollTop = Math.max(0, line * height - t.clientHeight / 3)
  }

  // Draws only the lines in view, so long files stay quick to type in
  paint() {
    const t = this.textarea, height = parseFloat(getComputedStyle(t).lineHeight) || 20
    const first = Math.max(0, Math.floor(t.scrollTop / height) - 4)
    const last = Math.min(this.lines.length, first + Math.ceil(t.clientHeight / height) + 8)
    const marked = k => this.marks.get(k + 1)
    let code = '', numbers = ''
    for (let k = first; k < last; k++) {
      const mark = marked(k) ? ` ${marked(k)}` : ''
      code += `<div class="line${mark}">${highlight(this.lines[k]) || ' '}</div>`
      numbers += `<div class="number${mark}">${k + 1}</div>`
    }
    this.layer.innerHTML = code
    this.layer.style.transform = `translate(${-t.scrollLeft}px, ${first * height - t.scrollTop}px)`
    this.gutter.innerHTML = numbers
    this.gutter.style.transform = `translateY(${first * height - t.scrollTop}px)`
    this.gutter.parentElement.style.setProperty('--digits', String(this.lines.length).length)
  }
}
