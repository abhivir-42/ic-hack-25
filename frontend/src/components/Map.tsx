"use client";

import React from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { MapViewState } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -1.415727,
  latitude: 52.232395,
  zoom: 6.6,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export default function MapComponent({
  mapStyle = MAP_STYLE,
}: {
  mapStyle?: string;
}) {
  return (
    <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true}>
      <Map reuseMaps mapStyle={mapStyle} mapLib={import("maplibre-gl")} />
    </DeckGL>
  );
}
