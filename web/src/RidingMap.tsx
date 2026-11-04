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

type Located = {
  fed23: number;
  estimate_mean: number;
  estimate_low: number;
  estimate_high: number;
};

// A comparison is set for mean positions on an answer scale: the mean of the reference (Canada,
// or the chosen province), and the answer labels, ranked from 1.
type Comparison = {
  reference: number;
  referenceName: string;
  scaleLabels: string[];
  ends: [string, string];
};

type Props = { ridings: Located[]; color: string; comparison?: Comparison };

type MapProps = Props & { title: string };

// Color stops are [position, color], with positions from 0 (low) to 1 (high).
type Stops = [number, string][];

type Scale = { low: number; high: number; stops: Stops };

// The middle is dark grey rather than white: on the dark background, ridings close to the reference
// recede and the ones that differ stand out.
const COMPARISON_MIDDLE = "#3d4248";

// The middle fifth of the scale stays grey, so that small gaps read as close to the reference
// on the map and in the legend, rather than as faint blue or orange.
const COMPARISON_STOPS: Stops = [
  [0, LOW],
  [0.4, COMPARISON_MIDDLE],
  [0.6, COMPARISON_MIDDLE],
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
// a category that is low everywhere. A comparison is centered on the reference: the middle
// color at its mean, blue below and orange above, the same width on both sides.
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
  const gaps = values.map((value) => Math.abs(value - comparison.reference));
  const widest = percentile(gaps, COMPARISON_PERCENTILE);
  return {
    low: comparison.reference - widest,
    high: comparison.reference + widest,
    stops: COMPARISON_STOPS,
  };
}

function gradient(stops: Stops): string {
  const parts = stops.map(([position, stop]) => `${stop} ${100 * position}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;

function formatValue(value: number, comparison?: Comparison): string {
  if (!comparison) return `${(100 * value).toFixed(1)}%`;
  const { reference, referenceName } = comparison;
  return `${value.toFixed(2)} (${signed(value - reference)} vs ${referenceName})`;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// A riding whose interval contains the reference mean is not shown as different from it: it
// keeps the middle color.
function scaledValue(riding: Located, { low, high }: Scale, comparison?: Comparison): number {
  const reference = comparison?.reference;
  if (reference !== undefined && riding.estimate_low <= reference && reference <= riding.estimate_high)
    return 0.5;
  // Kept within [0, 1]: ridings beyond the capped scale take the end colors.
  return high > low ? clamp((riding.estimate_mean - low) / (high - low)) : 0.5;
}

// Ridings left out by the filters get no value.
function showEstimates(map: maplibregl.Map, props: Props) {
  const { ridings, comparison } = props;
  const scale = colorScale(props);
  map.removeFeatureState({ source: "ridings" });
  map.setPaintProperty("fill", "fill-color", [
    "case",
    ["==", ["feature-state", "scaled"], null],
    FILTERED_OUT_COLOR,
    ["interpolate", ["linear"], ["feature-state", "scaled"], ...scale.stops.flat()],
  ]);
  for (const riding of ridings) {
    map.setFeatureState(
      { source: "ridings", id: riding.fed23 },
      {
        label: formatValue(riding.estimate_mean, comparison),
        scaled: scaledValue(riding, scale, comparison),
      },
    );
  }
}

// The legend of a comparison reads from the reference outwards, and its caption explains the scale
// with the question's own answers.
type LegendProps = Comparison & { low: number; high: number };

// The reference's average placed on the answer scale, so that 2.94 reads as "just below Agree", with
// the color band drawn around it at its true width on the scale.
function ComparisonLegend({ low, high, ...comparison }: LegendProps) {
  const { reference, referenceName, scaleLabels, ends } = comparison;
  const position = (rank: number) => (100 * (rank - 1)) / (scaleLabels.length - 1);
  const band = {
    left: `${position(low)}%`,
    width: `${position(high) - position(low)}%`,
    background: gradient(COMPARISON_STOPS),
  };
  return (
    <div className="legend scale-position">
      <div className="scale-line">
        <span className="scale-band" style={band} />
        {scaleLabels.map((label, index) => (
          <span key={label} className="scale-tick" style={{ left: `${position(index + 1)}%` }}>
            {index + 1}
            <br />
            {label}
          </span>
        ))}
        <span className="scale-marker" style={{ left: `${position(reference)}%` }}>
          {referenceName} {reference.toFixed(2)}
        </span>
      </div>
      <div className="scale-ends">
        <span style={{ color: LOW }}>
          ← {ends[0]} ({signed(low - reference)} vs {referenceName})
        </span>
        <span style={{ color: HIGH }}>
          {ends[1]} ({signed(high - reference)} vs {referenceName}) →
        </span>
      </div>
    </div>
  );
}

function ShareLegend({ low, high, stops }: Scale) {
  return (
    <div className="legend">
      <div className="legend-scale">
        <span>{formatValue(low)}</span>
        <span className="legend-bar" style={{ background: gradient(stops) }} />
        <span>{formatValue(high)}</span>
      </div>
    </div>
  );
}

// Reading notes, shown under the map.
function ComparisonNotes({ referenceName, scaleLabels }: Comparison) {
  const top = scaleLabels[scaleLabels.length - 1];
  return (
    <ul className="legend-caption">
      <li>Each riding gets its average answer on the scale above.</li>
      <li>
        +0.10 means a riding's average is 0.10 point above {referenceName}'s: it leans toward "{top}".
      </li>
      <li>
        Grey: the riding cannot be told apart from {referenceName} (its 90% interval includes{" "}
        {referenceName}'s average).
      </li>
      <li>Colors stop growing at the ends of the bar, so that a few extreme ridings do not wash out the others.</li>
    </ul>
  );
}

function ShareNotes() {
  return (
    <ul className="legend-caption">
      <li>Estimated share of people in each riding.</li>
      <li>Colors run from the lowest riding to the highest, so that differences stand out even when the share is small everywhere.</li>
    </ul>
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

export default function RidingMap({ title, ridings, color, comparison }: MapProps) {
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
      <div className="map-header">
        <h2 className="question">{title}</h2>
        {comparison ? (
          <ComparisonLegend {...comparison} low={low} high={high} />
        ) : (
          <ShareLegend low={low} high={high} stops={stops} />
        )}
      </div>
      <div className="map" ref={container} />
      {comparison ? <ComparisonNotes {...comparison} /> : <ShareNotes />}
    </div>
  );
}
