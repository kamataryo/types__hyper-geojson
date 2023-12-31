# @types/hyper-geojson

This project is an experimental TypeScript typedef for thinking about defining hyper-dimensional GeoJSON (HyperGeoJSON).

### Cube

```typescript
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
```

### Tesseract

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Hypercubecentral.svg/2560px-Hypercubecentral.svg.png" width="300">

```typescript
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
```
