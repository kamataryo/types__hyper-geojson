import type GeoJSON from 'geojson'

export as namespace HyperGeoJSON

export type HyperGeoJsonGeometryTypes = HyperGeometry["type"];
export type HyperGeoJsonTypes = HyperGeoJSON["type"];
export type HyperBBox =
  [number, number, number, number] |
  [number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] |
  [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]

export type HyperPosition = GeoJSON.Position;

export interface HyperGeoJsonObject {
  type: HyperGeoJsonTypes,
  bbox?: HyperBBox | undefined,
}

export type Dimension = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export type HyperGeoJSON = HyperGeometry | HyperFeature | HyperFeatureCollection
export type HyperGeometry<N extends Dimension = 4> = GeoJSON.Geometry |
  Polyhedron |
  MultiPolyhedron |
  Polychoron |
  MultiPolychoron |
  Polytope<N> |
  MultiPolytope<N>
export type HyperGeometryObject = HyperGeometry

export interface Point extends GeoJSON.Point {
  type: 'Point' | 'Polytope0',
  coordinates: HyperPosition,
}
export interface MultiPoint extends GeoJSON.MultiPoint {
  type: 'MultiPoint' | 'MultiPolytope1',
  coordinates: HyperPosition[],
}
export interface LineString extends GeoJSON.LineString {
  type: 'LineString' | 'Polytope1',
  coordinates: HyperPosition[],
}
export interface MultiLineString extends GeoJSON.MultiLineString {
  type: 'MultiLineString' | 'MultiPolytope2',
  coordinates: HyperPosition[][],
}
export interface Polygon extends GeoJSON.Polygon {
  type: 'Polygon' | 'Polytope2',
  coordinates: HyperPosition[][],
}
export interface MultiPolygon extends GeoJSON.MultiPolygon {
  type: 'MultiPolygon' | 'MultiPolytope3',
  coordinates: HyperPosition[][][],
}

export interface Polyhedron extends HyperGeoJsonObject {
  type: 'Polyhedron' | 'Polytope3',
  coordinates: HyperPosition[][][],
}

export interface MultiPolyhedron extends HyperGeoJsonObject {
  type: 'MultiPolyhedron' | 'Polytope3',
  coordinates: HyperPosition[][][][],
}

export interface Polychoron extends HyperGeoJsonObject {
  type: 'Polychoron' | 'Polytope4',
  coordinates: HyperPosition[][][][],
}

export interface MultiPolychoron extends HyperGeoJsonObject {
  type: 'MultiPolychoron' | 'MultiPolytope4',
  coordinates: HyperPosition[][][][][],
}

export interface Polytope<N extends Dimension = 4> extends HyperGeoJsonObject {
  type:
    N extends 0 ? Point['type'] :
    N extends 1 ? LineString['type'] :
    N extends 2 ? Polygon['type'] :
    N extends 3 ? Polyhedron['type'] :
    N extends 4 ? Polychoron['type'] :
    N extends 5 ? 'Polytope5' :
    N extends 6 ? 'Polytope6' :
    N extends 7 ? 'Polytope7' :
    N extends 8 ? 'Polytope8' :
    N extends 9 ? 'Polytope9' :
    N extends 10 ? 'Polytope10' :
    N extends 11 ? 'Polytope11' : never,
  coordinates:
    N extends 0 ? Point['coordinates'] :
    N extends 1 ? LineString['coordinates'] :
    N extends 2 ? Polygon['coordinates'] :
    N extends 3 ? Polyhedron['coordinates'] :
    N extends 4 ? Polychoron['coordinates'] :
    N extends 5 ? Polychoron['coordinates'][] :
    N extends 6 ? Polychoron['coordinates'][][] :
    N extends 7 ? Polychoron['coordinates'][][][] :
    N extends 8 ? Polychoron['coordinates'][][][][] :
    N extends 9 ? Polychoron['coordinates'][][][][][] :
    N extends 10 ? Polychoron['coordinates'][][][][][][] :
    N extends 11 ? Polychoron['coordinates'][][][][][][][] : never,
}

export interface MultiPolytope<N extends Dimension = 4> extends HyperGeoJsonObject {
  type:
    N extends 0 ? MultiPoint['type'] :
    N extends 1 ? MultiLineString['type'] :
    N extends 2 ? MultiPolygon['type'] :
    N extends 3 ? MultiPolyhedron['type'] :
    N extends 4 ? MultiPolychoron['type'] :
    N extends 5 ? 'MultiPolytope5' :
    N extends 6 ? 'MultiPolytope6' :
    N extends 7 ? 'MultiPolytope7' :
    N extends 8 ? 'MultiPolytope8' :
    N extends 9 ? 'MultiPolytope9' :
    N extends 10 ? 'MultiPolytope10' :
    N extends 11 ? 'MultiPolytope11' : never,
  coordinates:
  N extends 0 ? MultiPoint['coordinates'] :
  N extends 1 ? MultiLineString['coordinates'] :
  N extends 2 ? MultiPolygon['coordinates'] :
  N extends 3 ? MultiPolyhedron['coordinates'] :
  N extends 4 ? MultiPolychoron['coordinates'] :
  N extends 5 ? MultiPolychoron['coordinates'][] :
  N extends 6 ? MultiPolychoron['coordinates'][][] :
  N extends 7 ? MultiPolychoron['coordinates'][][][] :
  N extends 8 ? MultiPolychoron['coordinates'][][][][] :
  N extends 9 ? MultiPolychoron['coordinates'][][][][][] :
  N extends 10 ? MultiPolychoron['coordinates'][][][][][][] :
  N extends 11 ? MultiPolychoron['coordinates'][][][][][][][] : never,
}

export interface HyperGeometryCollection<G extends HyperGeometry = HyperGeometry> extends GeoJSOnObject {
  type: 'HyperGeometryCollection',
  geometries: G[],
}

export type HyperGeoJsonProperties = GeoJSON.Properties

export interface HyperFeature<G extends HyperGeometry | null = HyperGeometry, P = HyperGeoJsonProperties> extends HyperGeoJsonObject {
  type: 'HyperFeature',
  geometry: G,
  id?: GeoJSON.Feature['id'],
  properties: P,
}

export interface HyperFeatureCollection<G extends HyperGeometry | null = HyperGeometry, P = HyperGeoJsonProperties> extends HyperGeoJsonObject {
  type: 'HyperFeatureCollection',
  features: Array<HyperFeature<G, P>>
}
