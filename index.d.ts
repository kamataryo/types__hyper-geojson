import type GeoJSON from 'geojson'

export as namespace SuperGeoJSON

export type SuperGeoJsonGeometryTypes = SuperGeometry["type"];
export type SuperGeoJsonTypes = SuperGeoJSON["type"];
export type SuperPosition = GeoJSON.Position;

export interface SuperGeoJsonObject {
  type: SuperGeoJsonTypes,
  bbox?: GeoJSON.BBox | undefined,
}
export type SuperGeoJSON = SuperGeometry | SuperFeature | SuperFeatureCollection
export type SuperGeometry = GeoJSON.Geometry | Polyhedron | MultiPolyhedron | Polytope | MultiPolytope
export type SuperGeometryObject = SuperGeometry

export interface Point extends GeoJSON.Point {
  type: 'Point' | 'Polytope0',
  coordinates: SuperPosition,
}
export interface MultiPoint extends GeoJSON.MultiPoint {
  type: 'MultiPoint' | 'MultiPolytope1',
  coordinates: SuperPosition[],
}
export interface LineString extends GeoJSON.LineString {
  type: 'LineString' | 'Polytope1',
  coordinates: SuperPosition[],
}
export interface MultiLineString extends GeoJSON.MultiLineString {
  type: 'MultiLineString' | 'MultiPolytope2',
  coordinates: SuperPosition[][],
}
export interface Polygon extends GeoJSON.Polygon {
  type: 'Polygon' | 'Polytope2',
  coordinates: SuperPosition[][],
}
export interface MultiPolygon extends GeoJSON.MultiPolygon {
  type: 'MultiPolygon' | 'MultiPolytope3',
  coordinates: SuperPosition[][][],
}

export interface Polyhedron extends SuperGeoJsonObject {
  type: 'Polyhedron' | 'Polytope3',
  coordinates: SuperPosition[][][],
}

export interface MultiPolyhedron extends SuperGeoJsonObject {
  type: 'MultiPolyhedron' | 'Polytope3',
  coordinates: SuperPosition[][][][],
}

export interface Polychoron extends SuperGeoJsonObject {
  type: 'Polychoron' | 'Polytope4',
  coordinates: SuperPosition[][][][],
}

export interface MultiPolychoron extends SuperGeoJsonObject {
  type: 'MultiPolychoron' | 'MultiPolytope4',
  coordinates: SuperPosition[][][][][],
}

export interface Polytope<N extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 = 4> extends SuperGeoJsonObject {
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

export interface MultiPolytope<N extends 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 = 4> extends SuperGeoJsonObject {
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

export interface SuperGeometryCollection<G extends SuperGeometry = SuperGeometry> extends GeoJSOnObject {
  type: 'SuperGeometryCollection',
  geometries: G[],
}

export type SuperGeoJsonProperties = GeoJSON.Properties

export interface SuperFeature<G extends SuperGeometry | null = SuperGeometry, P = SuperGeoJsonProperties> extends SuperGeoJsonObject {
  type: 'SuperFeature',
  geometry: G,
  id?: GeoJSON.Feature['id'],
  properties: P,
}

export interface SuperFeatureCollection<G extends SuperGeometry | null = SuperGeometry, P = SuperGeoJsonProperties> extends SuperGeoJsonObject {
  type: 'SuperFeatureCollection',
  features: Array<SuperFeature<G, P>>
}
