# @types/super-geojson

This package is the type definition for the hyperdimensional extension of GeoJSON.

## Usage

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

### Polytope5

```typescript
const polytope4_1: SuperGeoJSON.Polytope4 = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
const polytope4_2: SuperGeoJSON.Polytope4 = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
const polytope4_3: SuperGeoJSON.Polytope4 = {
  type: 'Polytope4',
  coordnates: [[[[[...], ...]]]],
}
...
const polytope5: SuperGeoJSON.Polytope5 = {
  type: 'Polytope5',
  coordiates: [polytope4_1, polytope4_2, polytope4_3, ...].map(polytope => polytope.coordinates)
}
```
