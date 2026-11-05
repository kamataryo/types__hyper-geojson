// HyperGeoJSON renderer: reads any HyperGeoJSON object and draws its shadows on canvases.
// No dependencies. Works for any number of dimensions.

const AXIS_NAMES = ['x', 'y', 'z', 'w', 'v', 'u']
export const axisName = k => AXIS_NAMES[k] ?? `x${k + 1}`

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

// Every geometry in a HyperGeoJSON (or GeoJSON) object, with its type and the path to its coordinates
function located(object, path = [], out = []) {
  if (!object || typeof object !== 'object') return out
  if (Array.isArray(object.features)) object.features.forEach((f, i) => located(f, [...path, 'features', i], out))
  else if ('geometry' in object) located(object.geometry, [...path, 'geometry'], out)
  else if (Array.isArray(object.geometries)) object.geometries.forEach((g, i) => located(g, [...path, 'geometries', i], out))
  else if (Array.isArray(object.coordinates)) out.push({ type: String(object.type), coordinates: object.coordinates, path: [...path, 'coordinates'] })
  return out
}

// The same, with each member of a Multi* geometry on its own
const geometries = object => located(object).flatMap(g =>
  g.type.startsWith('Multi') ? g.coordinates.map((coordinates, i) => ({ ...g, coordinates, path: [...g.path, i] })) : [g])

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
  // faces[k]: the k-dimensional elements (k >= 2), keyed by their vertices, each with what it adds to
  // the Euler characteristic: 1, except a face with holes, which adds 1 - holes
  const faces = []
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
    if (!faces[depth]) faces[depth] = new Map()
    faces[depth].set([...own.vertices].sort((x, y) => x - y).join(','), depth === 2 ? 2 - a.length : 1)
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
    if (!faces[depth]) faces[depth] = new Map()
  }

  // f-vector of the boundary: vertices, edges, faces, ... up to the facets
  const top = Math.max(1, ...found.map(g => depthOf(g.coordinates)))
  const fVector = [vertices.length, edges.length]
  for (let k = 2; k < top; k++) fVector.push(faces[k]?.size ?? 0)
  let euler = null, shells = null
  if (solid && top >= 3) {
    euler = vertices.length - edges.length
    for (let k = 2; k < top; k++) for (const adds of faces[k]?.values() ?? []) euler += k % 2 ? -adds : adds
    // closed shells: facets joined through the edges they share
    const parent = facets.map((_, i) => i), root = i => parent[i] === i ? i : (parent[i] = root(parent[i])), seen = new Map()
    facets.forEach((f, i) => f.edges.forEach(e => { if (seen.has(e)) parent[root(i)] = root(seen.get(e)); else seen.set(e, i) }))
    shells = new Set(facets.map((_, i) => root(i))).size
  }

  const centre = vertices.length ? mean(vertices) : pad([])
  const radius = Math.max(1e-9, ...vertices.map(v => Math.hypot(...sub(v, centre))))
  const name = object?.properties?.name ?? object?.features?.[0]?.properties?.name ?? null
  const types = [...new Set(found.map(g => g.type))]
  // the edges at each vertex, so pointing at a vertex need not search every edge
  const incident = vertices.map(() => [])
  edges.forEach(([i, j], k) => { incident[i].push(k); incident[j].push(k) })
  // a normal is drawn about as long as its facet is wide, so a many-faced solid is not lost under its normals
  const normals = facets.filter(f => f.normal).length
  const tick = 0.22 * radius * Math.min(1, (12 / Math.max(1, normals)) ** (1 / Math.max(1, dimension - 1)))
  return { name, types, dimension, vertices, edges, incident, facets, fVector, euler, shells, centre, radius, tick }
}

// ---------------------------------------------------------------------------
// Turning
// ---------------------------------------------------------------------------

export const planes = n => { const out = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]); return out }

export class Rotation {
  constructor(n) { this.n = n; this.align() }
  align() { this.m = Array.from({ length: this.n }, (_, i) => Array.from({ length: this.n }, (_, j) => +(i === j))); this.turns = 0; this.version = (this.version ?? 0) + 1 }
  // Turns everything by `angle` within the plane of axes i and j
  turn(i, j, angle) {
    const c = Math.cos(angle), s = Math.sin(angle), m = this.m
    for (let k = 0; k < this.n; k++) { const a = m[i][k], b = m[j][k]; m[i][k] = c * a - s * b; m[j][k] = s * a + c * b }
    if (++this.turns % 500 === 0) this.orthonormalize()
    this.version++ // tells cached positions they are out of date
  }
  orthonormalize() {
    const m = this.m
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < i; j++) { const d = dot(m[i], m[j]); m[i] = m[i].map((x, k) => x - d * m[j][k]) }
      m[i] = normalize(m[i])
    }
  }
  // p may have fewer axes than the rotation: the missing ones are 0
  apply(p) { return this.m.map(row => dot(p, row)) }
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
  return { kind: 'petrie', axes: null, directions: angles.map((a, k) => [u[k], v[k]]), project: p => [dot(u, p), dot(v, p)] }
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
// The turned positions are the same in every view, so they are worked out once per turn and shared
const turnedCache = new WeakMap()
function turned(model, rotation) {
  let c = turnedCache.get(model)
  if (!c || c.rotation !== rotation || c.version !== rotation.version) {
    const turn = p => rotation.apply(sub(p, model.centre))
    c = {
      rotation, version: rotation.version,
      vertices: model.vertices.map(turn),
      ticks: model.facets.filter(f => f.normal).map(f => [turn(f.centre), turn(f.centre.map((x, k) => x + f.normal[k] * model.tick))]),
    }
    turnedCache.set(model, c)
  }
  return c
}

export function layout(model, rotation, view, width, height) {
  const scale = Math.min(width, height) / (2 * model.radius * 1.14)
  const toScreen = p => { const [u, v] = view.project(p); return [width / 2 + u * scale, height / 2 - v * scale] }
  const { vertices, ticks } = turned(model, rotation)
  return { points: vertices.map(toScreen), ticks: ticks.map(([a, b]) => [toScreen(a), toScreen(b)]), scale }
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

  // dots and ticks go into one path each, so a frame asks the canvas to paint a handful of times, not once per point
  const dots = (centres, r) => {
    ctx.beginPath()
    for (const [x, y] of centres) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 2 * Math.PI) }
    ctx.fill()
  }
  if (state.normals && ticks.length) {
    ctx.strokeStyle = colors.normal; ctx.fillStyle = colors.normal; ctx.lineWidth = 1.5
    ctx.beginPath()
    for (const [[x0, y0], [x1, y1]] of ticks) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1) }
    ctx.stroke()
    dots(ticks.map(([base]) => base), 1.75)
  }

  const facet = model.facets[state.highlightFacet]
  if (facet) stroke(facet.edges, colors.accent, 2.5)
  if (hover != null) stroke(model.incident[hover], colors.accent, 2.5)

  ctx.fillStyle = colors.ink
  dots(points, 1.6)
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

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

const NAMED_DEPTHS = { Point: 0, LineString: 1, Polygon: 2, Polyhedron: 3, Polychoron: 4 }

// How deep a geometry type nests its positions, or null when the name does not say
function expectedDepth(type) {
  const m = /^(Multi)?(?:(Point|LineString|Polygon|Polyhedron|Polychoron)|Polytope(\d+))$/.exec(type)
  if (!m || (m[1] && m[3] && +m[3] <= 4)) return null // MultiPolytope1-4 are aliases whose numbering varies
  return (m[2] ? NAMED_DEPTHS[m[2]] : +m[3]) + (m[1] ? 1 : 0)
}

// Signed volume from the boundary alone, coned from p0. When every boundary faces the same way
// it is the same from any p0; when some face the other way, it changes with p0.
function boundaryVolume(solid, p0, pad) {
  const n = p0.length, m = Array.from({ length: n }, () => new Float64Array(n))
  const centroid = a => { const ps = []; const walk = b => isPosition(b) ? ps.push(pad(b)) : b.forEach(walk); walk(a); return mean(ps) }
  let sum = 0
  const walk = (element, chain) => {
    if (depthOf(element) > 2) { for (const child of element) walk(child, [...chain, sub(centroid(child), p0)]); return }
    for (const ring of element) {
      const shifted = ring.map(p => sub(pad(p), p0))
      for (let k = 0; k + 1 < shifted.length; k++) {
        chain.forEach((row, r) => m[r].set(row))
        m[n - 2].set(shifted[k]); m[n - 1].set(shifted[k + 1])
        sum += detInPlace(m)
      }
    }
  }
  // a polygon in the plane is its own face: its area comes from its rings alone (GeoJSON's right-hand rule)
  if (n === 2) walk(solid, [])
  else for (const facet of solid) walk(facet, [sub(centroid(facet), p0)])
  let factorial = 1
  for (let k = 2; k <= n; k++) factorial *= k
  return sum / factorial
}

// The signed area of a ring in the plane: positive when it runs counterclockwise
const ringArea = ring => ring.slice(1).reduce((s, b, k) => s + ring[k][0] * b[1] - b[0] * ring[k][1], 0) / 2

// The determinant of square rows, worked out in place
function detInPlace(m) {
  const n = m.length
  let d = 1
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r
    if (m[p][i] === 0) return 0
    if (p !== i) { const t = m[p]; m[p] = m[i]; m[i] = t; d = -d }
    d *= m[i][i]
    for (let r = i + 1; r < n; r++) {
      const f = m[r][i] / m[i][i]
      for (let c = i; c < n; c++) m[r][c] -= f * m[i][c]
    }
  }
  return d
}

/**
 * Checks a HyperGeoJSON object. Returns issues as { severity, code, path, params },
 * where path leads from the object to the offending part.
 * Errors stop it from being drawn; warnings break a rule but can still be drawn.
 */
export function inspect(object, limit = 50) {
  const issues = []
  const issue = (severity, code, path, params = {}) => { if (issues.length < limit) issues.push({ severity, code, path, params }) }
  const found = located(object)
  if (!found.length) { issue('error', 'no-coordinates', []); return issues }

  // the path below a geometry's coordinates, kept as one stack and copied only when there is something to report
  const below = [], at = base => [...base, ...below]

  // nesting: positions are lists of numbers, and siblings nest equally deep
  const depth = new Map()
  const measure = (a, base) => {
    if (!Array.isArray(a)) { issue('error', 'not-a-position', at(base)); return -1 }
    const numbers = a.filter(x => typeof x === 'number').length
    if (numbers) { if (numbers < a.length) { issue('error', 'not-a-position', at(base)); return -1 } return 0 }
    let d = -1
    for (let i = 0; i < a.length; i++) {
      below.push(i)
      const di = measure(a[i], base)
      below.pop()
      if (di < 0) continue
      if (d >= 0 && di !== d) { issue('error', 'ragged', at(base)); return -1 }
      d = di
    }
    return d < 0 ? -1 : d + 1
  }
  for (const g of found) {
    const before = issues.length, d = measure(g.coordinates, g.path)
    depth.set(g, issues.length === before ? d : -1)
  }
  if (issues.some(i => i.severity === 'error')) return issues

  // positions agree on their dimension
  const lengths = new Set(), walk = (a, f) => isPosition(a) ? f(a) : a.forEach(b => walk(b, f))
  found.forEach(g => walk(g.coordinates, p => lengths.add(p.length)))
  const dimension = Math.max(...lengths)
  if (lengths.size > 1) issue('warning', 'mixed-dimension', found[0].path, { dimension })
  const pad = p => p.length === dimension ? p : Array.from({ length: dimension }, (_, k) => p[k] ?? 0)

  for (const g of found) {
    const d = depth.get(g), expected = expectedDepth(g.type)
    if (expected != null && d >= 0 && d !== expected) issue('warning', 'type-depth', g.path, { type: g.type, expected, found: d })

    // rings close on themselves
    let closed = true
    const rings = (a, level) => {
      if (level === 1) {
        const first = a[0], last = a[a.length - 1]
        if (a.length < 4) { closed = false; issue('warning', 'short-ring', at(g.path), { count: a.length }) }
        else if (first.length !== last.length || first.some((x, k) => x !== last[k])) { closed = false; issue('warning', 'open-ring', at(g.path)) }
        return
      }
      a.forEach((b, i) => { below.push(i); rings(b, level - 1); below.pop() })
    }
    if (d >= 2) rings(g.coordinates, d)

    // every boundary of a solid faces away from it (see "Orientation" in the README)
    const multi = g.type.startsWith('Multi'), solidDepth = multi ? d - 1 : d
    if (!closed || solidDepth !== dimension || solidDepth < 2) continue
    for (const [solid, path] of multi ? g.coordinates.map((s, i) => [s, [...g.path, i]]) : [[g.coordinates, g.path]]) {
      const points = []; walk(solid, p => points.push(pad(p)))
      const centre = mean(points), radius = Math.max(...points.map(p => Math.hypot(...sub(p, centre))))
      const elsewhere = centre.map((x, k) => x + radius * (0.3 + 0.17 * k))
      const v = boundaryVolume(solid, centre, pad), w = boundaryVolume(solid, elsewhere, pad)
      if (Math.abs(v - w) > 1e-9 * Math.max(Math.abs(v), radius ** dimension)) issue('warning', 'twisted', path)
      else if (v < 0) issue('warning', 'inside-out', path)
      // In GeoJSON a polygon's later rings are holes by their place, so each must run against the outer ring.
      // (Every ring closes on itself, so the check above cannot see a hole that runs the wrong way.)
      else if (solidDepth === 2) solid.slice(1).forEach((ring, k) => { if (ringArea(ring) > 0) issue('warning', 'hole-direction', [...path, k + 1]) })
    }
  }
  return issues
}
