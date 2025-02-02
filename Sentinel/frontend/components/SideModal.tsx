import React from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer, PolygonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
// Helper function to calculate a destination point given a start point, distance and bearing.
function computeDestinationPoint(lon, lat, distance, bearing) {
  const R = 6378137; // Earth's radius in metres
  const brng = (bearing * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [lon2 * (180 / Math.PI), lat2 * (180 / Math.PI)];
}

// Function to generate an array of sector polygons for a circle
function generateSectors(center, radius, sectors, pointsPerSector = 10) {
  const lon = center.lng;
  const lat = center.lat;
  const sectorPolygons = [];
  const sectorAngle = 360 / sectors;

  for (let i = 0; i < sectors; i++) {
    const startAngle = i * sectorAngle;
    const endAngle = (i + 1) * sectorAngle;
    const arcPoints = [];

    // Generate points along the arc of the sector.
    for (let j = 0; j <= pointsPerSector; j++) {
      const angle =
        startAngle + (j / pointsPerSector) * (endAngle - startAngle);
      const point = computeDestinationPoint(lon, lat, radius, angle);
      arcPoints.push(point);
    }

    // Create a closed polygon: centre -> arc points -> centre.
    const polygon = [[lon, lat], ...arcPoints, [lon, lat]];

    // You can calculate or retrieve the probability for this sector here.
    // For demonstration, we use a dummy random value.
    sectorPolygons.push({
      polygon,
      sectorIndex: i,
      probability: Math.floor(Math.random() * 100), // percentage probability
    });
  }
  return sectorPolygons;
}
const SideModal = ({ clickedLocation, closeModal, pings, roadsGeoJSON, MAP_STYLE }) => {
  if (!clickedLocation) return null;

  const sectorsData = generateSectors(clickedLocation, 1000, 8); // 8 sectors of 45° each

  // Assign a probability to each road
  const roadsWithProbability = roadsGeoJSON?.features.map((road) => ({
    ...road,
    properties: {
      ...road.properties,
      probability: Math.floor(Math.random() * 100), // Random probability (0-100)
    },
  }));

  return (
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
          initialViewState={{
            longitude: clickedLocation.lng,
            latitude: clickedLocation.lat,
            zoom: 15,
            pitch: 0,
            bearing: 0,
          }}
          controller={true}
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
            new ScatterplotLayer({
              id: "modal-ping-layer",
              data: pings,
              getPosition: (d) => [d.lng, d.lat],
              getFillColor: [255, 0, 0],
              getRadius: 100,
            }),
            new LineLayer({
              id: "roads-modal",
              data: roadsWithProbability || [],
              getSourcePosition: (d) => d.geometry.coordinates[0],
              getTargetPosition: (d) => d.geometry.coordinates[d.geometry.coordinates.length - 1],
              getWidth: 2,
              getColor: (d) => {
                const probability = d.properties.probability || 0; // Default to 0 if undefined
                const opacity = Math.round((probability / 100) * 255); // Scale to 0-255
                return [255, 255, 255, opacity]; // White roads with dynamic opacity
              },
            }),
            new PolygonLayer({
              id: "circle-sector-layer",
              data: sectorsData,
              pickable: true,
              stroked: true,
              filled: true,
              lineWidthMinPixels: 2,
              getPolygon: (d) => d.polygon,
              getFillColor: (d) => {
                const probability = d.probability; // 0 to 100
                const opacity = Math.round((probability / 100) * 255); // Scale to 0-255 range
                return [128, 0, 32, opacity]; // Keep it the same, adjust only opacity
              },
              getLineColor: [255, 255, 255, 0],
              onHover: ({ object }) => {
                if (object) {
                  console.log(
                    `Sector ${object.sectorIndex}: ${object.probability}% chance`
                  );
                }
              },
            }),
          ]}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>
      </div>
    </div>
  );
};


export default SideModal;
