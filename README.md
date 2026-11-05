# @types/hyper-geojson

This project is an experimental TypeScript typedef for thinking about defining hyper-dimensional GeoJSON (HyperGeoJSON).

### Orientation

Every boundary faces away from what it bounds. This is GeoJSON's right-hand rule, carried to every dimension:

- A polygon's exterior ring runs counterclockwise, and its holes run clockwise.
- A polyhedron's faces, by the right-hand rule, turn their normals away from the solid, and so into any void inside it.
- A polychoron's cells face away from it in the same way.

So the two neighbours of every shared boundary traverse it in opposite directions: each edge of a polyhedron by two faces, each face of a polychoron by two cells. A point's winding number is then 1 inside the solid, and 0 outside it or in a void.

A void needs no nesting level of its own: it is a boundary that faces the other way. The types check only the nesting depth, so a twisted or open boundary still type-checks, just as an open ring does in GeoJSON.

### Cube

```typescript
const cube: HyperGeoJSON.Polyhedron = {
  type: 'Polyhedron',
  coordinates: [
    [[[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]],
    [[[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 0, 0]]],
    [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]]],
    [[[1, 1, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]]],
    [[[1, 1, 1], [1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]]],
    [[[1, 1, 1], [0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1]]],
  ],
}
```

### Tesseract

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Hypercubecentral.svg/2560px-Hypercubecentral.svg.png" width="300">

```typescript
const tesseract: HyperGeoJSON.Polychoron = {
  type: 'Polychoron',
  coordinates: [
    [
      [[[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 0, 0], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]]],
      [[[0, 1, 1, 1], [0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 1], [0, 1, 1, 1]]],
      [[[0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 1, 1]]],
      [[[0, 1, 1, 1], [0, 1, 0, 1], [0, 0, 0, 1], [0, 0, 1, 1], [0, 1, 1, 1]]],
    ],
    [
      [[[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [0, 0, 1, 0], [1, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
      [[[1, 0, 1, 1], [1, 0, 0, 1], [1, 0, 0, 0], [1, 0, 1, 0], [1, 0, 1, 1]]],
      [[[1, 0, 1, 1], [1, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [1, 0, 1, 1]]],
      [[[1, 0, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1], [1, 0, 1, 1]]],
    ],
    [
      [[[0, 0, 0, 0], [0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 1], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [0, 0, 0, 1], [1, 0, 0, 1], [1, 0, 0, 0], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]],
      [[[1, 1, 0, 1], [1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 1], [1, 1, 0, 1]]],
      [[[1, 1, 0, 1], [0, 1, 0, 1], [0, 1, 0, 0], [1, 1, 0, 0], [1, 1, 0, 1]]],
      [[[1, 1, 0, 1], [1, 0, 0, 1], [0, 0, 0, 1], [0, 1, 0, 1], [1, 1, 0, 1]]],
    ],
    [
      [[[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [1, 0, 0, 0], [1, 0, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]]],
      [[[0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]],
      [[[1, 1, 1, 0], [1, 0, 1, 0], [1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0]]],
      [[[1, 1, 1, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [1, 1, 1, 0]]],
      [[[1, 1, 1, 0], [0, 1, 1, 0], [0, 0, 1, 0], [1, 0, 1, 0], [1, 1, 1, 0]]],
    ],
    [
      [[[1, 0, 0, 0], [1, 0, 0, 1], [1, 0, 1, 1], [1, 0, 1, 0], [1, 0, 0, 0]]],
      [[[1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 0, 0, 1], [1, 0, 0, 0]]],
      [[[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0]]],
      [[[1, 1, 1, 1], [1, 1, 0, 1], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [1, 0, 1, 1], [1, 0, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]]],
    ],
    [
      [[[0, 1, 0, 0], [0, 1, 1, 0], [0, 1, 1, 1], [0, 1, 0, 1], [0, 1, 0, 0]]],
      [[[0, 1, 0, 0], [0, 1, 0, 1], [1, 1, 0, 1], [1, 1, 0, 0], [0, 1, 0, 0]]],
      [[[0, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0]]],
      [[[1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 1, 1, 0], [1, 1, 1, 0], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [1, 1, 0, 1], [0, 1, 0, 1], [0, 1, 1, 1], [1, 1, 1, 1]]],
    ],
    [
      [[[0, 0, 1, 0], [0, 0, 1, 1], [0, 1, 1, 1], [0, 1, 1, 0], [0, 0, 1, 0]]],
      [[[0, 0, 1, 0], [1, 0, 1, 0], [1, 0, 1, 1], [0, 0, 1, 1], [0, 0, 1, 0]]],
      [[[0, 0, 1, 0], [0, 1, 1, 0], [1, 1, 1, 0], [1, 0, 1, 0], [0, 0, 1, 0]]],
      [[[1, 1, 1, 1], [1, 0, 1, 1], [1, 0, 1, 0], [1, 1, 1, 0], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [1, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 1], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1], [1, 0, 1, 1], [1, 1, 1, 1]]],
    ],
    [
      [[[0, 0, 0, 1], [0, 1, 0, 1], [0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1]]],
      [[[0, 0, 0, 1], [0, 0, 1, 1], [1, 0, 1, 1], [1, 0, 0, 1], [0, 0, 0, 1]]],
      [[[0, 0, 0, 1], [1, 0, 0, 1], [1, 1, 0, 1], [0, 1, 0, 1], [0, 0, 0, 1]]],
      [[[1, 1, 1, 1], [1, 1, 0, 1], [1, 0, 0, 1], [1, 0, 1, 1], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [0, 1, 1, 1], [0, 1, 0, 1], [1, 1, 0, 1], [1, 1, 1, 1]]],
      [[[1, 1, 1, 1], [1, 0, 1, 1], [0, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 1]]],
    ],
  ],
}
```

### Any dimension

`Polytope<N>` and `MultiPolytope<N>` accept any non-negative integer `N`. Coordinates are nested `N` levels deep (`N + 1` for `MultiPolytope`), and the type is named `Polytope${N}`. Dimensions 0 to 4 also accept their named types (`Point`, `LineString`, `Polygon`, `Polyhedron`, `Polychoron`).

```typescript
const polytope12: HyperGeoJSON.Polytope<12> = {
  type: 'Polytope12',
  coordinates: [[[[[[[[[[[[[0, 0]]]]]]]]]]]]],
}
```

Features accept polytopes of any dimension. By default, `HyperGeometry` (and so `HyperFeature` and `HyperFeatureCollection`) checks only that a `Polytope${N}` holds positions nested to some depth. Name the dimension to check the depth exactly:

```typescript
const feature: HyperGeoJSON.HyperFeature<HyperGeoJSON.Polytope<8>> = {
  type: 'HyperFeature',
  properties: null,
  geometry: { type: 'Polytope8', coordinates: [[[[[[[[[0, 0]]]]]]]]] },
}
```

This relies on recursive conditional types and needs TypeScript 4.5 or later.
