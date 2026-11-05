// HyperGeoJSON renderer: reads any HyperGeoJSON object and draws its shadows on canvases.
// No dependencies. Works for any number of dimensions.

const AXIS_NAMES = ['x', 'y', 'z', 'w', 'v', 'u']
export const axisName = k => AXIS_NAMES[k] ?? `x${k + 1}`
export const FACET_NAMES = ['vertex', 'edge', 'face', 'cell']
export const facetName = d => FACET_NAMES[d] ?? `${d}-face`

// ---------------------------------------------------------------------------
// Vectors
// ---------------------------------------------------------------------------

const sub = (a, b) => a.map((x, i) => x - b[i])
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const mean = ps => ps[0].map((_, k) => ps.reduce((s, p) => s + p[k], 0) / ps.length)
const normalize = a => { const l = Math.hypot(...a); return l ? a.map(x => x / l) : a }

function det(rows) {
  const m = rows.map(r => [...r]), n = m.length
  let d = 1
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r
    if (m[p][i] === 0) return 0
    if (p !== i) { [m[p], m[i]] = [m[i], m[p]]; d = -d }
    d *= m[i][i]
    for (let r = i + 1; r < n; r++) {
      const f = m[r][i] / m[i][i]
      for (let c = i; c < n; c++) m[r][c] -= f * m[i][c]
    }
  }
  return d
}

// The vector perpendicular to n - 1 vectors in n dimensions, turned so that (it, ...vectors) is positively oriented
const cross = vectors => Array.from({ length: vectors.length + 1 }, (_, k) => (k % 2 ? -1 : 1) * det(vectors.map(v => v.filter((_, j) => j !== k))))

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const isPosition = a => Array.isArray(a) && typeof a[0] === 'number'
const depthOf = a => isPosition(a) ? 0 : Array.isArray(a) && a.length ? 1 + depthOf(a[0]) : 1

// The coordinates of every geometry in a HyperGeoJSON (or GeoJSON) object, with their type
function geometries(object, out = []) {
  if (!object || typeof object !== 'object') return out
  if (Array.isArray(object.features)) object.features.forEach(f => geometries(f, out))
  else if ('geometry' in object) geometries(object.geometry, out)
  else if (Array.isArray(object.geometries)) object.geometries.forEach(g => geometries(g, out))
  else if (Array.isArray(object.coordinates)) {
    const multi = String(object.type).startsWith('Multi')
    for (const coordinates of multi ? object.coordinates : [object.coordinates]) out.push({ type: object.type, coordinates })
  }
  return out
}

/**
 * Reads a HyperGeoJSON object into vertices, edges and facets.
 * A facet is one boundary of a solid that fills its space (a face of a polyhedron, a cell of a polychoron);
 * each facet carries the outward normal its rings imply.
 */
export function read(object) {
  const found = geometries(object)
  if (!found.length) throw new Error('This file has no coordinates to draw.')
  const walk = (a, f) => isPosition(a) ? f(a) : a.forEach(b => walk(b, f))
  let dimension = 1
  found.forEach(g => walk(g.coordinates, p => { dimension = Math.max(dimension, p.length) }))
  const pad = p => Array.from({ length: dimension }, (_, k) => p[k] ?? 0)

  const vertices = [], vertexIds = new Map()
  const vertex = p => {
    const q = pad(p), key = q.join(',')
    if (!vertexIds.has(key)) { vertexIds.set(key, vertices.length); vertices.push(q) }
    return vertexIds.get(key)
  }
  const edges = [], edgeIds = new Map()
  const edge = (i, j) => {
    const key = i < j ? `${i},${j}` : `${j},${i}`
    if (!edgeIds.has(key)) { edgeIds.set(key, edges.length); edges.push(i < j ? [i, j] : [j, i]) }
    return edgeIds.get(key)
  }
  const faces = [] // faces[k]: the k-dimensional elements (k >= 2), keyed by their vertices
  const centroid = a => { const ps = []; walk(a, p => ps.push(pad(p))); return mean(ps) }

  // Collects the vertices and edges of an element nested `depth` levels deep
  function element(a, depth) {
    if (depth === 0) return { vertices: new Set([vertex(a)]), edges: new Set() }
    if (depth === 1) {
      const ids = a.map(vertex), own = new Set()
      for (let k = 0; k + 1 < ids.length; k++) if (ids[k] !== ids[k + 1]) own.add(edge(ids[k], ids[k + 1]))
      return { vertices: new Set(ids), edges: own }
    }
    const children = a.map(b => element(b, depth - 1))
    const own = { vertices: new Set(children.flatMap(c => [...c.vertices])), edges: new Set(children.flatMap(c => [...c.edges])) }
    if (!faces[depth]) faces[depth] = new Set()
    faces[depth].add([...own.vertices].sort((x, y) => x - y).join(','))
    return own
  }

  // The outward normal of a facet, from the orientation of its rings (see "Orientation" in the README):
  // follow the facet down to one edge (a, b) of one ring, and take the vector perpendicular to that flag
  function normal(facet, depth) {
    const centre = centroid(facet), frame = []
    let e = facet
    for (let k = depth; k > 2; k--) { e = e[0]; frame.push(sub(centroid(e), centre)) }
    const ring = e[0]
    frame.push(sub(pad(ring[0]), centre), sub(pad(ring[1]), centre))
    return { centre, normal: normalize(cross(frame)) }
  }

  const facets = []
  let solid = true
  for (const { coordinates } of found) {
    const depth = depthOf(coordinates)
    if (depth !== dimension) solid = false
    if (depth < 3) { element(coordinates, depth); continue }
    for (const facet of coordinates) {
      const own = element(facet, depth - 1)
      facets.push({ dimension: depth - 1, vertices: [...own.vertices], edges: [...own.edges], ...(depth === dimension ? normal(facet, depth - 1) : {}) })
    }
    if (!faces[depth]) faces[depth] = new Set()
  }

  // f-vector of the boundary: vertices, edges, faces, ... up to the facets
  const top = Math.max(1, ...found.map(g => depthOf(g.coordinates)))
  const fVector = [vertices.length, edges.length]
  for (let k = 2; k < top; k++) fVector.push(faces[k]?.size ?? 0)
  const euler = solid && top >= 3 ? fVector.reduce((s, f, k) => s + (k % 2 ? -f : f), 0) : null

  const centre = vertices.length ? mean(vertices) : pad([])
  const radius = Math.max(1e-9, ...vertices.map(v => Math.hypot(...sub(v, centre))))
  const name = object?.properties?.name ?? object?.features?.[0]?.properties?.name ?? null
  const types = [...new Set(found.map(g => g.type))]
  return { name, types, dimension, vertices, edges, facets, fVector, euler, centre, radius }
}

// ---------------------------------------------------------------------------
// Turning
// ---------------------------------------------------------------------------

export const planes = n => { const out = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]); return out }

export class Rotation {
  constructor(n) { this.n = n; this.align() }
  align() { this.m = Array.from({ length: this.n }, (_, i) => Array.from({ length: this.n }, (_, j) => +(i === j))); this.turns = 0 }
  // Turns everything by `angle` within the plane of axes i and j
  turn(i, j, angle) {
    const c = Math.cos(angle), s = Math.sin(angle), m = this.m
    for (let k = 0; k < this.n; k++) { const a = m[i][k], b = m[j][k]; m[i][k] = c * a - s * b; m[j][k] = s * a + c * b }
    if (++this.turns % 500 === 0) this.orthonormalize()
  }
  orthonormalize() {
    const m = this.m
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < i; j++) { const d = dot(m[i], m[j]); m[i] = m[i].map((x, k) => x - d * m[j][k]) }
      m[i] = normalize(m[i])
    }
  }
  apply(p) { return this.m.map(row => dot(row, p)) }
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

// Keeps axes i and j, drops the rest: one view of a multi-view drawing
export const coordinateView = (i, j) => ({ kind: 'coordinate', axes: [i, j], project: p => [p[i], p[j]] })

// Spreads the n axes evenly over half a turn, the way an isometric drawing spreads three.
// For a hypercube this is its Petrie projection: a regular 2n-gon.
export function petrieView(n) {
  const angles = Array.from({ length: n }, (_, k) => Math.PI * (k + 0.5) / n)
  const s = Math.sqrt(2 / n), u = angles.map(a => s * Math.cos(a)), v = angles.map(a => s * Math.sin(a))
  return { kind: 'petrie', axes: null, directions: angles.map((a, k) => [u[k], v[k]]), project: p => [dot(p, u), dot(p, v)] }
}

/** Sizes a canvas to its box and returns its 2D context in CSS pixels */
export function fit(canvas) {
  const ratio = window.devicePixelRatio || 1, { width, height } = canvas.getBoundingClientRect()
  const w = Math.max(1, Math.round(width * ratio)), h = Math.max(1, Math.round(height * ratio))
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  return { ctx, width, height }
}

// Where each vertex (and each facet's normal) lands in a view, in CSS pixels
export function layout(model, rotation, view, width, height) {
  const scale = Math.min(width, height) / (2 * model.radius * 1.14)
  const toScreen = p => { const [u, v] = view.project(rotation.apply(sub(p, model.centre))); return [width / 2 + u * scale, height / 2 - v * scale] }
  const points = model.vertices.map(toScreen)
  const ticks = model.facets.filter(f => f.normal).map(f => {
    const tip = f.centre.map((x, k) => x + f.normal[k] * model.radius * 0.22)
    return [toScreen(f.centre), toScreen(tip)]
  })
  return { points, ticks, scale }
}

/**
 * Draws one view.
 * state: { highlightFacet, hoverVertex, normals }; colors: { ink, faint, accent, normal }
 */
export function draw(canvas, model, rotation, view, state, colors) {
  const { ctx, width, height } = fit(canvas)
  const { points, ticks } = layout(model, rotation, view, width, height)
  ctx.clearRect(0, 0, width, height)
  ctx.lineCap = 'round'

  // the fold lines through the centre
  ctx.strokeStyle = colors.faint; ctx.lineWidth = 1; ctx.setLineDash([2, 4])
  ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke()
  ctx.setLineDash([])

  // projection lines through the vertex under the pointer: they run on into the views that share an axis
  const hover = state.hoverVertex
  if (hover != null && view.kind === 'coordinate') {
    const [x, y] = points[hover]
    ctx.strokeStyle = colors.accent; ctx.globalAlpha = 0.55; ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    ctx.setLineDash([]); ctx.globalAlpha = 1
  }

  const stroke = (ids, style, lineWidth) => {
    ctx.strokeStyle = style; ctx.lineWidth = lineWidth; ctx.beginPath()
    for (const e of ids) { const [i, j] = model.edges[e]; ctx.moveTo(...points[i]); ctx.lineTo(...points[j]) }
    ctx.stroke()
  }
  ctx.globalAlpha = 0.72
  stroke(model.edges.keys(), colors.ink, 1.25)
  ctx.globalAlpha = 1

  if (state.normals) {
    ctx.strokeStyle = colors.normal; ctx.fillStyle = colors.normal; ctx.lineWidth = 1.5
    for (const [[x0, y0], [x1, y1]] of ticks) {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
      ctx.beginPath(); ctx.arc(x0, y0, 1.75, 0, 2 * Math.PI); ctx.fill()
    }
  }

  const facet = model.facets[state.highlightFacet]
  if (facet) stroke(facet.edges, colors.accent, 2.5)
  if (hover != null) stroke(model.edges.map((e, k) => e.includes(hover) ? k : -1).filter(k => k >= 0), colors.accent, 2.5)

  ctx.fillStyle = colors.ink
  for (const [x, y] of points) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 2 * Math.PI); ctx.fill() }
  if (hover != null) {
    ctx.fillStyle = colors.accent; ctx.beginPath(); ctx.arc(...points[hover], 4, 0, 2 * Math.PI); ctx.fill()
  }

  // the axes of the large view, as a small star in its corner
  if (view.kind === 'petrie') {
    const r = Math.min(width, height) * 0.07, cx = r * 1.7, cy = height - r * 1.7
    ctx.strokeStyle = colors.faint; ctx.fillStyle = colors.faint; ctx.lineWidth = 1
    ctx.font = '11px "B612 Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    view.directions.forEach(([u, v], k) => {
      const l = Math.hypot(u, v) || 1
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + u / l * r, cy - v / l * r); ctx.stroke()
      ctx.fillText(axisName(k), cx + u / l * r * 1.35, cy - v / l * r * 1.35)
    })
  }
}

/** The vertex nearest to (x, y) in a view, within `reach` CSS pixels */
export function vertexAt(canvas, model, rotation, view, x, y, reach = 12) {
  const { width, height } = canvas.getBoundingClientRect()
  const { points } = layout(model, rotation, view, width, height)
  let best = null, bestDistance = reach
  points.forEach(([px, py], k) => { const d = Math.hypot(px - x, py - y); if (d < bestDistance) { best = k; bestDistance = d } })
  return best
}
