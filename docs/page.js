import { read, inspect, planes, Rotation, coordinateView, petrieView, draw, vertexAt, axisName } from './renderer.js'
import { Editor, parseJSON } from './editor.js'

// The samples, shelved by dimension; their names live in the locale files as sample.<id>
const CATALOG = [
  ['2d', ['two-hole-donut', 'moebius-strip-shadow']],
  ['3d', ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron', 'truncated-icosahedron', 'rhombic-dodecahedron', 'stella-octangula', 'menger-sponge', 'torus', 'chain', 'moebius-strip', 'klein-bottle']],
  ['4d', ['pentachoron', 'tesseract', '16-cell', '24-cell', '120-cell', '600-cell', 'hollow-tesseract', 'duoprism', 'clifford-torus', 'torus-4d', 'chain-4d', 'klein-bottle-4d']],
  ['5d', ['5-simplex', '5-orthoplex', 'penteract', 'hexeract']],
]
const SAMPLES = CATALOG.flatMap(([, ids]) => ids)
// Schläfli symbols, for the samples that have one
const SCHLAFLI = {
  tetrahedron: '{3,3}', cube: '{4,3}', octahedron: '{3,4}', dodecahedron: '{5,3}', icosahedron: '{3,5}', 'truncated-icosahedron': 't{3,5}',
  pentachoron: '{3,3,3}', tesseract: '{4,3,3}', '16-cell': '{3,3,4}', '24-cell': '{3,4,3}', '120-cell': '{5,3,3}', '600-cell': '{3,3,5}', duoprism: '{6}×{6}',
  '5-simplex': '{3,3,3,3}', '5-orthoplex': '{3,3,3,4}', penteract: '{4,3,3,3}', hexeract: '{4,3,3,3,3}',
}
// A sample keeps its English name in its file; this finds the sample from that name
const sampleNamed = name => SAMPLES.find(id => english[`sample.${id}`] === name)
const SPEED = 0.35 // radians per second
const $ = id => document.getElementById(id)
const element = (tag, props = {}, ...children) => { const e = Object.assign(document.createElement(tag), props); e.append(...children); return e }
const format = x => Math.abs(x) < 5e-7 ? '0' : String(+x.toFixed(3))

// ---- words ----

const language = document.documentElement.lang, plural = new Intl.PluralRules(language)
let words = {}, english = {}
const dictionaries = {}
function t(key, vars = {}) {
  let entry = words[key] ?? english[key] ?? key
  if (typeof entry === 'object') entry = entry[plural.select(vars.count ?? 0)] ?? entry.other
  return entry.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m)
}
const UNITS = ['unit.vertex', 'unit.edge', 'unit.face', 'unit.cell']
const unit = (dimension, count) => t(UNITS[dimension] ?? 'unit.nface', { count, n: dimension })

function translate() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n)
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel))
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle)
}

async function dictionary(code) {
  if (!dictionaries[code]) { const response = await fetch(`locales/${code}.json`); if (!response.ok) throw new Error(response.status); dictionaries[code] = await response.json() }
  return dictionaries[code]
}
async function loadWords() {
  try { english = await dictionary('en'); words = await dictionary(language) } catch { return }
  translate()
  renderExamples()
  renderWords()
}

// ---- state ----

const state = {
  model: null, rotation: null, views: [], active: new Set(),
  playing: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  normals: true, hoverVertex: null, hoverFacet: null, pinnedFacet: null,
  issues: [], sample: null,
}
let colors = {}
const pip = { shown: false, dismissed: false } // the small Petrie view
function readColors() {
  const style = getComputedStyle(document.documentElement), get = name => style.getPropertyValue(name).trim()
  colors = { ink: get('--ink'), faint: get('--faint'), accent: get('--accent'), normal: get('--normal') }
}

// ---- drawing ----

// Only the canvases on screen are drawn. With none in sight, nothing is drawn and the turning stops.
const onScreen = new Set()
const watcher = new IntersectionObserver(entries => {
  for (const e of entries) e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)
  redraw()
  wake()
}, { rootMargin: '64px' })

let pending = false
function paint() {
  pending = false
  const { model, rotation } = state
  if (!model) return
  const view = { highlightFacet: state.pinnedFacet ?? state.hoverFacet, hoverVertex: state.hoverVertex, normals: state.normals }
  for (const { canvas, view: v } of state.views) if (onScreen.has(canvas)) draw(canvas, model, rotation, v, view, colors)
  if (pip.shown && onScreen.has($('pip-canvas'))) draw($('pip-canvas'), model, rotation, state.views[0].view, view, colors)
}
// Asks for one paint on the next frame, however many times it is called before then
function redraw() { if (!pending) { pending = true; requestAnimationFrame(paint) } }

const turn = angle => { for (const key of state.active) { const [i, j] = key.split(',').map(Number); state.rotation.turn(i, j, angle) } }

// The object turns at most 30 times a second, which is plenty for a slow turn, and only while some view is on screen.
// One loop at a time: it ends itself when there is nothing to show, and wake() starts it again.
const FRAME = 1000 / 30
let looping = false, last = null
function loop(time) {
  if (!state.playing || !state.active.size || !onScreen.size || document.hidden) { looping = false; last = null; return }
  if (last == null || time - last >= FRAME - 1) {
    if (last != null) turn(Math.min(0.1, (time - last) / 1000) * SPEED)
    last = time
    paint()
  }
  requestAnimationFrame(loop)
}
function wake() { if (state.playing && state.active.size && onScreen.size && !document.hidden && !looping) { looping = true; requestAnimationFrame(loop) } }
function setPlaying(playing) {
  state.playing = playing
  renderPlay()
  wake()
}

// ---- pointing ----

let drag = null
function attach(canvas, currentView) {
  const at = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const hover = (x, y) => {
    if (!state.model) return
    const v = vertexAt(canvas, state.model, state.rotation, currentView(), x, y)
    if (v !== state.hoverVertex) { state.hoverVertex = v; describe(); redraw() }
  }
  canvas.addEventListener('pointerdown', e => {
    const [x, y] = at(e)
    drag = { id: e.pointerId, x }
    canvas.setPointerCapture(e.pointerId)
    hover(x, y)
  })
  canvas.addEventListener('pointermove', e => {
    const [x, y] = at(e)
    if (drag?.id === e.pointerId) { turn((x - drag.x) * 0.01); drag.x = x; redraw(); return }
    hover(x, y)
  })
  const end = e => { if (drag?.id === e.pointerId) drag = null }
  canvas.addEventListener('pointerup', end)
  canvas.addEventListener('pointercancel', end)
  canvas.addEventListener('pointerleave', () => { if (!drag && state.hoverVertex != null) { state.hoverVertex = null; describe(); redraw() } })
}

// ---- the words that depend on the model ----

function describe() {
  const { model } = state, out = $('readout')
  if (!model) return
  if (state.hoverVertex != null) {
    const k = state.hoverVertex, p = model.vertices[k]
    out.replaceChildren(element('strong', { textContent: t('readout.vertex', { index: k + 1 }) }), ` (${p.map(format).join(', ')})`,
      element('br'), p.map((x, i) => `${axisName(i)} ${format(x)}`).join(' · '))
    return
  }
  const k = state.pinnedFacet ?? state.hoverFacet, f = model.facets[k]
  if (f) {
    out.replaceChildren(element('strong', { textContent: t('facet.label', { name: unit(f.dimension, 1), index: k + 1 }) }),
      ' ', t('readout.facet', { vertices: f.vertices.length, edges: f.edges.length }),
      ...(f.normal ? [element('br'), t('readout.normal', { vector: f.normal.map(format).join(', ') })] : []))
    return
  }
  out.textContent = ''
}

function renderTitleBlock() {
  const { model } = state, n = model.dimension
  const known = sampleNamed(model.name)
  const name = known ? t(`sample.${known}`) : model.name ?? t('block.untitled')
  // a closed surface of genus g has Euler characteristic 2 - 2g, so in 3D the shells tell the genus
  const genus = n === 3 && model.euler != null ? t('block.genus', { genus: model.shells - model.euler / 2 }) : ''
  const rows = [
    ['block.object', name],
    ['block.type', model.types.join(', ')],
    ['block.dimension', n],
    ...(SCHLAFLI[known] ? [['block.schlafli', SCHLAFLI[known]]] : []),
    ['block.boundary', model.fVector.map((count, k) => t('block.item', { count, unit: unit(k, count) })).join(' · ')],
    ...(model.euler != null ? [['block.euler', model.euler], ['block.shells', `${model.shells}${genus}`]] : []),
  ]
  $('title-block').replaceChildren(...rows.flatMap(([term, value]) => [element('dt', { textContent: t(term) }), element('dd', { textContent: value })]))
}

function renderFacets() {
  const { model } = state, dims = new Set(model.facets.map(f => f.dimension))
  $('facets-heading').textContent = dims.size === 1 ? unit([...dims][0], 2) : t('facets.mixed')
  $('facets-section').hidden = !model.facets.length
  for (const button of $('facets').children) {
    const k = +button.dataset.index
    button.textContent = t('facet.label', { name: unit(model.facets[k].dimension, 1), index: k + 1 })
  }
}

function renderIssues() {
  const { issues } = state, summary = $('issues-summary')
  const errors = issues.filter(i => i.severity === 'error').length, warnings = issues.length - errors
  summary.className = errors ? 'bad' : issues.length ? '' : 'ok'
  if (issues.length) summary.textContent = [errors && t('issues.errors', { count: errors }), warnings && t('issues.warnings', { count: warnings })].filter(Boolean).join(t('issues.separator'))
  else summary.replaceChildren('✓', element('span', { className: 'visually-hidden', textContent: t('issues.none') }))
  $('issues').replaceChildren(...issues.map(issue => element('li', {},
    element('span', { className: `severity ${issue.severity}`, textContent: t(`issues.${issue.severity}`) }),
    element('button', { type: 'button', textContent: t('issues.location', issue), onclick: () => editor.reveal(issue.offset) }),
    element('span', { textContent: t(issue.code, issue.params) }))))
}

const label = (button, text) => { button.setAttribute('aria-label', text); button.title = text }
function renderPlay() {
  label($('play'), t(state.playing ? 'controls.pause' : 'controls.play'))
  $('play').classList.toggle('playing', state.playing)
}

function renderWords() {
  renderPlay()
  $('petrie').setAttribute('aria-label', t('petrie.title'))
  editor.textarea.setAttribute('aria-label', t('aria.source'))
  label($('copy'), t(copied ? 'install.copied' : 'install.copy'))
  $('copy').classList.toggle('copied', !!copied)
  for (const canvas of $('views').querySelectorAll('canvas')) {
    const [i, j] = canvas.dataset.axes.split(',').map(Number)
    canvas.setAttribute('aria-label', t('aria.view', { a: axisName(i), b: axisName(j) }))
  }
  if (state.model) { renderFacets(); renderTitleBlock(); describe() }
  renderIssues()
}

// ---- building the sheet for a model ----

function defaultPlanes(n) {
  if (n < 2) return []
  if (n === 2) return [[0, 1]]
  if (n === 3) return [[0, 2]]
  return [[0, n - 1], [1, 2]]
}

// The one exception to n axes: a flat drawing can also turn out of its plane and be seen from the side, through a third axis it does not have
const turningAxes = n => n === 2 ? 3 : n

function buildViews(n) {
  const axes = turningAxes(n)
  state.rotation = new Rotation(axes)
  // a solid starts a little turned, so no edge hides behind another; a map starts north up
  if (n >= 3) for (const [i, j] of planes(n)) state.rotation.turn(i, j, 0.25)
  state.active = new Set(defaultPlanes(n).map(p => p.join(',')))
  state.views = [{ canvas: $('petrie'), view: petrieView(n) }]

  // the coordinate views, as a triangle: the view of axes (i, j) sits in column i and row j
  const grid = $('views')
  for (const old of grid.querySelectorAll('canvas')) { watcher.unobserve(old); onScreen.delete(old) }
  grid.replaceChildren()
  grid.style.setProperty('--columns', Math.max(1, axes - 1))
  $('multiview').hidden = n < 2
  for (let j = 1; j < axes; j++) {
    grid.append(element('span', { className: 'axis', textContent: axisName(j), style: `grid-area: ${j} / 1` }))
    for (let i = 0; i < j; i++) {
      const canvas = element('canvas', { style: `grid-area: ${j} / ${i + 2}` })
      canvas.setAttribute('role', 'img')
      canvas.dataset.axes = `${i},${j}`
      grid.append(canvas)
      const view = coordinateView(i, j)
      attach(canvas, () => view)
      watcher.observe(canvas)
      state.views.push({ canvas, view })
    }
  }
  for (let i = 0; i < axes - 1; i++) grid.append(element('span', { className: 'axis', textContent: axisName(i), style: `grid-area: ${axes} / ${i + 2}` }))

  $('planes').replaceChildren(...planes(axes).map(([i, j]) => {
    const key = `${i},${j}`
    const button = element('button', { type: 'button', className: 'plane', id: `plane-${axisName(i)}${axisName(j)}`, textContent: `${axisName(i)}${axisName(j)}` })
    button.setAttribute('aria-pressed', state.active.has(key))
    button.addEventListener('click', () => {
      state.active.has(key) ? state.active.delete(key) : state.active.add(key)
      wake()
      button.setAttribute('aria-pressed', state.active.has(key))
    })
    return button
  }))
}

const FACETS_SHOWN = 32
function buildFacets() {
  $('facets-more').hidden = $('facets').classList.contains('open') || state.model.facets.length <= FACETS_SHOWN
  $('facets').replaceChildren(...state.model.facets.map((f, k) => {
    const button = element('button', { type: 'button', id: `facet-${k + 1}` })
    button.dataset.index = k
    button.setAttribute('aria-pressed', state.pinnedFacet === k)
    const enter = () => { state.hoverFacet = k; describe(); redraw() }
    const leave = () => { if (state.hoverFacet === k) state.hoverFacet = null; describe(); redraw() }
    button.addEventListener('pointerenter', enter); button.addEventListener('focus', enter)
    button.addEventListener('pointerleave', leave); button.addEventListener('blur', leave)
    button.addEventListener('click', () => {
      state.pinnedFacet = state.pinnedFacet === k ? null : k
      for (const b of $('facets').children) b.setAttribute('aria-pressed', b === button && state.pinnedFacet === k)
      describe(); redraw()
    })
    return button
  }))
}

// Shows a model; while editing, keeps the pose as long as the dimension stays the same
function show(model, { keepPose = false } = {}) {
  const same = keepPose && state.model?.dimension === model.dimension
  state.model = model
  if (same) {
    if (state.hoverVertex >= model.vertices.length) state.hoverVertex = null
    if (state.pinnedFacet >= model.facets.length) state.pinnedFacet = null
    state.hoverFacet = null
  } else {
    Object.assign(state, { hoverVertex: null, hoverFacet: null, pinnedFacet: null })
    $('facets').classList.remove('open')
    buildViews(model.dimension)
  }
  buildFacets()
  renderWords()
  redraw()
  checkPip()
}

// ---- source ----

// Checks the text and draws it when it has no errors; the editor marks the lines with problems
function process(text, options) {
  const parsed = parseJSON(text)
  const issues = parsed.error
    ? [{ ...parsed.error, severity: 'error', code: `json.${parsed.error.code}` }]
    : inspect(parsed.value).map(issue => ({ ...issue, ...parsed.locate(issue.path), code: `check.${issue.code}` }))
  state.issues = issues
  if (!issues.some(i => i.severity === 'error')) show(read(parsed.value), options)
  editor.mark(issues)
  renderIssues()
}

// What was last opened, to tell an edited sample from the sample itself
let loaded = { sample: null, text: '' }

const editor = new Editor($('editor'), {
  label: 'HyperGeoJSON source',
  // a single edit means the source is no longer the sample; undoing back to it selects the sample again
  onInput: text => select(text === loaded.text ? loaded.sample : null),
  onChange: text => process(text, { keepPose: true }),
})

// ---- loading ----

function status(message) { $('status').textContent = message ?? ''; $('status').hidden = !message }

const setAddress = sample => { try { history.replaceState(null, '', location.pathname + location.search + (sample ? `#${sample}` : '')) } catch {} }

// Marks which sample the editor holds, if any: the sample buttons and the address follow it
function select(sample) {
  if (sample === state.sample) return
  state.sample = sample
  for (const name of SAMPLES) $(`sample-${name}`).setAttribute('aria-pressed', name === sample)
  setAddress(sample)
}

function open(text, sample = null) {
  loaded = { sample, text }
  state.sample = undefined
  select(sample)
  status(null)
  editor.text = text
  process(text, { keepPose: false })
}

async function loadSample(name) {
  try {
    const response = await fetch(`samples/${name}.json`)
    if (!response.ok) throw new Error(t('status.sample', { name: t(`sample.${name}`), status: response.status }))
    open(await response.text(), name)
  } catch (error) { status(error.message) }
}

async function loadFile(file) {
  try { open(await file.text()) } catch { status(t('status.file', { file: file.name })) }
}

// one shelf per dimension, one button per sample
$('shelves').replaceChildren(...CATALOG.map(([shelf, ids]) => {
  const label = element('span', { className: 'shelf-label', id: `shelf-${shelf}`, textContent: shelf })
  label.dataset.i18n = `shelf.${shelf}`
  const items = element('div', { className: 'shelf-items' }, ...ids.map(id => {
    const button = element('button', { type: 'button', id: `sample-${id}`, textContent: id })
    button.dataset.sample = id
    button.dataset.i18n = `sample.${id}`
    button.setAttribute('aria-pressed', 'false')
    button.addEventListener('click', () => loadSample(id))
    return button
  }))
  items.setAttribute('role', 'group')
  items.setAttribute('aria-labelledby', `shelf-${shelf}`)
  return element('div', { className: 'shelf' }, label, items)
}))
for (const link of document.querySelectorAll('.languages a')) link.addEventListener('click', () => {
  try { localStorage.setItem('hypergeojson.language', link.lang) } catch {}
})
document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => { e.preventDefault(); const [file] = e.dataTransfer.files; if (file) loadFile(file) })

$('facets-more').addEventListener('click', () => {
  const fromKeyboard = $('facets-more').matches(':focus-visible')
  $('facets').classList.add('open')
  $('facets-more').hidden = true
  if (fromKeyboard) $('facets').children[FACETS_SHOWN].focus() // the focused button just went away
})
$('play').addEventListener('click', () => setPlaying(!state.playing))
$('align').addEventListener('click', () => { state.rotation?.align(); redraw() })
$('normals').addEventListener('change', e => { state.normals = e.target.checked; redraw() })

// ---- install ----

const MANAGERS = { pnpm: 'pnpm add -D', npm: 'npm install -D', yarn: 'yarn add -D', bun: 'bun add -d' }
const PACKAGE = '@types/hyper-geojson@github:kamataryo/types__hyper-geojson#main'
const tabs = [...document.querySelectorAll('[data-pm]')]
let copied = null
function choose(manager, focus = false) {
  for (const tab of tabs) {
    const on = tab.dataset.pm === manager
    tab.setAttribute('aria-selected', on)
    tab.tabIndex = on ? 0 : -1
    if (on && focus) tab.focus()
  }
  $('install-text').textContent = `${MANAGERS[manager]} ${PACKAGE}`
  $('install-command').setAttribute('aria-labelledby', `pm-${manager}`)
  try { localStorage.setItem('hypergeojson.packageManager', manager) } catch {}
}
tabs.forEach((tab, k) => {
  tab.addEventListener('click', () => choose(tab.dataset.pm))
  tab.addEventListener('keydown', e => {
    const to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (to == null) return
    e.preventDefault()
    choose(tabs[(to + tabs.length) % tabs.length].dataset.pm, true)
  })
})
$('copy').addEventListener('click', async () => {
  const text = $('install-text').textContent
  try { await navigator.clipboard.writeText(text) }
  catch { const range = document.createRange(); range.selectNodeContents($('install-text')); getSelection().removeAllRanges(); getSelection().addRange(range); return }
  clearTimeout(copied)
  copied = setTimeout(() => { copied = null; renderWords() }, 1600)
  renderWords()
})
try { const saved = localStorage.getItem('hypergeojson.packageManager'); if (saved in MANAGERS) choose(saved) } catch {}

// ---- the TypeScript examples ----

const TS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\b(import|export|from|type|const|let|function|return|interface|extends)\b|\b([A-Z]\w*)\b|(\b\d+(?:\.\d+)?\b)|([()[\]{}<>,:;.=|&?]+)/g
const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// The page keeps each comment in English. It is found among the English code.* words and shown in the
// chosen language; after @ts-expect-error only the explanation is translated, never the directive.
const examples = [...document.querySelectorAll('code.ts')].map(code => ({ code, template: code.textContent }))
function renderExamples() {
  const keys = new Map(Object.entries(english).filter(([k]) => k.startsWith('code.')).map(([k, v]) => [v, k]))
  for (const { code, template } of examples) {
    const text = template.replace(/\/\/ (@ts-expect-error )?(.*)$/gm, (m, directive = '', comment) => `// ${directive}${keys.has(comment) ? t(keys.get(comment)) : comment}`)
    let html = '', last = 0
    for (const m of text.matchAll(TS)) {
      const [token, comment, string, keyword, type, number] = m
      html += escape(text.slice(last, m.index)) +
        `<span class="${comment ? 'com' : string ? 'str' : keyword ? 'kw' : type ? 'type' : number ? 'num' : 'pun'}">${escape(token)}</span>`
      last = m.index + token.length
    }
    code.innerHTML = html + escape(text.slice(last))
  }
}
renderExamples()

// ---- the small Petrie view: once the drawing has scrolled out of sight above, it follows the reader
// down to the editor, so every edit can be watched as it lands ----

const drawing = document.querySelector('.drawing')
function setPip(show) {
  show = show && !pip.dismissed && !!state.model
  if (show === pip.shown) return
  pip.shown = show
  $('pip').hidden = !show
  redraw()
}
// Checked on every scroll, at most once a frame: an observer would miss a jump straight past the drawing
let pipCheck = false
function checkPip() {
  pipCheck = false
  const { top, bottom } = drawing.getBoundingClientRect()
  if (bottom > 0 && top < innerHeight) pip.dismissed = false
  setPip(bottom < 0)
}
const schedulePipCheck = () => { if (!pipCheck) { pipCheck = true; requestAnimationFrame(checkPip) } }
addEventListener('scroll', schedulePipCheck, { passive: true })
addEventListener('resize', schedulePipCheck, { passive: true })
$('pip-back').addEventListener('click', () => drawing.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
$('pip-close').addEventListener('click', () => { pip.dismissed = true; setPip(false) })
attach($('pip-canvas'), () => state.views[0].view)
watcher.observe($('pip-canvas'))
watcher.observe($('petrie'))
document.addEventListener('visibilitychange', wake)

attach($('petrie'), () => state.views[0].view)
readColors()
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); redraw() })
new MutationObserver(() => { readColors(); redraw() }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
new ResizeObserver(() => redraw()).observe(document.querySelector('.drawing'))
document.fonts?.ready.then(() => redraw())

const fromHash = () => { const name = location.hash.slice(1); return SAMPLES.includes(name) ? name : null }
const openHash = async () => {
  const name = fromHash()
  if (!name) return false
  if (name !== state.sample) await loadSample(name)
  $('viewer-heading').scrollIntoView()
  return true
}
addEventListener('hashchange', openHash)

await loadWords()
setPlaying(state.playing)
// the default sample leaves the address alone: a hash would send a reload or a shared link to the viewer
if (!await openHash()) { await loadSample('tesseract'); setAddress(null) }
