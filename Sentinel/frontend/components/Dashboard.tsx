import React, { useState } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import axios from "axios";

  const Dashboard = ({ pings, handleAddPing, handleBoroughChange, selectedBorough, boroughs
  }) => {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [crimeType, setCrimeType] = useState("");

    const handlePredict = async () => {
      try {
        const response = await axios.post("http://localhost:5000/predict", {
          longitude,  // Ensure matching names
          latitude,
          crimeType
        });
        console.log(response.data);
      } catch (error) {
        console.error("Error making prediction:", error);
      }
    };
    
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px" }}>
          <label style={{ display: "flex", flexDirection: "column", color: "#ccc" }}>
        Latitude:
        <input
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          style={{
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #555",
            background: "#333",
            color: "#fff",
          }}
        />
          </label>
          <label style={{ display: "flex", flexDirection: "column", color: "#ccc" }}>
        Longitude:
        <input
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          style={{
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #555",
            background: "#333",
            color: "#fff",
          }}
        />
          </label>
          <label style={{ display: "flex", flexDirection: "column", color: "#ccc" }}>
        Crime Type:
        <input
          type="text"
          value={crimeType}
          onChange={(e) => setCrimeType(e.target.value)}
          style={{
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #555",
            background: "#333",
            color: "#fff",
          }}
        />
          </label>
          <button
        onClick={handlePredict}
        style={{
          padding: "10px 20px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background 0.3s ease",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#218838")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#28a745")}
          >
        Predict
          </button>
        </div>
      </div>
    );
  };

  export { Dashboard };