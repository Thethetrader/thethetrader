import React, { useEffect, useState, useRef } from "react";

const ProfitLoss = ({ channelId, currentUserId, supabase }: { channelId?: string; currentUserId?: string; supabase?: any }) => {
  
  // Version ultra-simple pour debug
  return (
    <div className="w-full h-full bg-blue-500 flex items-center justify-center">
      <div className="text-white text-2xl font-bold">
        💬 CHAT SALON ACTIF
      </div>
    </div>
  );
};

export default ProfitLoss;