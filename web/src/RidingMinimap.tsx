import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useLang } from "./i18n";
import { dataUrl } from "./data";
import { BACKGROUND, cityLabel, STYLE } from "./RidingMap";

// Half a zoom level out from the tightest fit, to show the neighbours.
const ZOOM_OUT = 0.5;
// The vector tiles only hold towns and villages from zoom 9; below it, only cities show.
const TOWN_ZOOM = 9;
// How far past the tightest fit the map may zoom in to reach TOWN_ZOOM, cropping the riding.
const MAX_CROP = 1;
// Past zoom 10, city ridings show only borough names and lose the name of their city.
const MAX_ZOOM = 10;

// A riding that almost fits at TOWN_ZOOM is shown at it, slightly cropped, rather than with only
// the large cities. Large rural ridings keep their full view.
function zoomFor(fitZoom: number): number {
  const zoom = fitZoom - ZOOM_OUT;
  if (zoom > MAX_ZOOM) return MAX_ZOOM;
  return zoom < TOWN_ZOOM && fitZoom + MAX_CROP >= TOWN_ZOOM ? TOWN_ZOOM : zoom;
}

function bounds(feature: Feature): maplibregl.LngLatBounds {
  const geometry = feature.geometry as Polygon | MultiPolygon;
  const rings = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
  const box = new maplibregl.LngLatBounds();
  for (const ring of rings) for (const [lng, lat] of ring) box.extend([lng, lat]);
  return box;
}

// A small map of the riding among its neighbours, with the names of nearby places.
export default function RidingMinimap({ fed23 }: { fed23: number }) {
  const { lang } = useLang();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current!,
      style: STYLE,
      // The credit is written under the map instead: the control covers a small map.
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on("load", async () => {
      const ridings: FeatureCollection = await (await fetch(dataUrl("ridings.geojson"))).json();
      const riding = ridings.features.find((feature) => feature.properties?.fed23 === fed23);
      if (!riding) return;
      map.addSource("ridings", { type: "geojson", data: ridings });
      map.addLayer({
        id: "neighbours",
        type: "line",
        source: "ridings",
        paint: { "line-color": "#3a3f45", "line-width": 1 },
      });
      map.addLayer({
        id: "riding",
        type: "fill",
        source: "ridings",
        filter: ["==", ["get", "fed23"], fed23],
        paint: { "fill-color": "#f79009", "fill-opacity": 0.35, "fill-outline-color": "#f79009" },
      });
      map.addLayer({
        id: "places",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        layout: {
          "text-field": cityLabel(lang),
          "text-font": ["Noto Sans Regular"],
          "text-size": ["match", ["get", "class"], "city", 12, "town", 11, 10],
          // Small labels packed close together, so that more places fit on a small map.
          "text-padding": 0,
          "symbol-sort-key": ["match", ["get", "class"], "city", 0, "town", 1, 2],
        },
        paint: { "text-color": "#ffffff", "text-halo-color": BACKGROUND, "text-halo-width": 1.5 },
      });
      map.fitBounds(bounds(riding), { padding: 16, animate: false });
      map.setZoom(zoomFor(map.getZoom()));
    });

    return () => map.remove();
  }, [fed23, lang]);

  return (
    <figure className="minimap">
      <div className="minimap-map" ref={container} />
      <figcaption>© OpenStreetMap, OpenFreeMap</figcaption>
    </figure>
  );
}
