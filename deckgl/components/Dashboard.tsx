import React from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";


const Dashboard = ({ pings, elevationScale, setElevationScale, barRadius, setBarRadius, handleAddPing }) => {
    return (
      <div
        style={{
          flex: 1,
          background: "rgba(30, 30, 30, 0.9)",
          padding: "20px",
          color: "#fff",
          position: "absolute",
          bottom: 0,
          width: "90%",
          left: "5%",
          borderRadius: "12px",
        }}
      >
        <h3>Dashboard</h3>
        <p>Number of Pings: {pings.length}</p>
        <label>
          Elevation Scale:
          <input
            type="range"
            min="1"
            max="100"
            value={elevationScale}
            onChange={(e) => setElevationScale(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Radius:
          <input
            type="range"
            min="100"
            max="5000"
            value={barRadius}
            onChange={(e) => setBarRadius(parseFloat(e.target.value))}
          />
        </label>
        <button
          onClick={handleAddPing}
          style={{
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Ping Map
        </button>
      </div>
    );
  };
  
  export { Dashboard };
  