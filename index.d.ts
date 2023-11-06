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

export type Point = GeoJSON.Point
export type MultiPoint = GeoJSON.MultiPoint
export type LineString = GeoJSON.LineString
export type MultiLineString = GeoJSON.MultiLineString
export type Polygon = GeoJSON.Polygon
export type MultiPolygon = GeoJSON.MultiPolygon

export interface Polyhedron extends SuperGeoJsonObject {
  type: 'Polyhedron',
  coordinates: SuperPosition[][][],
}

export interface MultiPolyhedron extends SuperGeoJsonObject {
  type: 'MultiPolyhedron',
  coordinates: SuperPosition[][][][],
}

export interface Polytope<N extends 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 = 4> extends SuperGeoJsonObject {
  type:
    N extends 1 ? 'Point' | 'Polytope1' :
    N extends 2 ? 'LineString' | 'Polytope2' :
    N extends 3 ? 'Polygon' | 'Polytope3' :
    N extends 4 ? 'Polyhedron' | 'Polytope4' :
    N extends 5 ? 'Polytope5' :
    N extends 6 ? 'Polytope6' :
    N extends 7 ? 'Polytope7' :
    N extends 8 ? 'Polytope8' :
    N extends 9 ? 'Polytope9' :
    N extends 10 ? 'Polytope10' :
    N extends 11 ? 'Polytope11' : never,
  coordinates:
    N extends 1 ? SuperPosition :
    N extends 2 ? SuperPosition[] :
    N extends 3 ? SuperPosition[][] :
    N extends 4 ? SuperPosition[][][] :
    N extends 5 ? SuperPosition[][][][] :
    N extends 6 ? SuperPosition[][][][][] :
    N extends 7 ? SuperPosition[][][][][][] :
    N extends 8 ? SuperPosition[][][][][][][] :
    N extends 9 ? SuperPosition[][][][][][][][] :
    N extends 10 ? SuperPosition[][][][][][][][][] :
    N extends 11 ? SuperPosition[][][][][][][][][][] : never,
}

export interface MultiPolytope<N extends 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 = 4> extends SuperGeoJsonObject {
  type:
    N extends 1 ? 'MultiPoint' | 'MultiPolytope1' :
    N extends 2 ? 'MultiLineString' | 'MultiPolytope2' :
    N extends 3 ? 'MultiPolygon' | 'MultiPolytope3' :
    N extends 4 ? 'MultiPolyhedron' | 'MultiPolytope4' :
    N extends 5 ? 'MultiPolytope5' :
    N extends 6 ? 'MultiPolytope6' :
    N extends 7 ? 'MultiPolytope7' :
    N extends 8 ? 'MultiPolytope8' :
    N extends 9 ? 'MultiPolytope9' :
    N extends 10 ? 'MultiPolytope10' :
    N extends 11 ? 'MultiPolytope11' : never,
  coordinates:
    N extends 1 ? SuperPosition[] :
    N extends 2 ? SuperPosition[][] :
    N extends 3 ? SuperPosition[][][] :
    N extends 4 ? SuperPosition[][][][] :
    N extends 5 ? SuperPosition[][][][][] :
    N extends 6 ? SuperPosition[][][][][][] :
    N extends 7 ? SuperPosition[][][][][][][] :
    N extends 8 ? SuperPosition[][][][][][][][] :
    N extends 9 ? SuperPosition[][][][][][][][][] :
    N extends 10 ? SuperPosition[][][][][][][][][][] :
    N extends 11 ? SuperPosition[][][][][][][][][][][] : never,
}

export interface SuperGeometryCollection<G extends SuperGeometry = SuperGeometry> extends GeoJSOnObject {
  type: "SuperGeometryCollection",
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
