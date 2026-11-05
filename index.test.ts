import type HyperGeoJSON from './index.d.ts'
import { test } from 'node:test'
import assert from 'node:assert'

test('should define a hyper feature collection', () => {
  const fc: HyperGeoJSON.HyperFeatureCollection = {
    type: 'HyperFeatureCollection',
    features: [],
  }
  assert.equal(fc.type, 'HyperFeatureCollection')
})

test('should define a polyhedron', () => {
  const polygon1: HyperGeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0, 0, 1], [0, 0, 0, 2], [0, 0, 0, 3], [0, 0, 0, 1]]],
  }
  const polygon2: HyperGeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[0, 0, 1, 0], [0, 0, 2, 0], [0, 0, 3, 0], [0, 0, 1, 0]]],
  }
  const polygon3: HyperGeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[0, 1, 0, 0], [0, 2, 0, 0], [0, 3, 0, 0], [0, 1, 0, 0]]],
  }
  const polygon4: HyperGeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[1, 0, 0, 0], [2, 0, 0, 0], [3, 0, 0, 0], [1, 0, 0, 0]]],
  }

  const polyhedron: HyperGeoJSON.Polyhedron = {
    type: 'Polyhedron',
    coordinates: [polygon1, polygon2, polygon3, polygon4].map(polygon => polygon.coordinates),
  }
  const feature: HyperGeoJSON.HyperFeature<HyperGeoJSON.Polyhedron> = {
    type: 'HyperFeature',
    properties: null,
    geometry: polyhedron,
  }
  assert.equal(feature.type, 'HyperFeature')
  assert.equal(feature.geometry.type, 'Polyhedron')
})

test('can define a polytope', () => {
  const feature: HyperGeoJSON.HyperFeature<HyperGeoJSON.Polytope> = {
    type: 'HyperFeature',
    properties: null,
    geometry: {
      type: 'Polytope4',
      coordinates: [[[[[0, 0, 0], [1, 0, 0], [1, 1, 0]]]]]
    }
  }
  assert.equal(feature.type, 'HyperFeature')
  assert.equal(feature.geometry.type, 'Polytope4')
})

test('can define a multi polyhedron', () => {
  const feature: HyperGeoJSON.HyperFeature<HyperGeoJSON.MultiPolyhedron> = {
    type: 'HyperFeature',
    properties: null,
    geometry: {
      type: 'MultiPolyhedron',
      coordinates: [[[[[0, 0, 0], [1, 0, 0], [1, 1, 0]]]]]
    }
  }
  assert.equal(feature.type, 'HyperFeature')
  assert.equal(feature.geometry.type, 'MultiPolyhedron')
})

test('can define hyper polytope', () => {
  const polytope8: HyperGeoJSON.Polytope<8> = {
    type: 'Polytope8',
    coordinates: [[[[[[[[[0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0]]]]]]]]]
  }
  assert.equal(polytope8.type, 'Polytope8')
})

test('can define polytopes beyond 11 dimensions', () => {
  const polytope12: HyperGeoJSON.Polytope<12> = {
    type: 'Polytope12',
    coordinates: [[[[[[[[[[[[[0, 0]]]]]]]]]]]]],
  }
  const multiPolytope12: HyperGeoJSON.MultiPolytope<12> = {
    type: 'MultiPolytope12',
    coordinates: [[[[[[[[[[[[[[0, 0]]]]]]]]]]]]]],
  }
  assert.equal(polytope12.type, 'Polytope12')
  assert.equal(multiPolytope12.type, 'MultiPolytope12')
})

test('rejects coordinates nested at the wrong depth', () => {
  const polytope12: HyperGeoJSON.Polytope<12> = {
    type: 'Polytope12',
    // @ts-expect-error 11 levels instead of 12
    coordinates: [[[[[[[[[[[[0, 0]]]]]]]]]]]],
  }
  assert.equal(polytope12.type, 'Polytope12')
})

test('rejects dimensions that are not non-negative integer literals', () => {
  // @ts-expect-error `number` itself is not a literal dimension
  const any: HyperGeoJSON.Polytope<number> = { type: 'Polytope4', coordinates: [] }
  // @ts-expect-error negative dimension
  const negative: HyperGeoJSON.Polytope<-1> = { type: 'Polytope-1', coordinates: [] }
  // @ts-expect-error fractional dimension
  const fractional: HyperGeoJSON.Polytope<1.5> = { type: 'Polytope1.5', coordinates: [] }
  assert.ok(any && negative && fractional)
})

test('can define a cube', () => {
  const cube: HyperGeoJSON.Polyhedron = {
    type: 'Polyhedron',
    coordinates: [
      [[[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]],
      [[[0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]]],
      [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]]],
      [[[1, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1]]],
      [[[1, 1, 1], [1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]]],
      [[[1, 1, 1], [0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1]]],
    ],
  }
  assert.equal(cube.type, 'Polyhedron')
})

test('can define a tesseract', () => {
  const tesseract: HyperGeoJSON.Polychoron = {
    type: 'Polychoron',
    coordinates: [
      [
        [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]],
        [[[0, 1, 1, 1], [0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 1], [0, 1, 1, 1]]],
        [[[0, 1, 1, 1], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 1, 1, 1]]],
        [[[0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 1, 1]]],
      ],
      [
        [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 0, 1], [1, 0, 0, 1], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[1, 0, 1, 1], [1, 0, 1, 0], [1, 0, 0, 0], [1, 0, 0, 1], [1, 0, 1, 1]]],
        [[[1, 0, 1, 1], [1, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [1, 0, 1, 1]]],
        [[[1, 0, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1], [1, 0, 1, 1]]],
      ],
      [
        [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 0, 1], [1, 0, 0, 1], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[1, 1, 0, 1], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 1], [1, 1, 0, 1]]],
        [[[1, 1, 0, 1], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 1], [1, 1, 0, 1]]],
        [[[1, 1, 0, 1], [0, 1, 0, 1], [0, 0, 0, 1], [1, 0, 0, 1], [1, 1, 0, 1]]],
      ],
      [
        [[[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
        [[[1, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0]]],
        [[[1, 1, 1, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [1, 1, 1, 0]]],
        [[[1, 1, 1, 0], [0, 1, 1, 0], [0, 0, 1, 0], [1, 0, 1, 0], [1, 1, 1, 0]]],
      ],
      [
        [[[1, 0, 0, 0], [1, 0, 0, 1], [1, 0, 1, 1], [1, 0, 1, 0], [1, 0, 0, 0]]],
        [[[1, 0, 0, 0], [1, 0, 0, 1], [1, 1, 0, 1], [1, 1, 0, 0], [1, 0, 0, 0]]],
        [[[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [1, 0, 1, 1], [1, 0, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]]],
      ],
      [
        [[[0, 1, 0, 0], [0, 1, 0, 1], [0, 1, 1, 1], [0, 1, 1, 0], [0, 1, 0, 0]]],
        [[[0, 1, 0, 0], [0, 1, 0, 1], [1, 1, 0, 1], [1, 1, 0, 0], [0, 1, 0, 0]]],
        [[[0, 1, 0, 0], [0, 1, 1, 0], [1, 1, 1, 0], [1, 1, 0, 0], [0, 1, 0, 0]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 1, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]]],
      ],
      [
        [[[0, 0, 1, 0], [0, 0, 1, 1], [0, 1, 1, 1], [0, 1, 1, 0], [0, 0, 1, 0]]],
        [[[0, 0, 1, 0], [0, 0, 1, 1], [1, 0, 1, 1], [1, 0, 1, 0], [0, 0, 1, 0]]],
        [[[0, 0, 1, 0], [0, 1, 1, 0], [1, 1, 1, 0], [1, 0, 1, 0], [0, 0, 1, 0]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [1, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1], [1, 0, 1, 1], [1, 1, 1, 1]]],
      ],
      [
        [[[0, 0, 0, 1], [0, 0, 1, 1], [0, 1, 1, 1], [0, 1, 0, 1], [0, 0, 0, 1]]],
        [[[0, 0, 0, 1], [0, 0, 1, 1], [1, 0, 1, 1], [1, 0, 0, 1], [0, 0, 0, 1]]],
        [[[0, 0, 0, 1], [0, 1, 0, 1], [1, 1, 0, 1], [1, 0, 0, 1], [0, 0, 0, 1]]],
        [[[1, 1, 1, 1], [1, 1, 0, 1], [1, 0, 0, 1], [1, 0, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [1, 1, 0, 1], [0, 1, 0, 1], [0, 1, 1, 1], [1, 1, 1, 1]]],
        [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1], [1, 0, 1, 1], [1, 1, 1, 1]]],
      ],
    ],
  }
  assert.equal(tesseract.type, 'Polychoron')
})
