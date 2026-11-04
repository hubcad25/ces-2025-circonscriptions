import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { FeatureCollection, MultiPolygon } from "geojson";
import { HIGH, LOW } from "./questions";
import { useEffect, useRef } from "react";

// MapLibre fetches files from a web worker, where only absolute URLs resolve.
const dataUrl = (name: string) =>
  new URL(`${import.meta.env.BASE_URL}data/${name}`, window.location.href).href;

// MapLibre 6 ships its web worker as a separate file that the bundler must serve.
maplibregl.setWorkerUrl(workerUrl);

// Up to just north of Nunavik (62.6°N): further north, the Arctic fills the frame for a
// handful of ridings.
const BOUNDS: maplibregl.LngLatBoundsLike = [
  [-141, 41.6],
  [-52.6, 63],
];

const BACKGROUND = "#15171a";
const LOW_COLOR = "#eef0f2";
const FILTERED_OUT_COLOR = "#2a2d31";

// A minimal style: only city and town names come from OpenFreeMap (free vector tiles, no API
// key), so that zooming in does not bring roads, buildings or parks.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution: "OpenFreeMap © OpenMapTiles, data © OpenStreetMap contributors",
    },
  },
  layers: [{ id: "background", type: "background", paint: { "background-color": BACKGROUND } }],
};

type Located = { fed23: number; estimate_mean: number };

// A comparison with Canada is set for mean positions on an answer scale: the national mean
// and the answer labels, ranked from 1.
type Comparison = { national: number; scaleLabels: string[] };

type Props = { ridings: Located[]; color: string; comparison?: Comparison };

// Color stops are [position, color], with positions from 0 (low) to 1 (high).
type Stops = [number, string][];

type Scale = { low: number; high: number; stops: Stops };

// The middle is dark grey rather than white: on the dark background, ridings close to Canada
// recede and the ones that differ stand out.
const COMPARISON_MIDDLE = "#3d4248";

const COMPARISON_STOPS: Stops = [
  [0, LOW],
  [0.5, COMPARISON_MIDDLE],
  [1, HIGH],
];

// One extreme riding would otherwise push every other riding toward the middle color; the
// ridings beyond this share of gaps take the end colors.
const COMPARISON_PERCENTILE = 0.95;

function percentile(values: number[], share: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))];
}

// A share runs from the lowest to the highest riding, so that differences stand out even for
// a category that is low everywhere. A comparison is centered on Canada: the middle color at
// the national mean, blue below and orange above, the same width on both sides.
function colorScale({ ridings, color, comparison }: Props): Scale {
  const values = ridings.map((riding) => riding.estimate_mean);
  if (!comparison) {
    return {
      low: Math.min(...values),
      high: Math.max(...values),
      stops: [
        [0, LOW_COLOR],
        [1, color],
      ],
    };
  }
  const gaps = values.map((value) => Math.abs(value - comparison.national));
  const widest = percentile(gaps, COMPARISON_PERCENTILE);
  return {
    low: comparison.national - widest,
    high: comparison.national + widest,
    stops: COMPARISON_STOPS,
  };
}

function gradient(stops: Stops): string {
  const parts = stops.map(([position, stop]) => `${stop} ${100 * position}%`);
  return `linear-gradient(to top, ${parts.join(", ")})`;
}

const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;

function formatValue(value: number, comparison?: Comparison): string {
  if (!comparison) return `${(100 * value).toFixed(1)}%`;
  return `${value.toFixed(2)} (${signed(value - comparison.national)} vs Canada)`;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Ridings left out by the filters get no value.
function showEstimates(map: maplibregl.Map, props: Props) {
  const { ridings, comparison } = props;
  const { low, high, stops } = colorScale(props);
  map.removeFeatureState({ source: "ridings" });
  map.setPaintProperty("fill", "fill-color", [
    "case",
    ["==", ["feature-state", "scaled"], null],
    FILTERED_OUT_COLOR,
    ["interpolate", ["linear"], ["feature-state", "scaled"], ...stops.flat()],
  ]);
  for (const riding of ridings) {
    map.setFeatureState(
      { source: "ridings", id: riding.fed23 },
      {
        label: formatValue(riding.estimate_mean, comparison),
        // Kept within [0, 1]: ridings beyond the capped scale take the end colors.
        scaled: high > low ? clamp((riding.estimate_mean - low) / (high - low)) : 0.5,
      },
    );
  }
}

// The legend of a comparison reads from Canada outwards, and recalls what the scale means.
type LegendProps = Comparison & { low: number; high: number };

function ComparisonLegend({ national, scaleLabels, low, high }: LegendProps) {
  return (
    <div className="legend">
      <span>{signed(high - national)} or more vs Canada</span>
      <span className="legend-bar" style={{ background: gradient(COMPARISON_STOPS) }} />
      <span>{signed(low - national)} or less vs Canada</span>
      <span className="legend-note">Canada: {national.toFixed(2)}</span>
      <span className="legend-note">
        {scaleLabels.map((label, index) => `${index + 1} ${label}`).join(" · ")}
      </span>
    </div>
  );
}

async function addLayers(map: maplibregl.Map) {
  const canada: FeatureCollection = await (await fetch(dataUrl("canada.geojson"))).json();

  // promoteId lets the estimates be attached to each riding by its code.
  map.addSource("ridings", {
    type: "geojson",
    data: dataUrl("ridings.geojson"),
    promoteId: "fed23",
  });
  map.addLayer({ id: "fill", type: "fill", source: "ridings" });
  map.addLayer({
    id: "outline",
    type: "line",
    source: "ridings",
    paint: { "line-color": BACKGROUND, "line-width": 0.4 },
  });
  map.addLayer({
    id: "places",
    type: "symbol",
    source: "openmaptiles",
    "source-layer": "place",
    // Cities from the start, towns once zoomed in; places outside Canada are left out.
    filter: [
      "all",
      ["within", canada.features[0].geometry as MultiPolygon],
      [
        "any",
        ["==", ["get", "class"], "city"],
        ["all", ["==", ["get", "class"], "town"], [">=", ["zoom"], 7]],
      ],
    ],
    layout: {
      "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 9, 14],
    },
    paint: { "text-color": "#ffffff", "text-halo-color": BACKGROUND, "text-halo-width": 1.5 },
  });
}

export default function RidingMap({ ridings, color, comparison }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const loaded = useRef(false);
  // The map loads after the first render; it then needs the latest filters, not the first ones.
  const latest = useRef<Props>({ ridings, color, comparison });
  latest.current = { ridings, color, comparison };

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: container.current!,
      style: STYLE,
      bounds: BOUNDS,
      // Panning stops just south of Point Pelee (41.7°N), Canada's southernmost point.
      maxBounds: [
        [-160, 41],
        [-35, 66],
      ],
      maxZoom: 11,
      attributionControl: { compact: true },
    });
    // Offset so the popup never sits under the cursor, which would hide the riding below it.
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

    instance.on("load", async () => {
      await addLayers(instance);
      loaded.current = true;
      showEstimates(instance, latest.current);
    });

    instance.on("mousemove", "fill", (event) => {
      const feature = event.features![0];
      const value = (feature.state.label as string | undefined) ?? "filtered out";
      instance.getCanvas().style.cursor = "pointer";
      popup
        .setLngLat(event.lngLat)
        .setText(`${feature.properties.fed23_name}: ${value}`)
        .addTo(instance);
    });
    instance.on("mouseleave", "fill", () => {
      instance.getCanvas().style.cursor = "";
      popup.remove();
    });
    instance.on("click", "fill", (event) => {
      window.location.hash = `#/riding/${event.features![0].properties.fed23}`;
    });

    map.current = instance;
    return () => instance.remove();
  }, []);

  useEffect(() => {
    if (loaded.current) showEstimates(map.current!, { ridings, color, comparison });
  }, [ridings, color, comparison]);

  const { low, high, stops } = colorScale({ ridings, color, comparison });
  return (
    <div className="map-wrap">
      <div className="map" ref={container} />
      {comparison ? (
        <ComparisonLegend {...comparison} low={low} high={high} />
      ) : (
        <div className="legend">
          <span>{formatValue(high)}</span>
          <span
            className="legend-bar"
            style={{ background: gradient(stops) }}
          />
          <span>{formatValue(low)}</span>
        </div>
      )}
    </div>
  );
}
