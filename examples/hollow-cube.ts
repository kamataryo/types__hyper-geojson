// A cube with a cubic void: the solid [0,3]^3 around the void [1,2]^3, of volume 27 - 1 = 26.
//
// Every boundary faces away from what it bounds (see "Orientation" in the README):
// the outer faces point out of the cube, and the faces around the void point into the void.
// The void needs no nesting level of its own. It is six more faces, facing the other way.
// Turned outward instead, the same six faces would make a second solid inside the first.

import type HyperGeoJSON from '../index.d.ts'
import assert from 'node:assert'

export const hollowCube: HyperGeoJSON.Polyhedron = {
  type: 'Polyhedron',
  coordinates: [
    // outside, facing out
    [[[0, 0, 3], [0, 3, 3], [0, 3, 0], [0, 0, 0], [0, 0, 3]]],
    [[[3, 0, 0], [3, 3, 0], [3, 3, 3], [3, 0, 3], [3, 0, 0]]],
    [[[3, 0, 0], [3, 0, 3], [0, 0, 3], [0, 0, 0], [3, 0, 0]]],
    [[[0, 3, 0], [0, 3, 3], [3, 3, 3], [3, 3, 0], [0, 3, 0]]],
    [[[0, 3, 0], [3, 3, 0], [3, 0, 0], [0, 0, 0], [0, 3, 0]]],
    [[[0, 0, 3], [3, 0, 3], [3, 3, 3], [0, 3, 3], [0, 0, 3]]],
    // around the void, facing in
    [[[1, 1, 1], [1, 2, 1], [1, 2, 2], [1, 1, 2], [1, 1, 1]]],
    [[[2, 1, 2], [2, 2, 2], [2, 2, 1], [2, 1, 1], [2, 1, 2]]],
    [[[1, 1, 1], [1, 1, 2], [2, 1, 2], [2, 1, 1], [1, 1, 1]]],
    [[[2, 2, 1], [2, 2, 2], [1, 2, 2], [1, 2, 1], [2, 2, 1]]],
    [[[1, 1, 1], [2, 1, 1], [2, 2, 1], [1, 2, 1], [1, 1, 1]]],
    [[[1, 2, 2], [2, 2, 2], [2, 1, 2], [1, 1, 2], [1, 2, 2]]],
  ],
}

// ---------------------------------------------------------------------------
// Check: how many times the faces wind around a point, and the volume they enclose
// ---------------------------------------------------------------------------

type Position = HyperGeoJSON.HyperPosition
const sub = (a: Position, b: Position) => a.map((x, i) => x - b[i])
const dot = (a: Position, b: Position) => a.reduce((s, x, i) => s + x * b[i], 0)
const cross = (a: Position, b: Position) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const length = (a: Position) => Math.hypot(...a)

// Each face, cut into triangles from its first corner (these faces have no holes)
function triangles({ coordinates }: HyperGeoJSON.Polyhedron): Position[][] {
  const result: Position[][] = []
  for (const [ring] of coordinates) {
    for (let i = 1; i < ring.length - 2; i++) result.push([ring[0], ring[i], ring[i + 1]])
  }
  return result
}

// The signed solid angle the faces subtend at the point, in whole turns
function windingNumber(polyhedron: HyperGeoJSON.Polyhedron, point: Position): number {
  let solidAngle = 0
  for (const corners of triangles(polyhedron)) {
    const [a, b, c] = corners.map(corner => sub(corner, point))
    const [la, lb, lc] = [a, b, c].map(length)
    solidAngle += 2 * Math.atan2(dot(a, cross(b, c)), la * lb * lc + dot(a, b) * lc + dot(a, c) * lb + dot(b, c) * la)
  }
  return solidAngle / (4 * Math.PI)
}

function volume(polyhedron: HyperGeoJSON.Polyhedron): number {
  let v = 0
  for (const [a, b, c] of triangles(polyhedron)) v += dot(a, cross(b, c)) / 6
  return v
}

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)
near(windingNumber(hollowCube, [0.5, 0.5, 0.5]), 1) // in the solid
near(windingNumber(hollowCube, [1.5, 1.5, 1.5]), 0) // in the void
near(windingNumber(hollowCube, [4, 4, 4]), 0)       // outside
near(volume(hollowCube), 26)
console.log('winding numbers 1 / 0 / 0, volume 26')
