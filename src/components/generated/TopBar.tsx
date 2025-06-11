"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Settings, Search } from "lucide-react";
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
  }} className={cn("relative max-w-md w-full", className)} data-magicpath-id="0" data-magicpath-path="TopBar.tsx">
      <label htmlFor="search-input" className="sr-only" data-magicpath-id="1" data-magicpath-path="TopBar.tsx">
        Rechercher dans les messages
      </label>
      <div className="relative" data-magicpath-id="2" data-magicpath-path="TopBar.tsx">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" data-magicpath-id="3" data-magicpath-path="TopBar.tsx" />
        <Input id="search-input" type="search" placeholder="Rechercher..." className={cn("pl-10 pr-4 py-2 bg-[#23272a] border-white/10 text-white placeholder:text-white/50", "focus:border-[#7289da] focus:ring-2 focus:ring-[#7289da]/20", "hover:border-white/20 transition-all duration-200")} data-magicpath-id="4" data-magicpath-path="TopBar.tsx" />
      </div>
    </motion.div>;
}
function MobileSearchSheet() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen} data-magicpath-id="5" data-magicpath-path="TopBar.tsx">
      <SheetTrigger asChild data-magicpath-id="6" data-magicpath-path="TopBar.tsx">
        <Button variant="ghost" size="icon" className={cn("h-9 w-9 text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 transition-all duration-200")} aria-label="Ouvrir la recherche" data-magicpath-id="7" data-magicpath-path="TopBar.tsx">
          <Search className="h-4 w-4" data-magicpath-id="8" data-magicpath-path="TopBar.tsx" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="bg-[#2f3136] border-b border-white/10 p-4" data-magicpath-id="9" data-magicpath-path="TopBar.tsx">
        <SheetHeader className="sr-only" data-magicpath-id="10" data-magicpath-path="TopBar.tsx">
          <SheetTitle data-magicpath-id="11" data-magicpath-path="TopBar.tsx">Rechercher</SheetTitle>
        </SheetHeader>
        <SearchInput data-magicpath-id="12" data-magicpath-path="TopBar.tsx" />
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
  }} data-magicpath-id="13" data-magicpath-path="TopBar.tsx">
      <Button variant="ghost" size="icon" onClick={onClick} className={cn("h-9 w-9 text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 transition-all duration-200")} aria-label={label} data-magicpath-id="14" data-magicpath-path="TopBar.tsx">
        <Icon className="h-4 w-4" data-magicpath-id="15" data-magicpath-path="TopBar.tsx" />
      </Button>
    </motion.div>;
}
export default function TopBar({
  channelName,
  winRate,
  className
}: TopBarProps) {
  return <header className={cn("flex items-center justify-between px-4 py-3 bg-[#2f3136] border-b border-white/10", "min-h-[60px]", className)} data-magicpath-id="16" data-magicpath-path="TopBar.tsx">
      {/* Left: Channel Name and Win Rate */}
      <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none" data-magicpath-id="17" data-magicpath-path="TopBar.tsx">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3
      }} className="flex items-center gap-3 min-w-0" data-magicpath-id="18" data-magicpath-path="TopBar.tsx">
          <h1 className="text-lg lg:text-xl font-bold text-white truncate" data-magicpath-id="19" data-magicpath-path="TopBar.tsx">
            #{channelName}
          </h1>
          {winRate && <Badge className="bg-[#7289da] text-white text-xs px-2 py-1 font-medium flex-shrink-0" aria-label={`Taux de réussite: ${winRate} pourcent`} data-magicpath-id="20" data-magicpath-path="TopBar.tsx">
              {winRate}%
            </Badge>}
        </motion.div>
      </div>

      {/* Center: Search Input (Desktop) */}
      <div className="hidden md:flex flex-1 justify-center px-4" data-magicpath-id="21" data-magicpath-path="TopBar.tsx">
        <SearchInput data-magicpath-id="22" data-magicpath-path="TopBar.tsx" />
      </div>

      {/* Right: Action Buttons */}
      <nav className="flex items-center gap-1 lg:gap-2" aria-label="Actions de la barre supérieure" data-magicpath-id="23" data-magicpath-path="TopBar.tsx">
        {/* Mobile Search Button */}
        <div className="md:hidden" data-magicpath-id="24" data-magicpath-path="TopBar.tsx">
          <MobileSearchSheet data-magicpath-id="25" data-magicpath-path="TopBar.tsx" />
        </div>
        
        {/* Notification Button */}
        <IconButton icon={Bell} label="Notifications" onClick={() => console.log('Notifications clicked')} data-magicpath-id="26" data-magicpath-path="TopBar.tsx" />
        
        {/* Settings Button */}
        <IconButton icon={Settings} label="Paramètres" onClick={() => console.log('Settings clicked')} data-magicpath-id="27" data-magicpath-path="TopBar.tsx" />
      </nav>
    </header>;
}