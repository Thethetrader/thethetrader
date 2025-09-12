import React from 'react';

const Parlons = () => {
  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100vw",
      height: "100vh",
      background: "#1a202c",
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      color: "#e2e8f0",
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
      paddingBottom: "10px"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1>Parlons</h1>
        <p>Interface de discussion</p>
      </div>
    </div>
  );
};

export default Parlons;
