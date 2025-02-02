import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map, Source, Layer } from "react-map-gl/maplibre";
import { AmbientLight, PointLight, LightingEffect } from "@deck.gl/core";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ColumnLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { CSVLoader } from "@loaders.gl/csv";
import { load } from "@loaders.gl/core";
import ControlPanel from "./components/ControlPanel";

import type { Color, PickingInfo, MapViewState, ViewStateChangeParameters } from "@deck.gl/core";
import SideModal from "./components/SideModal";
import { Dashboard } from "./components/Dashboard";
import axios from "axios";

// Source data CSV
const DATA_URL = "./sampled_metropolitan_data.csv";

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

type DataPoint = [longitude: number, latitude: number, timestamp: number];

const staticGeojson = {
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
  const [elevationScale, setElevationScale] = useState(5);
  const [barRadius, setBarRadius] = useState(radius);
  // We no longer use clickedLocation for the modal
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geojsonData, setGeojson] = useState<any>(null);
  const [pings, setPings] = useState<
    { id: number; lat: number; lng: number, crime: any, severity: any}[]
  >([]);

  // Define London's bounds for generating random ping locations
  const londonBounds = {
    north: 51.686,
    south: 51.286,
    west: -0.51,
    east: 0.334,
  };

  // Load the detailed borough GeoJSON and compute a fill colour for each borough.
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
            londonBoroughs.features.map((feature) => feature.properties.LAD13NM)
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

  // Compute a mapping of borough names to bounding boxes based on the loaded GeoJSON.
  // If geojsonData is not yet available, we fall back to the staticGeojson.
  const boroughsMapping = useMemo(() => {
    const source = geojsonData || staticGeojson;
    return source.features.reduce((acc: any, feature: any) => {
      // Use LAD13NM from the loaded data or fallback to the static property name
      const name = feature.properties.LAD13NM || feature.properties.name;
      // Assumes polygon geometry with one set of coordinates
      const coordinates = feature.geometry.coordinates[0];
      const lats = coordinates.map((coord: number[]) => coord[1]);
      const lngs = coordinates.map((coord: number[]) => coord[0]);

      acc[name] = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        west: Math.min(...lngs),
        east: Math.max(...lngs),
      };

      return acc;
    }, {});
  }, [geojsonData]);

  // Define the tooltip function inside the component so we have access to boroughsMapping.
  const getTooltip = ({ object }: PickingInfo) => {
    if (!object || !object.position || !object.count) return null;
    const { position, count } = object;
    const [lng, lat] = position;

    console.log("object", object);

    return `
      ${count} Crimes (last 6 months)
    `;
  };

  const [selectedTime, setSelectedTime] = useState(12);

  const timeWindow = 1; // in hours
  // First filter by borough if required
  const filteredDataByBorough = selectedBorough
    ? data?.filter((d) => {
        const borough = boroughsMapping[selectedBorough];
        if (!borough) return false;
        return (
          d[0] >= borough.west &&
          d[0] <= borough.east &&
          d[1] >= borough.south &&
          d[1] <= borough.north
        );
      })
    : data;

  // Then filter by time of day
  const filteredData = filteredDataByBorough?.filter(
    (d) => Math.abs(d[2] - selectedTime) <= timeWindow
  );

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

  // Update selected borough based on the option chosen in the selector.
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

  const [roadsGeoJSON, setRoadsGeoJSON] = useState(null);

  const handleMapClick = async (info: PickingInfo) => {
    if (!info.coordinate) return;

    const [lng, lat] = info.coordinate;
    setClickedLocation({ lat, lng });

    // Query Overpass API for roads within 1km
    const query = `
            [out:json];
            way(around:1000, ${lat}, ${lng})["highway"];
            (._;>;);
            out body;
        `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.elements) {
        const roadFeatures = data.elements
          .filter((el) => el.type === "way" && el.nodes)
          .map((way) => {
            const coordinates = way.nodes
              .map((nodeId) => {
                const node = data.elements.find((el) => el.id === nodeId);
                return node ? [node.lon, node.lat] : null;
              })
              .filter(Boolean);

            if (coordinates.length < 2) return null; // Ignore single-point lines

            return {
              type: "Feature",
              properties: { id: way.id },
              geometry: {
                type: "LineString",
                coordinates,
              },
            };
          })
          .filter(Boolean);

        setRoadsGeoJSON({
          type: "FeatureCollection",
          features: roadFeatures,
        });

        console.log("Roads fetched:", roadFeatures);
      }
    } catch (error) {
      console.error("Error fetching roads:", error);
    }
  };

  const crimeSeverityMapping = {
    "anti-social behaviour": "Low",
    "bicycle theft": "Low",
    "criminal damage and arson": "Medium",
    "drugs": "Medium",
    "public order": "Medium",
    "shoplifting": "Low",
    "theft from the person": "Medium",
    "vehicle crime": "Medium",
    "burglary": "High",
    "robbery": "High",
    "violence and sexual offences": "High",
    "possession of weapons": "High",
    "other theft": "Medium",
    "other crime": "Medium",
    "homicide": "Critical",
    "kidnapping": "Critical",
    "terrorism": "Critical"
  };

  const [crime, setCrime] = useState<{ type: string; severity: string } | null>(null);
  
  

  // Modified ping handler: adds a ping, calls the predict API, then removes the ping after n seconds.
  const handleAddPing = () => {
    let selectedBounds: { north: number; south: number; west: number; east: number } | null = null;
  
    if (selectedBorough && boroughsMapping[selectedBorough]) {
      selectedBounds = boroughsMapping[selectedBorough];
    } else if (!selectedBorough && Object.keys(boroughsMapping).length > 0) {
      // If no borough is selected, fall back to the entire London bounding box
      selectedBounds = londonBounds;
    }
  
    if (!selectedBounds) {
      console.warn("No valid bounding box found for selected borough.");
      return;
    }
  
    // Generate a random location within the selected borough’s bounds
    const lat =
      Math.random() * (selectedBounds.north - selectedBounds.south) +
      selectedBounds.south;
    const lng =
      Math.random() * (selectedBounds.east - selectedBounds.west) +
      selectedBounds.west;
    
    // Choose a random crime type from the dictionary
    const crimeTypes = Object.keys(crimeSeverityMapping);
    const randomCrimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    const newPing = { id: Date.now(), lat, lng, crime: randomCrimeType, severity: crimeSeverityMapping[randomCrimeType] };
    setPings((prev) => [...prev, newPing]);

    // Call the predict API using the random crime type
    handlePredict(newPing.lng, newPing.lat, randomCrimeType);
  
    setTimeout(() => {
      setPings((currentPings) =>
        currentPings.filter((p) => p.id !== newPing.id)
      );
    }, 20000);
  };
  

  // Modified closeModal: now clears the pings (which controls the modal).
  const closeModal = () => {
    setPings([]);
  };

  const [predictionResponse, setPredictionResponse] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const handlePredictionResponse = (data) => {
    setPredictionResponse(data);
  };

  const handlePredict = async (
    longitude: number,
    latitude: number,
    crimeType: string
  ) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/predict",
        { longitude, latitude, crimeType },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(response.data);
      handlePredictionResponse(response.data);
    } catch (error) {
      console.error("Error making prediction:", error);
    }
  };

  // Compute the last ping (if any) to use as the centre for the SideModal.
  const lastPing =
    pings && pings.length > 0 ? pings[pings.length - 1] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 3, position: "relative" }}>
        <DeckGL
          layers={layers}
          effects={[lightingEffect]}
          viewState={viewState}
          onViewStateChange={(params) =>
            setViewState(params.viewState as unknown as MapViewState)
          }
          controller={{ dragRotate: true }}
          getTooltip={getTooltip}
          onClick={handleMapClick}
        >
          <Map reuseMaps mapStyle={mapStyle}>
            <Source
              id="london-boroughs"
              type="geojson"
              data={geojsonData || staticGeojson}
            >
              <Layer {...layerStyle} />
            </Source>
          </Map>
        </DeckGL>
      </div>

      <Dashboard
        pings={pings}
        handleAddPing={handleAddPing}
        handleBoroughChange={handleBoroughChange}
        selectedBorough={selectedBorough}
        boroughs={boroughsMapping}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        handlePredictionResponse={handlePredictionResponse}
        handlePredict={handlePredict}
      />

      <ControlPanel
        viewState={viewState}
        handleChange={handleChange}
        handleBoroughChange={handleBoroughChange}
        handleElevationScaleChange={handleElevationScaleChange}
        handleRadiusChange={handleRadiusChange}
        handleAddPing={handleAddPing}
        boroughs={boroughsMapping}
        selectedBorough={selectedBorough}
        elevationScale={elevationScale}
        barRadius={barRadius}
      />
      {(clickedLocation || lastPing) && (
        <SideModal
          centerLocation={lastPing}
          closeModal={closeModal}
          pings={pings}
          roadsGeoJSON={roadsGeoJSON}
          MAP_STYLE={MAP_STYLE}
          prediction={prediction}
        />
      )}
    </div>
  );
}

export async function renderToDOM(container: HTMLDivElement) {
  const root = createRoot(container);
  // First render with no data so that the app mounts
  root.render(<App />);

  const data = (await load(DATA_URL, CSVLoader)).data;

  const londonBounds = {
    north: 51.686,
    south: 51.286,
    west: -0.51,
    east: 0.334,
  };

  // Parse each row and extract the time-of-day from the Month field.
  // In the example, "2024-09-25-05-39" yields an hour of 5 and minute of 39.
  const points: DataPoint[] = data
    .map((d: any) => {
      if (!Number.isFinite(d["Longitude"]) || !Number.isFinite(d["Latitude"])) {
        return null;
      }
      const monthStr = d["Month"]; // e.g. "2024-09-25-05-39"
      const parts = monthStr.split("-");
      if (parts.length < 5) return null;
      const hour = Number(parts[3]);
      const minute = Number(parts[4]);
      // Express the time as a decimal (e.g. 5.65 for 5:39)
      const time = hour + minute / 60;
      return [d["Longitude"], d["Latitude"], time];
    })
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
