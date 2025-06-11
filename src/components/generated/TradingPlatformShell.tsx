"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MainContentArea from "./MainContentArea";
import RightSidebar from "./RightSidebar";
export interface TradingPlatformShellProps {
  className?: string;
}
export default function TradingPlatformShell({
  className
}: TradingPlatformShellProps) {
  return <div className={cn("h-screen w-full bg-[#23272a] text-white overflow-hidden", "flex flex-col md:flex-row", className)} data-magicpath-id="0" data-magicpath-path="TradingPlatformShell.tsx">
      {/* Left Sidebar */}
      <Sidebar data-magicpath-id="1" data-magicpath-path="TradingPlatformShell.tsx" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" data-magicpath-id="2" data-magicpath-path="TradingPlatformShell.tsx">
        {/* Top Bar */}
        <TopBar channelName="forex-signaux" winRate={78} data-magicpath-id="3" data-magicpath-path="TradingPlatformShell.tsx" />
        
        {/* Main Content */}
        <MainContentArea data-magicpath-id="4" data-magicpath-path="TradingPlatformShell.tsx" />
      </div>
      
      {/* Right Sidebar */}
      <RightSidebar data-magicpath-id="5" data-magicpath-path="TradingPlatformShell.tsx" />
    </div>;
}