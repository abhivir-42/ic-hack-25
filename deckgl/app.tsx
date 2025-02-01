import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map, Source, Layer } from "react-map-gl/maplibre";
import { AmbientLight, PointLight, LightingEffect } from "@deck.gl/core";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ColumnLayer, ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { CSVLoader } from "@loaders.gl/csv";
import { load } from "@loaders.gl/core";

import type { Color, PickingInfo, MapViewState } from "@deck.gl/core";

// Source data CSV
const DATA_URL = "./modified_metropolitan_street.csv";

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000],
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000],
});

const lightingEffect = new LightingEffect({
  ambientLight,
  pointLight1,
  pointLight2,
});

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 10,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export const colorRange: Color[] = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
];

function getTooltip({ object }: PickingInfo) {
  if (!object) return null;
  const { position, count } = object;
  const [lng, lat] = position;

  return `
        Latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ""}
        Longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ""}
        ${count} Accidents
    `;
}

type DataPoint = [longitude: number, latitude: number];

const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1494, 51.5583],
            [-0.1195, 51.5612],
            [-0.1047, 51.5572],
            [-0.1003, 51.5439],
            [-0.1307, 51.5341],
            [-0.1494, 51.5341],
            [-0.1494, 51.5583],
          ],
        ],
      },
      properties: {
        name: "Camden",
        colour: [255, 0, 0],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1447, 51.5206],
            [-0.1161, 51.5234],
            [-0.1047, 51.518],
            [-0.0978, 51.5056],
            [-0.1265, 51.5011],
            [-0.1447, 51.5072],
            [-0.1447, 51.5206],
          ],
        ],
      },
      properties: {
        name: "Westminster",
        colour: [0, 255, 0],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1175, 51.4927],
            [-0.0874, 51.4927],
            [-0.0745, 51.4819],
            [-0.0848, 51.4638],
            [-0.1094, 51.4675],
            [-0.1175, 51.4803],
            [-0.1175, 51.4927],
          ],
        ],
      },
      properties: {
        name: "Lambeth",
        colour: [0, 0, 255],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.1097, 51.5205],
            [-0.0614, 51.5205],
            [-0.0614, 51.477],
            [-0.1097, 51.477],
            [-0.1097, 51.5205],
          ],
        ],
      },
      properties: {
        name: "Southwark",
        colour: [75, 0, 130],
      },
    },
  ],
};

const boroughs = geojson.features.reduce((acc, feature) => {
  const { name } = feature.properties;
  const coordinates = feature.geometry.coordinates[0];
  const lats = coordinates.map((coord) => coord[1]);
  const lngs = coordinates.map((coord) => coord[0]);

  acc[name] = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    west: Math.min(...lngs),
    east: Math.max(...lngs),
  };

  return acc;
}, {});

export default function App({
  data = null,
  mapStyle = MAP_STYLE,
  radius = 100,
  upperPercentile = 100,
  coverage = 1,
}: {
  data?: DataPoint[] | null;
  mapStyle?: string;
  radius?: number;
  upperPercentile?: number;
  coverage?: number;
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null);
  const [elevationScale, setElevationScale] = useState(1);
  const [barRadius, setBarRadius] = useState(radius);
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geojsonData, setGeojson] = useState<any>(null);
  const [pings, setPings] = useState<
    { id: number; lat: number; lng: number }[]
  >([]);

  // Define London's bounds for generating random ping locations
  const londonBounds = {
    north: 51.686,
    south: 51.286,
    west: -0.51,
    east: 0.334,
  };

  useEffect(() => {
    fetch("./lad.json")
      .then((response) => response.json())
      .then((data) => {
        const londonBoroughs = {
          ...data,
          features: data.features.filter((feature) =>
            feature.properties.LAD13CD.startsWith("E09")
          ),
        };

        const boroughNames = [
          ...new Set(
            londonBoroughs.features.map(
              (feature) => feature.properties.LAD13NM
            )
          ),
        ];

        const boroughColorMapping: Record<string, string> = {};
        boroughNames.forEach((name) => {
          boroughColorMapping[name] = getRandomPastelColor();
        });

        londonBoroughs.features = londonBoroughs.features.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            fillColor: boroughColorMapping[feature.properties.LAD13NM],
          },
        }));

        setGeojson(londonBoroughs);
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  const filteredData = selectedBorough
    ? data?.filter((d) => {
        const borough = boroughs[selectedBorough];
        return (
          d[0] >= borough.west &&
          d[0] <= borough.east &&
          d[1] >= borough.south &&
          d[1] <= borough.north
        );
      })
    : data;

  // Define the layers for the main map, including the heatmap and the ping layer.
  const layers = [
    new HexagonLayer<DataPoint>({
      id: "heatmap",
      gpuAggregation: true,
      colorRange,
      coverage,
      data: filteredData,
      elevationRange: [0, 3000],
      elevationScale: filteredData && filteredData.length ? elevationScale : 0,
      extruded: true,
      getPosition: (d) => d,
      pickable: true,
      radius: barRadius,
      upperPercentile,
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51],
      },
      transitions: {
        elevationScale: 3000,
      },
    }),
    new ColumnLayer({
      id: "ping-layer",
      data: pings,
      diskResolution: 12,
      radius: 100,
      extruded: true,
      pickable: true,
      elevationScale: 500,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: [255, 0, 0],
      getElevation: 1000,
    }),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setViewState((prevState) => ({
      ...prevState,
      [name]: parseFloat(value),
    }));
  };

  const handleBoroughChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBorough(e.target.value);
  };

  const handleElevationScaleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setElevationScale(parseFloat(e.target.value));
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarRadius(parseFloat(e.target.value));
  };

  const getRandomPastelColor = () => {
    const r = Math.floor(Math.random() * 127 + 127);
    const g = Math.floor(Math.random() * 127 + 127);
    const b = Math.floor(Math.random() * 127 + 127);
    return `rgb(${r},${g},${b})`;
  };

  const layerStyle = {
    id: "boroughs-layer",
    type: "fill",
    paint: {
      "fill-color": ["get", "fillColor"],
      "fill-opacity": 0.5,
    },
  };

  const handleMapClick = (info: PickingInfo) => {
    if (info.coordinate) {
      setClickedLocation({ lat: info.coordinate[1], lng: info.coordinate[0] });
    }
  };

  const closeModal = () => {
    setClickedLocation(null);
  };

  // Function to generate a random ping in London
  const handleAddPing = () => {
    const lat =
      Math.random() * (londonBounds.north - londonBounds.south) +
      londonBounds.south;
    const lng =
      Math.random() * (londonBounds.east - londonBounds.west) +
      londonBounds.west;
    const newPing = { id: Date.now(), lat, lng };
    setPings((prev) => [...prev, newPing]);

    // Remove the ping after 3 seconds
    setTimeout(() => {
      setPings((currentPings) =>
        currentPings.filter((p) => p.id !== newPing.id)
      );
    }, 3000);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        backgroundColor: "#1e1e1e",
      }}
    >
      <DeckGL
        layers={layers}
        effects={[lightingEffect]}
        viewState={viewState}
        onViewStateChange={({ viewState }: { viewState: MapViewState }) =>
          setViewState(viewState)
        }
        controller={{ dragRotate: true }}
        getTooltip={getTooltip}
        onClick={handleMapClick}
      >
        <Map reuseMaps mapStyle={mapStyle}>
          <Source
            id="london-boroughs"
            type="geojson"
            data={geojsonData || geojson}
          >
            <Layer {...layerStyle} />
          </Source>
        </Map>
      </DeckGL>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(30, 30, 30, 0.9)",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)",
          zIndex: 1,
          color: "#fff",
          fontSize: "16px",
          maxWidth: "300px",
        }}
      >
        <label style={{ display: "block", marginBottom: "10px" }}>
          Longitude:
          <input
            type="number"
            name="longitude"
            value={viewState.longitude}
            onChange={handleChange}
            style={{
              marginLeft: "10px",
              width: "100%",
              padding: "5px",
              borderRadius: "4px",
              border: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Latitude:
          <input
            type="number"
            name="latitude"
            value={viewState.latitude}
            onChange={handleChange}
            style={{
              marginLeft: "10px",
              width: "100%",
              padding: "5px",
              borderRadius: "4px",
              border: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Zoom:
          <input
            type="number"
            name="zoom"
            value={viewState.zoom}
            onChange={handleChange}
            style={{
              marginLeft: "10px",
              width: "100%",
              padding: "5px",
              borderRadius: "4px",
              border: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Pitch:
          <input
            type="number"
            name="pitch"
            value={viewState.pitch}
            onChange={handleChange}
            style={{
              marginLeft: "10px",
              width: "100%",
              padding: "5px",
              borderRadius: "4px",
              border: "none",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Bearing:
          <input
            type="range"
            name="bearing"
            min="-180"
            max="180"
            value={viewState.bearing}
            onChange={handleChange}
            style={{ marginLeft: "10px", width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "10px" }}>
          Borough:
          <select
            onChange={handleBoroughChange}
            style={{
              marginLeft: "10px",
              width: "100%",
              padding: "5px",
              borderRadius: "4px",
              border: "none",
            }}
          >
            <option value="">All</option>
            {Object.keys(boroughs).map((borough) => (
              <option key={borough} value={borough}>
                {borough}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Elevation Scale:
          <input
            type="range"
            min="1"
            max="100"
            value={elevationScale}
            onChange={handleElevationScaleChange}
            style={{ marginLeft: "10px", width: "100%" }}
          />
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          Radius:
          <input
            type="range"
            min="100"
            max="5000"
            value={barRadius}
            onChange={handleRadiusChange}
            style={{ marginLeft: "10px", width: "100%" }}
          />
        </label>
        <button
          onClick={handleAddPing}
          style={{
            marginLeft: "10px",
            marginTop: "10px",
            width: "100%",
            padding: "10px",
            borderRadius: "4px",
            border: "none",
            background: "#007bff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Ping London
        </button>
      </div>
      {clickedLocation && (
        <div
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            background: "rgba(30, 30, 30, 0.9)",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)",
            zIndex: 1,
            color: "#fff",
            fontSize: "16px",
            maxWidth: "600px",
          }}
        >
          <h4>Clicked Location</h4>
          <p>Latitude: {clickedLocation.lat}</p>
          <p>Longitude: {clickedLocation.lng}</p>
          <button
            onClick={closeModal}
            style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              background: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <div style={{ height: "400px", width: "400px", borderRadius: "12px" }}>
            <DeckGL
              viewState={{
                longitude: clickedLocation.lng,
                latitude: clickedLocation.lat,
                zoom: 14,
                pitch: 0,
                bearing: 0,
              }}
              style={{
                width: "90%",
                height: "60%",
                position: "absolute",
                left: "5%",
                top: "65%",
                transform: "translateY(-50%)",
                borderRadius: "12px",
              }}
              layers={[
                new ColumnLayer({
                  id: "modal-ping-layer",
                  data: pings,
                  diskResolution: 12,
                  radius: 100,
                  extruded: true,
                  pickable: true,
                  elevationScale: 500,
                  getPosition: (d) => [d.lng, d.lat],
                  getFillColor: [255, 0, 0],
                  getElevation: 1000,
                }),
              ]}
              controller={false}
            >
              <Map mapStyle={MAP_STYLE} />
            </DeckGL>
          </div>
        </div>
      )}
    </div>
  );
}

export async function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  root.render(<App />);

  const data = (await load(DATA_URL, CSVLoader)).data;

  const londonBounds = {
    north: 51.686,
    south: 51.286,
    west: -0.51,
    east: 0.334,
  };
  const points: DataPoint[] = data
    .map((d: any) =>
      Number.isFinite(d["Longitude"]) && Number.isFinite(d["Latitude"])
        ? [d["Longitude"], d["Latitude"]]
        : null
    )
    .filter(
      (d: DataPoint | null): d is DataPoint =>
        d !== null &&
        d[0] >= londonBounds.west &&
        d[0] <= londonBounds.east &&
        d[1] >= londonBounds.south &&
        d[1] <= londonBounds.north
    );
  root.render(<App data={points} />);
}
