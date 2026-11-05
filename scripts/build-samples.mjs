// Builds the sample HyperGeoJSON files shown on the demo page (docs/samples/*.json)
// and checks that every boundary faces away from what it bounds.
//
//   node scripts/build-samples.mjs

import { writeFileSync } from 'node:fs'

// ---------------------------------------------------------------------------
// Shapes, as nested boundaries down to rings
// ---------------------------------------------------------------------------

// The n-cube [lo, hi]^n
function cube(n, lo = 0, hi = 1) {
  const point = fixed => Array.from({ length: n }, (_, k) => fixed[k])
  const build = (free, fixed) => {
    if (free.length === 2) {
      const [u, v] = free
      return [[[lo, lo], [hi, lo], [hi, hi], [lo, hi], [lo, lo]].map(([a, b]) => point({ ...fixed, [u]: a, [v]: b }))]
    }
    return free.flatMap(axis => [lo, hi].map(side => build(free.filter(a => a !== axis), { ...fixed, [axis]: side })))
  }
  return orient(build([...Array(n).keys()], {}))
}

// The simplex spanned by n + 1 vertices in n dimensions
function simplex(vertices) {
  const build = ids => ids.length === 3
    ? [[...ids, ids[0]].map(i => vertices[i])]
    : ids.map(skip => build(ids.filter(i => i !== skip)))
  return orient(build(vertices.map((_, i) => i)))
}

// A square donut: the ring of eight unit cubes around the hole [1,2]^2, one unit high.
// Its top and bottom are polygons with a hole, written as in GeoJSON.
function donut() {
  // A rectangle across the two other axes at `at` on axis k, facing +k or -k by the right-hand rule
  const rect = (k, at, facing, [u0, u1], [v0, v1]) => {
    const [u, v] = [(k + 1) % 3, (k + 2) % 3]
    const point = (a, b) => { const p = [0, 0, 0]; p[k] = at; p[u] = a; p[v] = b; return p }
    const ring = [point(u0, v0), point(u1, v0), point(u1, v1), point(u0, v1)]
    if (facing < 0) ring.reverse()
    return [...ring, ring[0]]
  }
  const turned = ring => [ring[0], ...ring.slice(1, -1).reverse(), ring[0]]
  return [
    [rect(2, 1, +1, [0, 3], [0, 3]), turned(rect(2, 1, +1, [1, 2], [1, 2]))], // top: the hole runs the other way
    [rect(2, 0, -1, [0, 3], [0, 3]), turned(rect(2, 0, -1, [1, 2], [1, 2]))], // bottom
    [rect(0, 0, -1, [0, 3], [0, 1])], [rect(0, 3, +1, [0, 3], [0, 1])],        // outside
    [rect(1, 0, -1, [0, 1], [0, 3])], [rect(1, 3, +1, [0, 1], [0, 3])],
    [rect(0, 1, +1, [1, 2], [0, 1])], [rect(0, 2, -1, [1, 2], [0, 1])],        // around the hole, facing into it
    [rect(1, 1, +1, [0, 1], [1, 2])], [rect(1, 2, -1, [0, 1], [1, 2])],
  ]
}

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

const sub = (a, b) => a.map((x, i) => x - b[i])
const isPosition = a => typeof a[0] === 'number'
const positions = a => isPosition(a) ? [a] : a.flatMap(positions)
const centroid = a => { const ps = positions(a); return ps[0].map((_, k) => ps.reduce((s, p) => s + p[k], 0) / ps.length) }
const depth = a => isPosition(a) ? 0 : 1 + depth(a[0])
const factorial = n => n <= 1 ? 1 : n * factorial(n - 1)

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

// Every flag of the boundary: a chain of centroids from a facet down to a face, then one edge (a, b) of its ring
function* flags(coordinates) {
  function* walk(element, chain) {
    if (depth(element) === 2) {
      for (const ring of element) for (let k = 0; k + 1 < ring.length; k++) yield { chain: [...chain, centroid(element)], ring, a: ring[k], b: ring[k + 1] }
      return
    }
    for (const child of element) yield* walk(child, [...chain, centroid(child)])
  }
  for (const facet of coordinates) yield* walk(facet, [centroid(facet)])
}

// The simplex (p0, facet, ..., face, a, b) of a flag; positive when its facet faces away from p0's side
const flagDet = ({ chain, a, b }, p0) => det([...dedupe(chain), a, b].map(q => sub(q, p0)))
const dedupe = chain => chain.filter((q, i) => i === 0 || q.some((x, k) => x !== chain[i - 1][k]))

// Turn each ring of a convex polytope so that its facet faces away from the centre
function orient(coordinates) {
  const centre = centroid(coordinates)
  for (const flag of flags(coordinates)) {
    if (flag.a !== flag.ring[0]) continue
    if (flagDet(flag, centre) < 0) flag.ring.splice(1, flag.ring.length - 2, ...flag.ring.slice(1, -1).reverse())
  }
  return coordinates
}

const reversed = coordinates => JSON.parse(JSON.stringify(coordinates), (key, value) =>
  Array.isArray(value) && value.length && Array.isArray(value[0]) && isPosition(value[0])
    ? [value[0], ...value.slice(1, -1).reverse(), value[0]]
    : value)

// Signed volume from the boundary alone. When every boundary is turned consistently,
// it is the same from any point p0; when one is turned the wrong way, it changes with p0.
const volume = (coordinates, p0) => [...flags(coordinates)].reduce((s, f) => s + flagDet(f, p0), 0) / factorial(depth(coordinates))

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

const t = (1 - Math.sqrt(5)) / 4
const round = x => Math.round(x * 1e6) / 1e6
const pentachoronVertices = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [t, t, t, t].map(round)]

const samples = [
  { file: 'hollow-cube', name: 'Hollow cube', type: 'Polyhedron', coordinates: [...cube(3, 0, 3), ...reversed(cube(3, 1, 2))], volume: 26 },
  { file: 'donut', name: 'Donut', type: 'Polyhedron', coordinates: donut(), volume: 8 },
  { file: 'tesseract', name: 'Tesseract', type: 'Polychoron', coordinates: cube(4), volume: 1 },
  { file: 'pentachoron', name: '5-cell', type: 'Polychoron', coordinates: simplex(pentachoronVertices), volume: Math.sqrt(5) / 24 },
  { file: 'penteract', name: 'Penteract', type: 'Polytope5', coordinates: cube(5), volume: 1 },
  { file: 'hexeract', name: 'Hexeract', type: 'Polytope6', coordinates: cube(6), volume: 1 },
]

function format(value, indent = '') {
  if (Array.isArray(value) && depth(value) > 2) return '[\n' + value.map(v => indent + '  ' + format(v, indent + '  ')).join(',\n') + '\n' + indent + ']'
  if (Array.isArray(value)) return JSON.stringify(value).replace(/,/g, ', ')
  if (value && typeof value === 'object') return '{\n' + Object.entries(value).map(([k, v]) => `${indent}  ${JSON.stringify(k)}: ${format(v, indent + '  ')}`).join(',\n') + '\n' + indent + '}'
  return JSON.stringify(value)
}

for (const { file, name, type, coordinates, volume: expected } of samples) {
  const n = depth(coordinates)
  const a = volume(coordinates, Array(n).fill(0)), b = volume(coordinates, Array.from({ length: n }, (_, k) => 0.37 * (k + 1) - 2))
  if (Math.abs(a - expected) > 1e-5 || Math.abs(b - expected) > 1e-5) throw new Error(`${name}: volume ${a} / ${b}, expected ${expected}`)
  const feature = { type: 'HyperFeature', properties: { name }, geometry: { type, coordinates } }
  writeFileSync(new URL(`../docs/samples/${file}.json`, import.meta.url), format(feature) + '\n')
  console.log(`${name.padEnd(12)} ${type.padEnd(11)} volume ${a.toFixed(6)} from two points (expected ${expected.toFixed(6)})`)
}
