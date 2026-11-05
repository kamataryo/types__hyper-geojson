// Builds the sample files shown on the demo page (docs/samples/*.json)
// and checks that every boundary faces away from what it bounds.
//
//   node scripts/build-samples.mjs

import { writeFileSync } from 'node:fs'

// ---------------------------------------------------------------------------
// Vectors
// ---------------------------------------------------------------------------

const sub = (a, b) => a.map((x, i) => x - b[i])
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const mean = ps => ps[0].map((_, k) => ps.reduce((s, p) => s + p[k], 0) / ps.length)
const isPosition = a => typeof a[0] === 'number'
const positions = a => isPosition(a) ? [a] : a.flatMap(positions)
const centroid = a => mean(positions(a))
const depth = a => isPosition(a) ? 0 : 1 + depth(a[0])
const factorial = n => n <= 1 ? 1 : n * factorial(n - 1)
const phi = (1 + Math.sqrt(5)) / 2

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

// The vector perpendicular to n - 1 vectors in n dimensions
const cross = vectors => Array.from({ length: vectors.length + 1 }, (_, k) => (k % 2 ? -1 : 1) * det(vectors.map(v => v.filter((_, j) => j !== k))))

// Every sign pattern and every (even) permutation of a point
const signs = p => p.reduce((out, x) => out.flatMap(q => x === 0 ? [[...q, 0]] : [[...q, x], [...q, -x]]), [[]])
function permutations(p, evenOnly = false) {
  const out = []
  const go = (rest, done, parity) => {
    if (!rest.length) { if (!evenOnly || parity === 0) out.push(done); return }
    rest.forEach((x, i) => go([...rest.slice(0, i), ...rest.slice(i + 1)], [...done, x], (parity + i) % 2))
  }
  go(p, [], 0)
  return out
}
const unique = points => [...new Map(points.map(p => [p.map(x => x.toFixed(9)).join(), p])).values()]

// ---------------------------------------------------------------------------
// Convex polytopes, from their vertices
// ---------------------------------------------------------------------------

// An orthonormal basis for the affine hull of some points
function basis(points) {
  const origin = points[0], axes = []
  for (const p of points.slice(1)) {
    let v = sub(p, origin)
    for (const a of axes) { const d = dot(v, a); v = v.map((x, i) => x - d * a[i]) }
    const l = Math.hypot(...v)
    if (l > 1e-9) axes.push(v.map(x => x / l))
  }
  return { origin, axes, local: p => axes.map(a => dot(sub(p, origin), a)) }
}

// The faces one dimension down of the convex polytope spanned by points[ids]:
// each is the set of points on a supporting hyperplane through some k of them
function facetsOf(points, ids) {
  const { axes, local } = basis(ids.map(i => points[i]))
  const k = axes.length, q = ids.map(i => local(points[i])), found = new Map()
  const pick = (start, chosen) => {
    if (chosen.length === k) {
      const n = cross(chosen.slice(1).map(j => sub(q[j], q[chosen[0]]))), l = Math.hypot(...n)
      if (l < 1e-9) return
      const side = q.map(p => dot(n, sub(p, q[chosen[0]])) / l)
      if (side.some(s => s > 1e-7) && side.some(s => s < -1e-7)) return
      const face = ids.filter((_, j) => Math.abs(side[j]) <= 1e-7)
      found.set(face.join(), face)
      return
    }
    for (let j = start; j < q.length; j++) { chosen.push(j); pick(j + 1, chosen); chosen.pop() }
  }
  pick(0, [])
  return [...found.values()]
}

// A polygon's vertices in order around it, closed
function ring(points, ids) {
  const { local } = basis(ids.map(i => points[i]))
  const q = ids.map(i => local(points[i])), c = mean(q)
  const around = ids.map((id, j) => [Math.atan2(q[j][1] - c[1], q[j][0] - c[0]), points[id]]).sort((a, b) => a[0] - b[0]).map(([, p]) => p)
  return [...around, around[0]]
}

// The nested boundaries of a convex polytope; its facets can be given when there are too many vertices to search
function convex(points, facets = null) {
  const build = ids => basis(ids.map(i => points[i])).axes.length === 2 ? [ring(points, ids)] : facetsOf(points, ids).map(build)
  return orient((facets ?? facetsOf(points, points.map((_, i) => i))).map(build))
}

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

// The regular simplex in n dimensions: the unit vectors and one point on the diagonal
function simplex(n) {
  const t = (1 - Math.sqrt(n + 1)) / n
  return convex([...Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j))), Array(n).fill(t)])
}

// The cross-polytope (orthoplex) in n dimensions
const orthoplex = n => convex(Array.from({ length: n }, (_, i) => [1, -1].map(s => Array.from({ length: n }, (_, j) => i === j ? s : 0))).flat())

// The 600-cell: its tetrahedra are the sets of four mutually adjacent vertices
function hexacosichoron() {
  const points = unique([
    ...permutations([1, 0, 0, 0]).flatMap(signs),
    ...signs([0.5, 0.5, 0.5, 0.5]),
    ...permutations([phi / 2, 0.5, 1 / (2 * phi), 0], true).flatMap(signs),
  ])
  const edge = 1 / phi, near = (a, b) => Math.abs(Math.hypot(...sub(points[a], points[b])) - edge) < 1e-9
  const neighbours = points.map((_, a) => points.map((_, b) => b).filter(b => b !== a && near(a, b)))
  const cells = []
  for (let a = 0; a < points.length; a++) for (const b of neighbours[a]) if (b > a)
    for (const c of neighbours[a]) if (c > b && near(b, c))
      for (const d of neighbours[a]) if (d > c && near(b, d) && near(c, d)) cells.push([a, b, c, d])
  return { points, cells }
}

// The 120-cell, dual to the 600-cell: a vertex at the centre of each tetrahedron,
// and a dodecahedral cell around each vertex of the 600-cell
function hecatonicosachoron() {
  const { points, cells } = hexacosichoron()
  const centres = cells.map(c => mean(c.map(i => points[i])))
  return convex(centres, points.map((_, v) => cells.flatMap((c, k) => c.includes(v) ? [k] : [])))
}

// ---------------------------------------------------------------------------
// Other shapes
// ---------------------------------------------------------------------------

// A rectangle across the two other axes at `at` on axis k, facing +k or -k by the right-hand rule
function rect(k, at, facing, [u0, u1], [v0, v1]) {
  const [u, v] = [(k + 1) % 3, (k + 2) % 3]
  const point = (a, b) => { const p = [0, 0, 0]; p[k] = at; p[u] = a; p[v] = b; return p }
  const corners = [point(u0, v0), point(u1, v0), point(u1, v1), point(u0, v1)]
  if (facing < 0) corners.reverse()
  return [...corners, corners[0]]
}

// A surface as a grid of n x m quads. p is also asked for column n and row m, which is where a seam gets joined.
function grid(n, m, p) {
  const quads = []
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) quads.push([[p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1), p(i, j)]])
  return quads
}

// A torus: a circle of radius r swept around a circle of radius R, as n x m flat quads.
// The tube is much shorter around than the ring, so it takes fewer quads.
// Each ring runs first around the axis, then around the tube, which turns it to face outward.
// Indices wrap, so the seam meets itself exactly.
function torus(n = 16, m = 8, R = 2, r = 0.8) {
  return grid(n, m, (i, j) => { const u = 2 * Math.PI * (i % n) / n, v = 2 * Math.PI * (j % m) / m; return [(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)] })
}

// A chain of two links, each running through the other's hole.
// The second link is a quarter turn about the x axis, which keeps its faces outward, moved along to the first link's tube.
function chain(R = 2, r = 0.5) {
  const moved = (a, f) => isPosition(a) ? f(a) : a.map(b => moved(b, f))
  return [torus(16, 8, R, r), moved(torus(16, 8, R, r), ([x, y, z]) => [x + R, z, -y])]
}

// A Möbius strip, as n x m quads: a segment of half-width w makes half a turn while going once around a circle of radius R.
// It has one side, so no inside to enclose: a MultiPolygon, not a Polyhedron.
// Past the end the segment has turned over, so column n is column 0 read backward. That is the twist.
function moebius(n = 32, m = 4, R = 2, w = 0.7) {
  const at = (i, j) => { const u = 2 * Math.PI * i / n, v = w * (2 * j / m - 1), r = R + v * Math.cos(u / 2); return [r * Math.cos(u), r * Math.sin(u), v * Math.sin(u / 2)] }
  return grid(n, m, (i, j) => i === n ? at(0, m - j) : at(i, j))
}

// The shadow of a Möbius strip on a plane, seen at a slant so that no cross-section falls on a single point.
// The plane has no room for the twist, so the strip folds over itself, and a quad on a fold can cross itself.
// Each runs counterclockwise, as a polygon in the plane should.
function moebiusShadow(tilt = 0.9) {
  return moebius().map(([ring]) => {
    const flat = ring.map(([x, y, z]) => [x, y * Math.cos(tilt) - z * Math.sin(tilt)])
    return [volume([flat], [0, 0]) > 0 ? flat : [...flat].reverse()]
  })
}

// The Klein bottle in three dimensions, in its bottle shape (Cartan's parametrization). It has to pass through itself at the neck.
// Like the strip it has one side, so it is a MultiPolygon. Column n is column 0 reflected: v becomes pi - v.
function kleinBottle(n = 24, m = 8) {
  const at = (i, j) => {
    const u = Math.PI * i / n, v = 2 * Math.PI * (j % m) / m
    const [cu, su, cv, sv] = [Math.cos(u), Math.sin(u), Math.cos(v), Math.sin(v)]
    return [
      -2 / 15 * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su),
      -1 / 15 * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su),
      2 / 15 * (3 + 5 * cu * su) * sv,
    ]
  }
  return grid(n, m, (i, j) => i === n ? at(0, m / 2 - j + m) : at(i, j))
}

// The Klein bottle in four dimensions, where it need not pass through itself: a tube around a circle, whose
// cross-section turns half a turn through z and w on the way, so it comes back upside down. Column n is column 0 with v as -v.
function kleinBottle4(n = 24, m = 8, R = 2, r = 1) {
  const at = (i, j) => { const u = 2 * Math.PI * i / n, v = 2 * Math.PI * (j % m) / m, s = R + r * Math.cos(v); return [s * Math.cos(u), s * Math.sin(u), r * Math.sin(v) * Math.cos(u / 2), r * Math.sin(v) * Math.sin(u / 2)] }
  return grid(n, m, (i, j) => i === n ? at(0, m - j) : at(i, j))
}

// A donut with two holes, in the plane: a Cassini oval around two round holes.
// The outline runs counterclockwise and the holes clockwise, as GeoJSON asks.
function twoHoleDonut(outline = 48, hole = 16) {
  const a = 1, b = 1.15 // b > a gives the peanut-shaped oval around the foci (±a, 0)
  const loop = (n, at) => { const ring = Array.from({ length: n }, (_, k) => at(2 * Math.PI * k / n)); return [...ring, ring[0]] }
  const outer = loop(outline, t => { const r = Math.sqrt(a * a * Math.cos(2 * t) + Math.sqrt(b ** 4 - a ** 4 * Math.sin(2 * t) ** 2)); return [r * Math.cos(t), r * Math.sin(t)] })
  const holes = [-a, a].map(cx => loop(hole, t => [cx + 0.35 * Math.cos(-t), 0.35 * Math.sin(-t)]))
  return [outer, ...holes]
}

// The Menger sponge after `level` steps: a block of 3^level small cubes, from which each step takes the centre
// and the centres of the faces of every block that is left. The sponge itself, after infinitely many steps,
// has infinitely many faces and no volume, so only a step on the way can be written down.
// The boundary is every face of a small cube that does not touch another small cube.
function menger(level) {
  const size = 3 ** level
  const keep = c => c.every(x => x >= 0 && x < size) &&
    Array.from({ length: level }, (_, l) => c.filter(x => Math.floor(x / 3 ** l) % 3 === 1).length < 2).every(Boolean)
  const faces = []
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) for (let z = 0; z < size; z++) {
    const c = [x, y, z]
    if (!keep(c)) continue
    for (let k = 0; k < 3; k++) for (const side of [0, 1]) {
      const next = [...c]; next[k] += side ? 1 : -1
      if (keep(next)) continue
      const [u, v] = [(k + 1) % 3, (k + 2) % 3]
      faces.push([rect(k, c[k] + side, side ? 1 : -1, [c[u], c[u] + 1], [c[v], c[v] + 1])])
    }
  }
  return faces
}

// The flat torus in four dimensions, as a mesh of n x n squares (a surface, not a solid)
function cliffordTorus(n = 16) {
  return grid(n, n, (i, j) => { const a = 2 * Math.PI * (i % n) / n, b = 2 * Math.PI * (j % n) / n; return [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)].map(x => x / Math.SQRT2) })
}

// The n-n duoprism: a regular n-gon times a regular n-gon
function duoprism(n) {
  const gon = Array.from({ length: n }, (_, i) => [Math.cos(2 * Math.PI * i / n), Math.sin(2 * Math.PI * i / n)])
  return convex(gon.flatMap(a => gon.map(b => [...a, ...b])))
}

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

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
// A polygon's area is the same idea one dimension down.
function volume(coordinates, p0) {
  if (depth(coordinates) === 2) return coordinates.reduce((s, r) => s + r.slice(1).reduce((t, b, k) => t + det([sub(r[k], p0), sub(b, p0)]), 0), 0) / 2
  return [...flags(coordinates)].reduce((s, f) => s + flagDet(f, p0), 0) / factorial(depth(coordinates))
}

// What a mesh is as a surface: Euler characteristic, whether it has an edge, and whether it can be turned consistently.
// With the characteristic at 0, these tell a torus, a Möbius strip and a Klein bottle apart.
function surface(polygons) {
  const vertices = new Set(), edges = new Map()
  polygons.forEach(([ring], face) => {
    for (let k = 0; k + 1 < ring.length; k++) {
      const [p, q] = [ring[k].join(), ring[k + 1].join()], key = p < q ? `${p}|${q}` : `${q}|${p}`
      vertices.add(p)
      edges.set(key, [...edges.get(key) ?? [], { face, way: p < q ? 1 : -1 }])
    }
  })
  if ([...edges.values()].some(e => e.length > 2)) throw new Error('more than two polygons meet at an edge')
  // Walk the faces, turning each to agree with the one before: neighbours should walk a shared edge opposite ways
  const neighbours = polygons.map(() => [])
  for (const e of edges.values()) if (e.length === 2) {
    neighbours[e[0].face].push({ face: e[1].face, flip: e[0].way === e[1].way })
    neighbours[e[1].face].push({ face: e[0].face, flip: e[0].way === e[1].way })
  }
  const turned = new Map([[0, false]]), stack = [0]
  let orientable = true
  while (stack.length) {
    const face = stack.pop()
    for (const n of neighbours[face]) {
      const want = turned.get(face) !== n.flip
      if (!turned.has(n.face)) { turned.set(n.face, want); stack.push(n.face) }
      else if (turned.get(n.face) !== want) orientable = false
    }
  }
  if (turned.size !== polygons.length) throw new Error('the mesh falls apart into separate pieces')
  return { euler: vertices.size - edges.size + polygons.length, closed: [...edges.values()].every(e => e.length === 2), orientable }
}

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

const hyper = (name, type, coordinates) => ({ type: 'HyperFeature', properties: { name }, geometry: { type, coordinates } })
const feature = (name, geometry) => ({ type: 'Feature', properties: { name }, geometry })

const tetrahedron = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]
const MOEBIUS = { euler: 0, closed: false, orientable: false }, KLEIN = { euler: 0, closed: true, orientable: false }
const samples = [
  // file, the object, and what to check: expected volumes of the solids (or areas of the polygons) in it
  ['two-hole-donut', feature('Two-hole donut', { type: 'Polygon', coordinates: twoHoleDonut() }), { polygons: [null] }],
  ['moebius-strip-shadow', feature('Shadow of a Möbius strip', { type: 'MultiPolygon', coordinates: moebiusShadow() }), { surface: MOEBIUS }],

  ['tetrahedron', hyper('Tetrahedron', 'Polyhedron', convex(tetrahedron)), { solids: [8 / 3] }],
  ['cube', hyper('Cube', 'Polyhedron', cube(3)), { solids: [1] }],
  ['octahedron', hyper('Octahedron', 'Polyhedron', orthoplex(3)), { solids: [4 / 3] }],
  ['dodecahedron', hyper('Dodecahedron', 'Polyhedron', convex([
    ...signs([1, 1, 1]), ...[[0, 1 / phi, phi], [1 / phi, phi, 0], [phi, 0, 1 / phi]].flatMap(signs),
  ])), { solids: [(15 + 7 * Math.sqrt(5)) / 4 * (2 / phi) ** 3] }],
  ['icosahedron', hyper('Icosahedron', 'Polyhedron', convex([[0, 1, phi], [1, phi, 0], [phi, 0, 1]].flatMap(signs))), { solids: [5 * (3 + Math.sqrt(5)) / 12 * 8] }],
  ['truncated-icosahedron', hyper('Truncated icosahedron', 'Polyhedron', convex([[0, 1, 3 * phi], [1, 2 + phi, 2 * phi], [phi, 2, phi ** 3]]
    .flatMap(p => [p, [p[1], p[2], p[0]], [p[2], p[0], p[1]]]).flatMap(signs))), { solids: [(125 + 43 * Math.sqrt(5)) / 4 * 8] }],
  ['rhombic-dodecahedron', hyper('Rhombic dodecahedron', 'Polyhedron', convex([...signs([1, 1, 1]), ...permutations([2, 0, 0]).flatMap(signs)].filter((p, i, all) => all.findIndex(q => q.join() === p.join()) === i))), { solids: [16] }],
  ['stella-octangula', hyper('Stella octangula', 'MultiPolyhedron', [convex(tetrahedron), convex(tetrahedron.map(p => p.map(x => -x)))]), { solids: [8 / 3, 8 / 3] }],
  ['menger-sponge', hyper('Menger sponge, level 2', 'Polyhedron', menger(2)), { solids: [400] }],
  ['torus', hyper('Torus', 'Polyhedron', torus()), { solids: [null] }],
  ['chain', hyper('Chain', 'MultiPolyhedron', chain()), { solids: [null, null] }],
  ['moebius-strip', hyper('Möbius strip', 'MultiPolygon', moebius()), { surface: MOEBIUS }],
  ['klein-bottle', hyper('Klein bottle', 'MultiPolygon', kleinBottle()), { surface: KLEIN }],

  ['pentachoron', hyper('5-cell', 'Polychoron', simplex(4)), { solids: [Math.sqrt(5) / 24] }],
  ['tesseract', hyper('Tesseract', 'Polychoron', cube(4)), { solids: [1] }],
  ['16-cell', hyper('16-cell', 'Polychoron', orthoplex(4)), { solids: [2 / 3] }],
  ['24-cell', hyper('24-cell', 'Polychoron', convex(permutations([1, 1, 0, 0]).flatMap(signs).filter((p, i, all) => all.findIndex(q => q.join() === p.join()) === i))), { solids: [8] }],
  ['120-cell', hyper('120-cell', 'Polychoron', hecatonicosachoron()), { solids: [null] }],
  ['600-cell', hyper('600-cell', 'Polychoron', (({ points, cells }) => convex(points, cells))(hexacosichoron())), { solids: [null] }],
  ['hollow-tesseract', hyper('Hollow tesseract', 'Polychoron', [...cube(4, 0, 3), ...reversed(cube(4, 1, 2))]), { solids: [80] }],
  ['duoprism', hyper('6-6 duoprism', 'Polychoron', duoprism(6)), { solids: [(3 * Math.sqrt(3) / 2) ** 2] }],
  ['clifford-torus', hyper('Clifford torus', 'MultiPolygon', cliffordTorus()), { surface: { euler: 0, closed: true, orientable: true } }],
  ['klein-bottle-4d', hyper('Klein bottle', 'MultiPolygon', kleinBottle4()), { surface: KLEIN }],

  ['5-simplex', hyper('5-simplex', 'Polytope5', simplex(5)), { solids: [Math.sqrt(6) / 120] }],
  ['5-orthoplex', hyper('5-orthoplex', 'Polytope5', orthoplex(5)), { solids: [4 / 15] }],
  ['penteract', hyper('Penteract', 'Polytope5', cube(5)), { solids: [1] }],
  ['hexeract', hyper('Hexeract', 'Polytope6', cube(6)), { solids: [1] }],
]

// Rounds coordinates for the file, after every check has run on the exact values
const rounded = value => JSON.parse(JSON.stringify(value, (k, v) => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 || 0 : v))

const arrayDepth = v => Array.isArray(v) ? 1 + (v.length ? arrayDepth(v[0]) : 0) : 0
const onlyNumbers = v => Array.isArray(v) ? v.every(onlyNumbers) : typeof v === 'number'
function format(value, indent = '') {
  if (Array.isArray(value) && onlyNumbers(value) && arrayDepth(value) <= 3) return JSON.stringify(value).replace(/,/g, ', ')
  if (Array.isArray(value)) return '[\n' + value.map(v => indent + '  ' + format(v, indent + '  ')).join(',\n') + '\n' + indent + ']'
  if (value && typeof value === 'object') return '{\n' + Object.entries(value).map(([k, v]) => `${indent}  ${JSON.stringify(k)}: ${format(v, indent + '  ')}`).join(',\n') + '\n' + indent + '}'
  return JSON.stringify(value)
}

for (const [file, object, expect] of samples) {
  const report = []
  const g = object.geometry
  const members = g.type.startsWith('Multi') ? g.coordinates : [g.coordinates]
  for (const m of members) {
    const d = depth(m), n = positions(m)[0].length
    if (d < 2 || d !== n) continue // only polygons in the plane and full-dimensional solids enclose something
    const list = d === 2 ? expect.polygons : expect.solids, expected = list?.shift()
    const a = volume(m, Array(n).fill(0)), b = volume(m, Array.from({ length: n }, (_, k) => 0.37 * (k + 1) - 2))
    if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a))) throw new Error(`${file}: the boundary is twisted (${a} from one point, ${b} from another)`)
    if (a <= 0) throw new Error(`${file}: the boundary faces inward (${a})`)
    if (expected != null && Math.abs(a - expected) > 1e-6 * Math.max(1, expected)) throw new Error(`${file}: ${d === 2 ? 'area' : 'volume'} ${a}, expected ${expected}`)
    // a closed surface: every edge of a solid is walked by exactly two faces, once each way
    if (d === 3) {
      const walked = new Map()
      for (const face of m) for (const ring of face) for (let k = 0; k + 1 < ring.length; k++) {
        const [p, q] = [ring[k].join(), ring[k + 1].join()], key = p < q ? `${p}|${q}` : `${q}|${p}`
        walked.set(key, (walked.get(key) ?? 0) + (p < q ? 1 : 10))
      }
      const odd = [...walked.values()].filter(v => v !== 11).length
      if (odd) throw new Error(`${file}: ${odd} edges are not walked exactly once each way`)
    }
    report.push(`${d === 2 ? "area" : "volume"} ${a.toPrecision(6)}`)
  }
  const final = rounded(object)
  if (expect.surface) {
    const found = surface(final.geometry.coordinates) // on the rounded values, since those are what a reader gets
    for (const k in expect.surface) if (found[k] !== expect.surface[k]) throw new Error(`${file}: ${k} is ${found[k]}, expected ${expect.surface[k]}`)
  }
  const text = format(final) + '\n'
  writeFileSync(new URL(`../docs/samples/${file}.json`, import.meta.url), text)
  console.log(`${file.padEnd(22)} ${(text.length / 1024).toFixed(1).padStart(6)} KB  ${report.length > 4 ? `${report.length} polygons, each counterclockwise` : report.length ? `${report.join(' + ')} from two points` : 'a surface: nothing to enclose'}`)
}
