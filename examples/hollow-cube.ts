// 中空の立方体：一辺 3 の立方体 [0,3]^3 の中心に、一辺 1 の空洞 [1,2]^3 がある
// 実体の体積は 27 - 1 = 26
//
// 向きの約束（CityJSON などと同じ）：
//   - 各面のリングは右手の法則で、法線が「実体の外側」を向くように並べる
//   - 外殻の法線は外向き、空洞を囲む内殻の法線は空洞の中心を向く

import type HyperGeoJSON from '../index.d.ts'
import assert from 'node:assert'

type Position = HyperGeoJSON.HyperPosition
type Face = Position[][] // = Polygon の coordinates（外周リング + 穴）
type Shell = Face[]      // 閉じた曲面 = 面の集まり

const outerShell: Shell = [
  [[[0, 0, 3], [0, 3, 3], [0, 3, 0], [0, 0, 0], [0, 0, 3]]], // x = 0
  [[[3, 0, 0], [3, 3, 0], [3, 3, 3], [3, 0, 3], [3, 0, 0]]], // x = 3
  [[[3, 0, 0], [3, 0, 3], [0, 0, 3], [0, 0, 0], [3, 0, 0]]], // y = 0
  [[[0, 3, 0], [0, 3, 3], [3, 3, 3], [3, 3, 0], [0, 3, 0]]], // y = 3
  [[[0, 3, 0], [3, 3, 0], [3, 0, 0], [0, 0, 0], [0, 3, 0]]], // z = 0
  [[[0, 0, 3], [3, 0, 3], [3, 3, 3], [0, 3, 3], [0, 0, 3]]], // z = 3
]

const innerShell: Shell = [
  [[[1, 1, 1], [1, 2, 1], [1, 2, 2], [1, 1, 2], [1, 1, 1]]], // x = 1
  [[[2, 1, 2], [2, 2, 2], [2, 2, 1], [2, 1, 1], [2, 1, 2]]], // x = 2
  [[[1, 1, 1], [1, 1, 2], [2, 1, 2], [2, 1, 1], [1, 1, 1]]], // y = 1
  [[[2, 2, 1], [2, 2, 2], [1, 2, 2], [1, 2, 1], [2, 2, 1]]], // y = 2
  [[[1, 1, 1], [2, 1, 1], [2, 2, 1], [1, 2, 1], [1, 1, 1]]], // z = 1
  [[[1, 2, 2], [2, 2, 2], [2, 1, 2], [1, 1, 2], [1, 2, 2]]], // z = 2
]

// ---------------------------------------------------------------------------
// 案 A：今の型（Polyhedron = 面の配列）に 12 面をそのまま並べる
//   型は通る。ただし「どの面がどの殻に属するか」はデータに書かれていない。
//   読む側が面のつながりと向きから推測するしかない。
// ---------------------------------------------------------------------------
export const hollowCubeA: HyperGeoJSON.Polyhedron = {
  type: 'Polyhedron',
  coordinates: [...outerShell, ...innerShell],
}

// ---------------------------------------------------------------------------
// 案 B：殻（shell）の段を 1 つ足す
//   Polygon が [外周リング, ...穴のリング] であるのと同じ形で、
//   [外殻, ...空洞の殻] と並べる。
// ---------------------------------------------------------------------------
// ※ HyperGeoJsonObject の type は既存の型名の union に固定されていて継承できないので、bbox を直接書く
export interface Solid {
  type: 'Solid',
  bbox?: HyperGeoJSON.HyperBBox,
  coordinates: Shell[], // = Position[][][][]
}

export const hollowCubeB: Solid = {
  type: 'Solid',
  coordinates: [outerShell, innerShell],
}

// ---------------------------------------------------------------------------
// 検算：発散定理による符号付き体積。向きが正しければ外殻は +27、内殻は -1 になる
// ---------------------------------------------------------------------------
function signedVolume(shell: Shell): number {
  let v = 0
  for (const [ring] of shell) {
    const a = ring[0]
    for (let i = 1; i < ring.length - 2; i++) {
      const b = ring[i], c = ring[i + 1]
      v += a[0] * (b[1] * c[2] - b[2] * c[1])
         - a[1] * (b[0] * c[2] - b[2] * c[0])
         + a[2] * (b[0] * c[1] - b[1] * c[0])
    }
  }
  return v / 6
}

const volumes = hollowCubeB.coordinates.map(signedVolume)
assert.deepStrictEqual(volumes, [27, -1])
assert.strictEqual(volumes.reduce((s, x) => s + x, 0), 26)
console.log('shell volumes:', volumes, '=> solid volume:', 26)
