import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { FeatureCollection, MultiPolygon } from "geojson";
import { type Lang, type Text, useLang } from "./i18n";
import { provinceLabel } from "./provinces";
import { HIGH, LOW } from "./questions";
import { useEffect, useRef, useState } from "react";

// MapLibre fetches files from a web worker, where only absolute URLs resolve.
export const dataUrl = (name: string) =>
  new URL(`${import.meta.env.BASE_URL}data/${name}`, window.location.href).href;

// MapLibre 6 ships its web worker as a separate file that the bundler must serve.
maplibregl.setWorkerUrl(workerUrl);

// From Point Pelee (41.7°N) to just north of Quebec (62.6°N): the Arctic islands are left out
// of the first view, where they would take most of the space.
const CANADA: maplibregl.LngLatBoundsLike = [
  [-141, 41.6],
  [-52.6, 63],
];

// Urban ridings are a few pixels wide in the view of all Canada.
const CITIES: { name: Text; bounds: maplibregl.LngLatBoundsLike }[] = [
  { name: { en: "Vancouver", fr: "Vancouver" }, bounds: [[-123.3, 49.0], [-122.5, 49.4]] },
  { name: { en: "Toronto", fr: "Toronto" }, bounds: [[-79.7, 43.55], [-79.1, 43.9]] },
  { name: { en: "Montreal", fr: "Montréal" }, bounds: [[-74.0, 45.4], [-73.45, 45.72]] },
];

const FIT_PADDING = 16;

export const BACKGROUND = "#15171a";
const LOW_COLOR = "#eef0f2";
const FILTERED_OUT_COLOR = "#2a2d31";

// A minimal style: only city and town names come from OpenFreeMap (free vector tiles, no API
// key), so that zooming in does not bring roads, buildings or parks.
export const STYLE: maplibregl.StyleSpecification = {
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
  province: string;
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

const formatNumber = (value: number, comparison?: Comparison) =>
  comparison ? value.toFixed(2) : `${(100 * value).toFixed(1)}%`;

function formatValue(value: number, comparison?: Comparison): string {
  if (!comparison) return formatNumber(value);
  const { reference, referenceName } = comparison;
  return `${formatNumber(value, comparison)} (${signed(value - reference)} vs ${referenceName})`;
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
      { scaled: scaledValue(riding, scale, comparison) },
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
  const { t } = useLang();
  const top = scaleLabels[scaleLabels.length - 1];
  return (
    <ul className="legend-caption">
      <li>
        {t(
          `Each riding's average answer, compared with ${referenceName}'s. +0.10: 0.10 point closer to "${top}".`,
          `Réponse moyenne de chaque circonscription, comparée à celle de ${referenceName}. +0,10 : 0,10 point plus près de « ${top} ».`,
        )}
      </li>
      <li>
        {t(
          `Grey: the riding's 90% interval includes ${referenceName}'s average.`,
          `Gris : l'intervalle à 90 % de la circonscription contient la moyenne de ${referenceName}.`,
        )}
      </li>
      <li>
        {t(
          "Ridings beyond the ends of the bar take the end colors.",
          "Les circonscriptions au-delà des bouts de la barre prennent la couleur du bout.",
        )}
      </li>
    </ul>
  );
}

function ShareNotes() {
  const { t } = useLang();
  return (
    <ul className="legend-caption">
      <li>{t("Estimated share of people in each riding.", "Part estimée des gens dans chaque circonscription.")}</li>
      <li>
        {t(
          "Colors run from the lowest riding to the highest.",
          "Les couleurs vont de la circonscription la plus basse à la plus haute.",
        )}
      </li>
    </ul>
  );
}

function popupCard(
  name: string,
  riding: Located | undefined,
  comparison: Comparison | undefined,
  lang: Lang,
  t: (en: string, fr: string) => string,
): HTMLElement {
  const lines: [string, string][] = riding
    ? [
        ["map-card-name", name],
        ["map-card-meta", provinceLabel(riding.province, lang)],
        ["map-card-value", formatValue(riding.estimate_mean, comparison)],
        [
          "map-card-meta",
          t(
            `90% interval: ${formatNumber(riding.estimate_low, comparison)} to ${formatNumber(riding.estimate_high, comparison)}`,
            `Intervalle à 90 % : ${formatNumber(riding.estimate_low, comparison)} à ${formatNumber(riding.estimate_high, comparison)}`,
          ),
        ],
      ]
    : [
        ["map-card-name", name],
        ["map-card-meta", t("Filtered out", "Exclue par le filtre")],
      ];
  lines.push(["map-card-hint", t("Click to open the riding page", "Cliquer pour ouvrir la page")]);
  const card = document.createElement("div");
  for (const [className, text] of lines) {
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    card.append(line);
  }
  return card;
}

async function addLayers(map: maplibregl.Map) {
  const canada: FeatureCollection = await (await fetch(dataUrl("canada.geojson"))).json();

  // promoteId lets the estimates be attached to each riding by its code. The outlines are
  // simplified to 500 m, so tiles past zoom 8 would add no detail: past it, MapLibre scales
  // the zoom 8 tiles instead of cutting new ones on every zoom.
  map.addSource("ridings", {
    type: "geojson",
    data: dataUrl("ridings.geojson"),
    promoteId: "fed23",
    maxzoom: 8,
  });
  map.addLayer({ id: "fill", type: "fill", source: "ridings" });
  map.addLayer({
    id: "outline",
    type: "line",
    source: "ridings",
    paint: { "line-color": BACKGROUND, "line-width": 0.4 },
  });
  map.addLayer({
    id: "hover",
    type: "line",
    source: "ridings",
    // A feature state changes on the GPU right away; a filter would re-cut the tiles in the
    // worker, so the outline would trail behind the mouse.
    paint: {
      "line-color": "#ffffff",
      "line-width": 2,
      "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0],
    },
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
      "text-field": cityLabel("en"),
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 9, 14],
    },
    paint: { "text-color": "#ffffff", "text-halo-color": BACKGROUND, "text-halo-width": 1.5 },
  });
}

// OpenFreeMap names places in many languages; "name" is the local name.
export const cityLabel = (lang: Lang): maplibregl.ExpressionSpecification => [
  "coalesce",
  ["get", `name:${lang}`],
  ["get", "name"],
];

export default function RidingMap({ ridings, color, comparison }: Props) {
  const { lang, t } = useLang();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const loaded = useRef(false);
  const [isLoading, setLoading] = useState(true);
  // The map loads after the first render; it then needs the latest filters, not the first ones.
  const latest = useRef({ ridings, color, comparison, lang, t });
  latest.current = { ridings, color, comparison, lang, t };

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: container.current!,
      style: STYLE,
      bounds: CANADA,
      fitBoundsOptions: { padding: FIT_PADDING },
      renderWorldCopies: false,
      maxZoom: 11,
      attributionControl: { compact: true },
    });
    // Offset so the popup never sits under the cursor, which would hide the riding below it.
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: "map-card",
    });

    // On a flat map, the Arctic is stretched so much that the south, where most ridings are,
    // shrinks to a strip. The globe keeps areas close to their true size.
    instance.on("style.load", () => {
      instance.setProjection({ type: "globe" });
      instance.fitBounds(CANADA, { padding: FIT_PADDING, animate: false });
    });

    instance.on("load", async () => {
      await addLayers(instance);
      loaded.current = true;
      showEstimates(instance, latest.current);
      instance.setLayoutProperty("places", "text-field", cityLabel(latest.current.lang));
      instance.once("idle", () => setLoading(false));
    });

    let hovered: number | null = null;
    const setHover = (fed23: number | null) => {
      if (hovered !== null) instance.setFeatureState({ source: "ridings", id: hovered }, { hover: false });
      if (fed23 !== null) instance.setFeatureState({ source: "ridings", id: fed23 }, { hover: true });
      hovered = fed23;
    };
    // The card follows the pointer itself; it is only rebuilt when the riding changes.
    instance.on("mousemove", "fill", (event) => {
      const { fed23, fed23_name } = event.features![0].properties;
      if (fed23 === hovered) return;
      setHover(fed23);
      const { ridings, comparison, lang, t } = latest.current;
      const riding = ridings.find((candidate) => candidate.fed23 === fed23);
      instance.getCanvas().style.cursor = "pointer";
      popup.setDOMContent(popupCard(fed23_name, riding, comparison, lang, t)).trackPointer().addTo(instance);
    });
    instance.on("mouseleave", "fill", () => {
      setHover(null);
      instance.getCanvas().style.cursor = "";
      popup.remove();
    });
    instance.on("click", "fill", (event) => {
      window.location.hash = `#/riding/${event.features![0].properties.fed23}`;
    });

    // The page layout, not only the window, sets the size of the map.
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current!);

    map.current = instance;
    return () => {
      observer.disconnect();
      instance.remove();
    };
  }, []);

  useEffect(() => {
    if (loaded.current) showEstimates(map.current!, { ridings, color, comparison });
  }, [ridings, color, comparison]);

  useEffect(() => {
    if (loaded.current) map.current!.setLayoutProperty("places", "text-field", cityLabel(lang));
  }, [lang]);

  const zoomTo = (bounds: maplibregl.LngLatBoundsLike) =>
    map.current?.fitBounds(bounds, { padding: FIT_PADDING });

  const { low, high, stops } = colorScale({ ridings, color, comparison });
  return (
    <div className="map-wrap">
      <div className="map-frame">
        <div className="map" ref={container} />
        {isLoading && <div className="map-loading">{t("Loading map...", "Chargement de la carte...")}</div>}
        <div className="map-cities">
          <button onClick={() => zoomTo(CANADA)}>Canada</button>
          {CITIES.map((city) => (
            <button key={city.name.en} onClick={() => zoomTo(city.bounds)}>
              {city.name[lang]}
            </button>
          ))}
        </div>
        <div className="map-legend">
          {comparison ? (
            <ComparisonLegend {...comparison} low={low} high={high} />
          ) : (
            <ShareLegend low={low} high={high} stops={stops} />
          )}
        </div>
      </div>
      {comparison ? <ComparisonNotes {...comparison} /> : <ShareNotes />}
    </div>
  );
}
