import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map, Source, Layer} from 'react-map-gl/maplibre';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {GeoJsonLayer} from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import {CSVLoader} from '@loaders.gl/csv';
import {load} from '@loaders.gl/core';

import type {Color, PickingInfo, MapViewState} from '@deck.gl/core';

// Source data CSV
const DATA_URL =
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/3d-heatmap/heatmap-data.csv'; // eslint-disable-line

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const pointLight1 = new PointLight({
    color: [255, 255, 255],
    intensity: 0.8,
    position: [-0.144528, 49.739968, 80000]
});

const pointLight2 = new PointLight({
    color: [255, 255, 255],
    intensity: 0.8,
    position: [-3.807751, 54.104682, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight1, pointLight2});

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: -0.1276,
    latitude: 51.5074,
    zoom: 10,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5,
    bearing: -27
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

export const colorRange: Color[] = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

function getTooltip({object}: PickingInfo) {
    if (!object) {
        return null;
    }
    const lat = object.position[1];
    const lng = object.position[0];
    const count = object.count;

    return `
                Latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}
                Longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}
                ${count} Accidents
        `;
}

type DataPoint = [longitude: number, latitude: number];

// Approximate bounding boxes for a few London boroughs
const boroughs = {
    'Camden': {
        north: 51.57,
        south: 51.53,
        west: -0.16,
        east: -0.11
    },
    'Westminster': {
        north: 51.52,
        south: 51.49,
        west: -0.15,
        east: -0.11
    },
    'Lambeth': {
        north: 51.49,
        south: 51.45,
        west: -0.12,
        east: -0.04
    }
};

const geojson = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-0.16, 51.57], [-0.12, 51.58], [-0.11, 51.57], [-0.09, 51.55], 
                    [-0.10, 51.54], [-0.14, 51.53], [-0.16, 51.53], [-0.16, 51.55], [-0.16, 51.57]
                ]]
            },
            properties: {
                name: 'Camden',
                colour: [255, 0, 0]
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-0.15, 51.52], [-0.13, 51.53], [-0.11, 51.52], [-0.10, 51.51], 
                    [-0.09, 51.50], [-0.10, 51.49], [-0.12, 51.49], [-0.14, 51.50], [-0.15, 51.52]
                ]]
            },
            properties: {
                name: 'Westminster',
                colour: [0, 255, 0]
            }
        },
        {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-0.12, 51.49], [-0.08, 51.49], [-0.05, 51.48], [-0.04, 51.46], 
                    [-0.05, 51.45], [-0.09, 51.45], [-0.12, 51.46], [-0.12, 51.47], [-0.12, 51.49]
                ]]
            },
            properties: {
                name: 'Lambeth',
                colour: [0, 0, 255]
            }
        }
    ]
};

export default function App({
    data = null,
    mapStyle = MAP_STYLE,
    radius = 100,
    upperPercentile = 100,
    coverage = 1
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

    const filteredData = selectedBorough
        ? data?.filter(d => {
                const borough = boroughs[selectedBorough];
                return d[0] >= borough.west && d[0] <= borough.east && d[1] >= borough.south && d[1] <= borough.north;
            })
        : data;

    const layers = [
        new HexagonLayer<DataPoint>({
            id: 'heatmap',
            gpuAggregation: true,
            colorRange,
            coverage,
            data: filteredData,
            elevationRange: [0, 3000],
            elevationScale: filteredData && filteredData.length ? elevationScale : 0,
            extruded: true,
            getPosition: d => d,
            pickable: true,
            radius: barRadius,
            upperPercentile,
            material: {
                ambient: 0.64,
                diffuse: 0.6,
                shininess: 32,
                specularColor: [51, 51, 51]
            },

            transitions: {
                elevationScale: 3000
            }
        }),
        // new GeoJsonLayer({
        //     id: 'geojson-layer',
        //     data: geojson as GeoJSON,
        //     getFillColor: [0, 0, 0, 0], // Transparent fill
        //     getLineColor: (d: any) => d.properties.color,
        //     pickable: true,
        //     lineWidthMinPixels: 1,
        //     getLineWidth: 2
        // })
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setViewState(prevState => ({
            ...prevState,
            [name]: parseFloat(value)
        }));
    };

    const handleBoroughChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBorough(e.target.value);
    };

    const handleElevationScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setElevationScale(parseFloat(e.target.value));
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBarRadius(parseFloat(e.target.value));
    };

    const layerStyle = {
        id: 'boroughs-layer',
        type: 'fill',
        paint: {
          // Use a match expression to assign a colour based on the borough name
          'fill-color': [
            'match',
            ['get', 'name'],
            'Camden', '#FF0000',      // Camden in red
            'Westminster', '#00FF00',  // Westminster in green
            'Lambeth', '#0000FF',      // Lambeth in blue
            '#CCCCCC'                  // Fallback colour
          ],
          'fill-opacity': 0.5
        }
      };
      

    return (
        <div>
            <DeckGL
                layers={layers}
                effects={[lightingEffect]}
                viewState={viewState}
                onViewStateChange={({viewState}: {viewState: MapViewState}) => setViewState(viewState)}
                controller={{dragRotate: true}}
                getTooltip={getTooltip}
            >
                <Map reuseMaps mapStyle={mapStyle}>
                <Source id="london-boroughs" type="geojson" data={geojson}>
                        <Layer {...layerStyle} />
                    </Source>
                </Map>
            </DeckGL>
            <div style={{position: 'absolute', top: 10, left: 10, background: 'white', padding: '10px'}}>
                <label>
                    Longitude:
                    <input type="number" name="longitude" value={viewState.longitude} onChange={handleChange} />
                </label>
                <br />
                <label>
                    Latitude:
                    <input type="number" name="latitude" value={viewState.latitude} onChange={handleChange} />
                </label>
                <br />
                <label>
                    Zoom:
                    <input type="number" name="zoom" value={viewState.zoom} onChange={handleChange} />
                </label>
                <br />
                <label>
                    Pitch:
                    <input type="number" name="pitch" value={viewState.pitch} onChange={handleChange} />
                </label>
                <br />
                <label>
                    Bearing:
                    <input type="number" name="bearing" value={viewState.bearing} onChange={handleChange} />
                </label>
                <br />
                <label>
                    Borough:
                    <select onChange={handleBoroughChange}>
                        <option value="">All</option>
                        {Object.keys(boroughs).map(borough => (
                            <option key={borough} value={borough}>
                                {borough}
                            </option>
                        ))}
                    </select>
                </label>
                <br />
                <label>
                    Elevation Scale:
                    <input type="range" min="1" max="100" value={elevationScale} onChange={handleElevationScaleChange} />
                </label>
                <br />
                <label>
                    Radius:
                    <input type="range" min="100" max="5000" value={barRadius} onChange={handleRadiusChange} />
                </label>
            </div>
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
        west: -0.510,
        east: 0.334
    };
    const points: DataPoint[] = data
        .map((d: any) => (Number.isFinite(d.lng) && Number.isFinite(d.lat) ? [d.lng, d.lat] : null))
        .filter((d: DataPoint | null): d is DataPoint => d !== null && d[0] >= londonBounds.west && d[0] <= londonBounds.east && d[1] >= londonBounds.south && d[1] <= londonBounds.north);
    root.render(<App data={points} />);
}
