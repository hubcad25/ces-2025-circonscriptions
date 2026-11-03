import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { FeatureCollection, MultiPolygon } from "geojson";
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

type Props = { ridings: Located[]; color: string };

function shareRange(ridings: Located[]): [number, number] {
  const shares = ridings.map((riding) => riding.estimate_mean);
  return [Math.min(...shares), Math.max(...shares)];
}

// The scale runs from the party's lowest to highest riding, so that differences stand out
// even for a party that is low everywhere. Ridings left out by the filters get no value.
function showEstimates(map: maplibregl.Map, { ridings, color }: Props) {
  const [low, high] = shareRange(ridings);
  map.removeFeatureState({ source: "ridings" });
  map.setPaintProperty("fill", "fill-color", [
    "case",
    ["==", ["feature-state", "scaled"], null],
    FILTERED_OUT_COLOR,
    ["interpolate", ["linear"], ["feature-state", "scaled"], 0, LOW_COLOR, 1, color],
  ]);
  for (const riding of ridings) {
    map.setFeatureState(
      { source: "ridings", id: riding.fed23 },
      {
        share: riding.estimate_mean,
        scaled: high > low ? (riding.estimate_mean - low) / (high - low) : 1,
      },
    );
  }
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

export default function RidingMap({ ridings, color }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const loaded = useRef(false);
  // The map loads after the first render; it then needs the latest filters, not the first ones.
  const latest = useRef<Props>({ ridings, color });
  latest.current = { ridings, color };

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: container.current!,
      style: STYLE,
      bounds: BOUNDS,
      maxBounds: [
        [-160, 35],
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
      const share = feature.state.share as number | undefined;
      const value = share === undefined ? "filtered out" : `${(100 * share).toFixed(1)}%`;
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
    if (loaded.current) showEstimates(map.current!, { ridings, color });
  }, [ridings, color]);

  const [low, high] = shareRange(ridings);
  return (
    <div className="map-wrap">
      <div className="map" ref={container} />
      <div className="legend">
        <span>{(100 * high).toFixed(0)}%</span>
        <span
          className="legend-bar"
          style={{ background: `linear-gradient(to top, ${LOW_COLOR}, ${color})` }}
        />
        <span>{(100 * low).toFixed(0)}%</span>
      </div>
    </div>
  );
}
