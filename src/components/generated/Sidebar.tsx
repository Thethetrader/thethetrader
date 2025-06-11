"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Hash, Menu, BookOpen, Video, GraduationCap, TrendingUp, Bitcoin, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
export interface SidebarProps {
  className?: string;
}
interface Channel {
  id: string;
  name: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  winRate?: number;
}
interface ChannelGroup {
  title: string;
  channels: Channel[];
}
const channelGroups: ChannelGroup[] = [{
  title: "Trading Channels",
  channels: [{
    id: "forex",
    name: "forex-signaux",
    icon: TrendingUp,
    winRate: 78
  }, {
    id: "crypto",
    name: "crypto-signaux",
    icon: Bitcoin,
    winRate: 85
  }, {
    id: "futures",
    name: "futures-signaux",
    icon: BarChart3,
    winRate: 67
  }]
}, {
  title: "Educational Channels",
  channels: [{
    id: "setup",
    name: "setup-trading",
    icon: BookOpen
  }, {
    id: "lives",
    name: "lives-stream",
    icon: Video
  }, {
    id: "formation",
    name: "Formation resources",
    icon: GraduationCap
  }]
}];
function Logo() {
  return <motion.div className="flex items-center justify-center p-4" initial={{
    opacity: 0,
    scale: 0.9
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    duration: 0.3
  }} data-magicpath-id="0" data-magicpath-path="Sidebar.tsx">
      <div className="relative" data-magicpath-id="1" data-magicpath-path="Sidebar.tsx">
        <div className="w-12 h-12 rounded-full bg-[#7289da] flex items-center justify-center shadow-lg ring-2 ring-[#7289da]/20" data-magicpath-id="2" data-magicpath-path="Sidebar.tsx">
          <span className="text-white font-bold text-lg tracking-tight" data-magicpath-id="3" data-magicpath-path="Sidebar.tsx">TTT</span>
        </div>
      </div>
    </motion.div>;
}
function ChannelButton({
  channel,
  isCollapsed = false
}: {
  channel: Channel;
  isCollapsed?: boolean;
}) {
  const Icon = channel.icon;
  return <motion.div whileHover={{
    scale: 1.02
  }} whileTap={{
    scale: 0.98
  }} transition={{
    duration: 0.15
  }} data-magicpath-id="4" data-magicpath-path="Sidebar.tsx">
      <Button variant="ghost" className={cn("w-full justify-start gap-3 h-10 px-3 text-left font-normal", "text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 focus:bg-[#36393f]/50", "transition-all duration-200", isCollapsed && "justify-center px-2")} aria-label={`${channel.name} channel${channel.winRate ? ` with ${channel.winRate}% win rate` : ''}`} data-magicpath-id="5" data-magicpath-path="Sidebar.tsx">
        <Icon className="h-4 w-4 flex-shrink-0" data-magicpath-id="6" data-magicpath-path="Sidebar.tsx" />
        {!isCollapsed && <>
            <span className="flex-1 truncate" data-magicpath-id="7" data-magicpath-path="Sidebar.tsx">{channel.name}</span>
            {channel.winRate && <Badge variant="secondary" className="bg-[#7289da] text-white text-xs px-2 py-0.5 font-medium" data-magicpath-id="8" data-magicpath-path="Sidebar.tsx">
                {channel.winRate}%
              </Badge>}
          </>}
      </Button>
    </motion.div>;
}
function UserProfile({
  isCollapsed = false
}: {
  isCollapsed?: boolean;
}) {
  return <motion.div className={cn("p-3 bg-[#2f3136] rounded-lg shadow-sm border border-white/5", "flex items-center gap-3", isCollapsed && "justify-center")} initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: 0.2
  }} data-magicpath-id="9" data-magicpath-path="Sidebar.tsx">
      <div className="relative" data-magicpath-id="10" data-magicpath-path="Sidebar.tsx">
        <Avatar className="h-8 w-8" data-magicpath-id="11" data-magicpath-path="Sidebar.tsx">
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="User avatar" data-magicpath-id="12" data-magicpath-path="Sidebar.tsx" />
          <AvatarFallback className="bg-[#7289da] text-white text-sm" data-magicpath-id="13" data-magicpath-path="Sidebar.tsx">JD</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2f3136]" aria-label="Online status" data-magicpath-id="14" data-magicpath-path="Sidebar.tsx" />
      </div>
      {!isCollapsed && <div className="flex-1 min-w-0" data-magicpath-id="15" data-magicpath-path="Sidebar.tsx">
          <p className="text-white font-medium text-sm truncate" data-magicpath-id="16" data-magicpath-path="Sidebar.tsx">TradingPro</p>
          <p className="text-white/50 text-xs" data-magicpath-id="17" data-magicpath-path="Sidebar.tsx">En ligne</p>
        </div>}
    </motion.div>;
}
function SidebarContent({
  isCollapsed = false
}: {
  isCollapsed?: boolean;
}) {
  return <div className="flex flex-col h-full bg-[#23272a]" data-magicpath-id="18" data-magicpath-path="Sidebar.tsx">
      <Logo data-magicpath-id="19" data-magicpath-path="Sidebar.tsx" />
      
      <ScrollArea className="flex-1 px-3" data-magicpath-id="20" data-magicpath-path="Sidebar.tsx">
        <nav className="space-y-6" role="navigation" aria-label="Channel navigation" data-magicpath-id="21" data-magicpath-path="Sidebar.tsx">
          {channelGroups.map((group, groupIndex) => <motion.div key={group.title} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.3,
          delay: groupIndex * 0.1
        }} data-magicpath-id="22" data-magicpath-path="Sidebar.tsx">
              {!isCollapsed && <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-3" data-magicpath-id="23" data-magicpath-path="Sidebar.tsx">
                  {group.title}
                </h2>}
              <ul className="space-y-1" role="list" data-magicpath-id="24" data-magicpath-path="Sidebar.tsx">
                {group.channels.map(channel => <li key={channel.id} role="listitem" data-magicpath-id="25" data-magicpath-path="Sidebar.tsx">
                    <ChannelButton channel={channel} isCollapsed={isCollapsed} data-magicpath-id="26" data-magicpath-path="Sidebar.tsx" />
                  </li>)}
              </ul>
              {groupIndex < channelGroups.length - 1 && !isCollapsed && <Separator className="my-4 bg-white/10" data-magicpath-id="27" data-magicpath-path="Sidebar.tsx" />}
            </motion.div>)}
        </nav>
      </ScrollArea>
      
      <div className="p-3 border-t border-white/10" data-magicpath-id="28" data-magicpath-path="Sidebar.tsx">
        <UserProfile isCollapsed={isCollapsed} data-magicpath-id="29" data-magicpath-path="Sidebar.tsx" />
      </div>
    </div>;
}
export default function Sidebar({
  className
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden lg:flex lg:w-60 xl:w-72", className)} data-magicpath-id="30" data-magicpath-path="Sidebar.tsx">
        <div className="w-full" data-magicpath-id="31" data-magicpath-path="Sidebar.tsx">
          <SidebarContent data-magicpath-id="32" data-magicpath-path="Sidebar.tsx" />
        </div>
      </aside>

      {/* Tablet Collapsed Sidebar */}
      <aside className={cn("hidden md:flex lg:hidden w-16", className)} data-magicpath-id="33" data-magicpath-path="Sidebar.tsx">
        <div className="w-full" data-magicpath-id="34" data-magicpath-path="Sidebar.tsx">
          <SidebarContent isCollapsed={true} data-magicpath-id="35" data-magicpath-path="Sidebar.tsx" />
        </div>
      </aside>

      {/* Mobile Header with Hamburger */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#23272a] border-b border-white/10" data-magicpath-id="36" data-magicpath-path="Sidebar.tsx">
        <Logo data-magicpath-id="37" data-magicpath-path="Sidebar.tsx" />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen} data-magicpath-id="38" data-magicpath-path="Sidebar.tsx">
          <SheetTrigger asChild data-magicpath-id="39" data-magicpath-path="Sidebar.tsx">
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#36393f]/50" aria-label="Open navigation menu" data-magicpath-id="40" data-magicpath-path="Sidebar.tsx">
              <Menu className="h-5 w-5" data-magicpath-id="41" data-magicpath-path="Sidebar.tsx" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-[#23272a] border-r border-white/10" data-magicpath-id="42" data-magicpath-path="Sidebar.tsx">
            <SidebarContent data-magicpath-id="43" data-magicpath-path="Sidebar.tsx" />
          </SheetContent>
        </Sheet>
      </header>
    </>;
}