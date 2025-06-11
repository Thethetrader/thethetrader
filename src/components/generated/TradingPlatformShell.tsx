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
  return <div className={cn("h-screen w-full bg-[#23272a] text-white overflow-hidden", "flex flex-col md:flex-row", className)}>
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar channelName="forex-signaux" winRate={78} />
        
        {/* Main Content */}
        <MainContentArea />
      </div>
      
      {/* Right Sidebar */}
      <RightSidebar />
    </div>;
}