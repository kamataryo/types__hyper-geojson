# @types/super-geojson

This package is the type definition for the hyperdimensional extension of GeoJSON.

## Examples

### Polyhedron (n = 4)

```typescript
import type SuperGeoJSON from 'super-geojson'

const polygon1: SuperGeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[0, 0, 0, 1], [0, 0, 0, 2], [0, 0, 0, 3], [0, 0, 0, 1]]],
}
const polygon2: SuperGeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[0, 0, 1, 0], [0, 0, 2, 0], [0, 0, 3, 0], [0, 0, 1, 0]]],
}
const polygon3: SuperGeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[0, 1, 0, 0], [0, 2, 0, 0], [0, 3, 0, 0], [0, 1, 0, 0]]],
}
const polygon4: SuperGeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [[[1, 0, 0, 0], [2, 0, 0, 0], [3, 0, 0, 0], [1, 0, 0, 0]]],
}

const polyhedron: SuperGeoJSON.Polyhedron = {
  type: 'Polyhedron',
  coordinates: [polygon1, polygon2, polygon3, polygon4].map(polygon => polygon.coordinates),
}
const feature: SuperGeoJSON.SuperFeature<SuperGeoJSON.Polyhedron> = {
  type: 'SuperFeature',
  properties: null,
  geometry: polyhedron,
}
```

### Polytope5 (n = 5)

```typescript
const polytope4_1: SuperGeoJSON.Polytope<4> = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
const polytope4_2: SuperGeoJSON.Polytope<4> = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
const polytope4_3: SuperGeoJSON.Polytope<4> = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
...
const polytope5: SuperGeoJSON.Polytope<5> = {
  type: 'Polytope5',
  coordiates: [polytope4_1, polytope4_2, polytope4_3, ...].map(polytope => polytope.coordinates)
}
```

## all types

- `SuperGeoJSON.Point` = `SuperGeoJSON.Polytope<1>`
- `SuperGeoJSON.LineString` = `SuperGeoJSON.Polytope<2>`
- `SuperGeoJSON.Polygon` = `SuperGeoJSON.Polytope<3>`
- `SuperGeoJSON.Polyhedron` = `SuperGeoJSON.Polytope<4>`
- `SuperGeoJSON.Polytope<5>`
- `SuperGeoJSON.Polytope<6>`
- `SuperGeoJSON.Polytope<7>`
- `SuperGeoJSON.Polytope<8>`
- `SuperGeoJSON.Polytope<9>`
- `SuperGeoJSON.Polytope<10>`
- `SuperGeoJSON.Polytope<11>`
- `SuperGeoJSON.MultiPoint` = `SuperGeoJSON.MultiPolytope<1>`
- `SuperGeoJSON.MultiLineString` = `SuperGeoJSON.MultiPolytope<2>`
- `SuperGeoJSON.MultiPolygon` = `SuperGeoJSON.MultiPolytope<3>`
- `SuperGeoJSON.MultiPolyhedron` = `SuperGeoJSON.MultiPolytope<4>`
- `SuperGeoJSON.MultiPolytope<5>`
- `SuperGeoJSON.MultiPolytope<6>`
- `SuperGeoJSON.MultiPolytope<7>`
- `SuperGeoJSON.MultiPolytope<8>`
- `SuperGeoJSON.MultiPolytope<9>`
- `SuperGeoJSON.MultiPolytope<10>`
- `SuperGeoJSON.MultiPolytope<11>`
