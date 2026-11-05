import type * as GeoJSON from 'geojson'

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

/**
 * Dimension of a polytope: a non-negative integer literal (0, 1, 2, ...), with no upper bound.
 * `number` itself means "any dimension": the type name is `Polytope${number}` and
 * the nesting depth of the coordinates is not checked.
 * A Polytope given a negative number or a fraction gets `never`
 * as its `type` and `coordinates`, so it cannot be constructed.
 */
export type Dimension = number

/**
 * Wraps T in N levels of arrays (`Nest<T, 0>` is T, `Nest<T, 2>` is T[][]).
 * `Nest<T, number>` is T nested any number of levels. A union N is expanded member by member.
 * Requires TypeScript 4.5+ (tail-recursive conditional types); works up to about 1000 levels.
 */
export type Nest<T, N extends Dimension> =
  N extends number
    ? IsValidDimension<N> extends true
      ? number extends N ? NestAnyDepth<T> : NestLoop<T, N, []>
      : never
    : never

export type NestAnyDepth<T> = T | NestAnyDepth<T>[]

type NestLoop<T, N extends number, Acc extends unknown[]> =
  Acc['length'] extends N ? T : NestLoop<T[], N, [...Acc, unknown]>

// `number` itself or a non-negative integer literal
type IsValidDimension<N extends number> =
  number extends N ? true :
  `${N}` extends `-${string}` | `${string}.${string}` | `${string}e${string}` ? false :
  true

export type HyperGeoJSON = HyperGeometry | HyperFeature | HyperFeatureCollection
// With the default N (`number`), polytopes of any dimension are accepted, with the depth unchecked.
// Pass a literal N (e.g. HyperGeometry<8>) to check the depth of that dimension exactly.
export type HyperGeometry<N extends Dimension = Dimension> = GeoJSON.Geometry |
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

// Dimensions 0-4 keep their named geometry types; higher ones are named `Polytope${N}`
interface PolytopeTypeNames {
  0: Point['type'],
  1: LineString['type'],
  2: Polygon['type'],
  3: Polyhedron['type'],
  4: Polychoron['type'],
}

interface MultiPolytopeTypeNames {
  0: MultiPoint['type'],
  1: MultiLineString['type'],
  2: MultiPolygon['type'],
  3: MultiPolyhedron['type'],
  4: MultiPolychoron['type'],
}

type PolytopeTypeName<N extends Dimension> =
  N extends number
    ? IsValidDimension<N> extends true
      ? N extends keyof PolytopeTypeNames ? PolytopeTypeNames[N] : `Polytope${N}`
      : never
    : never

type MultiPolytopeTypeName<N extends Dimension> =
  N extends number
    ? IsValidDimension<N> extends true
      ? N extends keyof MultiPolytopeTypeNames ? MultiPolytopeTypeNames[N] : `MultiPolytope${N}`
      : never
    : never

// An N-polytope nests positions N levels deep (Point: 0, LineString: 1, Polygon: 2, ...)
export interface Polytope<N extends Dimension = 4> extends HyperGeoJsonObject {
  type: PolytopeTypeName<N>,
  coordinates: Nest<HyperPosition, N>,
}

// A collection of N-polytopes nests one level deeper
export interface MultiPolytope<N extends Dimension = 4> extends HyperGeoJsonObject {
  type: MultiPolytopeTypeName<N>,
  coordinates: Nest<HyperPosition[], N>,
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
