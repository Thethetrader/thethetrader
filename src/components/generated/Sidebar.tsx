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
  }}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-[#7289da] flex items-center justify-center shadow-lg ring-2 ring-[#7289da]/20">
          <span className="text-white font-bold text-lg tracking-tight">TTT</span>
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
  }}>
      <Button variant="ghost" className={cn("w-full justify-start gap-3 h-10 px-3 text-left font-normal", "text-white/70 hover:text-white hover:bg-[#36393f]/50", "focus:ring-2 focus:ring-[#7289da]/50 focus:bg-[#36393f]/50", "transition-all duration-200", isCollapsed && "justify-center px-2")} aria-label={`${channel.name} channel${channel.winRate ? ` with ${channel.winRate}% win rate` : ''}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <>
            <span className="flex-1 truncate">{channel.name}</span>
            {channel.winRate && <Badge variant="secondary" className="bg-[#7289da] text-white text-xs px-2 py-0.5 font-medium">
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
  }}>
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="User avatar" />
          <AvatarFallback className="bg-[#7289da] text-white text-sm">JD</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2f3136]" aria-label="Online status" />
      </div>
      {!isCollapsed && <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">TradingPro</p>
          <p className="text-white/50 text-xs">En ligne</p>
        </div>}
    </motion.div>;
}
function SidebarContent({
  isCollapsed = false
}: {
  isCollapsed?: boolean;
}) {
  return <div className="flex flex-col h-full bg-[#23272a]">
      <Logo />
      
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-6" role="navigation" aria-label="Channel navigation">
          {channelGroups.map((group, groupIndex) => <motion.div key={group.title} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.3,
          delay: groupIndex * 0.1
        }}>
              {!isCollapsed && <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-3">
                  {group.title}
                </h2>}
              <ul className="space-y-1" role="list">
                {group.channels.map(channel => <li key={channel.id} role="listitem">
                    <ChannelButton channel={channel} isCollapsed={isCollapsed} />
                  </li>)}
              </ul>
              {groupIndex < channelGroups.length - 1 && !isCollapsed && <Separator className="my-4 bg-white/10" />}
            </motion.div>)}
        </nav>
      </ScrollArea>
      
      <div className="p-3 border-t border-white/10">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </div>;
}
export default function Sidebar({
  className
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden lg:flex lg:w-60 xl:w-72", className)}>
        <div className="w-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Tablet Collapsed Sidebar */}
      <aside className={cn("hidden md:flex lg:hidden w-16", className)}>
        <div className="w-full">
          <SidebarContent isCollapsed={true} />
        </div>
      </aside>

      {/* Mobile Header with Hamburger */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#23272a] border-b border-white/10">
        <Logo />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#36393f]/50" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-[#23272a] border-r border-white/10">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>
    </>;
}