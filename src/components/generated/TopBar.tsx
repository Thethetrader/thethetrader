"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Settings, Search, Video } from "lucide-react";
import { motion } from "framer-motion";
export interface TopBarProps {
  channelName: string;
  winRate?: number;
  className?: string;

}
function SearchInput({
  className
}: {
  className?: string;
}) {
  return <motion.div initial={{
    opacity: 0,
    y: -10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: 0.1
  }} className={cn("relative max-w-md w-full", className)}>
      <label htmlFor="search-input" className="sr-only">
        Rechercher dans les messages
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input id="search-input" type="search" placeholder="Rechercher..." className={cn("pl-10 pr-4 py-2 bg-[#23272a] border-white/10 text-white placeholder:text-white/50", "focus:border-[#7289da] focus:ring-2 focus:ring-[#7289da]/20", "hover:border-white/20 transition-all duration-200")} />
      </div>
    </motion.div>;
}
function MobileSearchSheet() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9 text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 transition-all duration-200")} aria-label="Ouvrir la recherche">
          <Search className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="bg-[#2f3136] border-b border-white/10 p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Rechercher</SheetTitle>
        </SheetHeader>
        <SearchInput />
      </SheetContent>
    </Sheet>;
}
function IconButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  onClick?: () => void;
}) {
  return <motion.div whileHover={{
    scale: 1.05
  }} whileTap={{
    scale: 0.95
  }} transition={{
    duration: 0.15
  }}>
      <Button variant="ghost" size="icon" onClick={onClick} className={cn("h-9 w-9 text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 transition-all duration-200")} aria-label={label}>
        <Icon className="h-4 w-4" />
      </Button>
    </motion.div>;
}
export default function TopBar({
  channelName,
  winRate,
  className,

}: TopBarProps) {
  return <header className={cn("flex items-center justify-between px-4 py-3 bg-[#2f3136] border-b border-white/10", "min-h-[60px]", className)}>
      {/* Left: Channel Name and Win Rate */}
      <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3
      }} className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-white truncate">
            #{channelName}
          </h1>
          {winRate && <Badge className="bg-[#7289da] text-white text-xs px-2 py-1 font-medium flex-shrink-0" aria-label={`Taux de réussite: ${winRate} pourcent`}>
              {winRate}%
            </Badge>}
        </motion.div>
      </div>

      {/* Center: Search Input (Desktop) */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <SearchInput />
      </div>

      {/* Right: Action Buttons */}
      <nav className="flex items-center gap-1 lg:gap-2" aria-label="Actions de la barre supérieure">
        {/* Mobile Search Button */}
        <div className="md:hidden">
          <MobileSearchSheet />
        </div>
        

        
        {/* Notification Button */}
        <IconButton icon={Bell} label="Notifications" onClick={() => console.log('Notifications clicked')} />
        
        {/* Settings Button */}
        <IconButton icon={Settings} label="Paramètres" onClick={() => console.log('Settings clicked')} />
      </nav>
    </header>;
}