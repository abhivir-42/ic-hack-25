import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div style={{ textAlign: "center", paddingTop: "20vh" }}>
      <h1>Welcome to the App</h1>
      <p>This is the home page.</p>
      <Link to="/map">
        <button style={{ padding: "10px 20px", fontSize: "16px" }}>
          Go to Map
        </button>
      </Link>
    </div>
  );
}
