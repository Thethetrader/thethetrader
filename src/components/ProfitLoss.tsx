import React from "react";

const ProfitLoss = () => {
  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        background: "#1a202c",
        position: "relative",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div style={{
        textAlign: "center",
        color: "#a0aec0",
        fontSize: "18px",
        fontWeight: "bold"
      }}>
        💰 Profit-Loss
      </div>
      <div style={{
        textAlign: "center",
        color: "#718096",
        fontSize: "14px",
        marginTop: "10px"
      }}>
        Salon en cours de configuration...
      </div>
    </div>
  );
};

export default ProfitLoss;