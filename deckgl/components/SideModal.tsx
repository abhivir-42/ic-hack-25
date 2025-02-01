import React from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";

const SideModal = ({ clickedLocation, closeModal, pings, roadsGeoJSON, MAP_STYLE }) => {
  if (!clickedLocation) return null;

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
              data: roadsGeoJSON?.features || [],
              getSourcePosition: (d) => d.geometry.coordinates[0],
              getTargetPosition: (d) =>
                d.geometry.coordinates[d.geometry.coordinates.length - 1],
              getColor: [128, 0, 32],
              getWidth: 2,
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
