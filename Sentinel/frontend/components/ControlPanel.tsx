import React from 'react';

const ControlPanel: React.FC<{
    viewState: MapViewState;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBoroughChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleElevationScaleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadiusChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAddPing: () => void;
    boroughs: Record<string, any>;
    selectedBorough: string | null;
    elevationScale: number;
    barRadius: number;
}> = ({
    viewState,
    handleChange,
    handleBoroughChange,
    handleElevationScaleChange,
    handleRadiusChange,
    handleAddPing,
    boroughs,
    selectedBorough,
    elevationScale,
    barRadius,
}) => (
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
);

export default ControlPanel;
