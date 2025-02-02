import React, { useState } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import axios from "axios";

  const Dashboard = ({ pings, handleAddPing, handleBoroughChange, selectedBorough, boroughs, selectedTime, setSelectedTime, handlePredictionResponse, handlePredict
  }) => {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [crimeType, setCrimeType] = useState("");


    return (
      <div
        style={{
          flex: 1,
          background: "rgba(30, 30, 30, 0.9)",
          padding: "20px",
          color: "#fff",
          position: "absolute",
          bottom: 10,
          width: "50%",
          left: "2.5%",
          borderRadius: "12px",
        }}
      >
        <h3>Dashboard</h3>
            <label style={{ display: "block", margin: "1rem 0" }}>
        Select Time of Day: {selectedTime}:00
        <input
          type="range"
          min="0"
          max="23"
          step="1"
          value={selectedTime}
          onChange={(e) => setSelectedTime(parseInt(e.target.value, 10))}
          style={{ width: "100%" }}
        />
      </label>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
              onClick={handleAddPing}
              style={{
                padding: "10px 20px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background 0.3s ease",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#0056b3")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#007bff")}
              >
              Ping Map
              </button>
          
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", color: "#ccc" }}>
            Borough:
            <select
          onChange={handleBoroughChange}
          value={selectedBorough || ""}
          style={{
              marginLeft: "10px",
              padding: "5px",
              borderRadius: "5px",
              border: "1px solid #555",
              background: "#333",
              color: "#fff",
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
        </div>
       
      </div>
    );
  };

  export { Dashboard };