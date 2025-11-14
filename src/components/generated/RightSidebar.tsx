"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Users, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
export interface RightSidebarProps {
  className?: string;
}
interface ChannelStats {
  winRate: number;
  totalTrades: number;
  pnl: number;
  bestDay: string;
}
interface OnlineUser {
  id: string;
  username: string;
  avatar: string;
  initials: string;
  status: "online" | "away" | "busy";
}
const channelStats: ChannelStats = {
  winRate: 78,
  totalTrades: 156,
  pnl: 1250,
  bestDay: "Lundi 15 Jan"
};
const onlineUsers: OnlineUser[] = [{
  id: "1",
  username: "TradingMaster",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
  initials: "TM",
  status: "online"
}, {
  id: "2",
  username: "CryptoAnalyst",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
  initials: "CA",
  status: "online"
}, {
  id: "3",
  username: "ForexPro",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
  initials: "FP",
  status: "away"
}, {
  id: "4",
  username: "RiskManager",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
  initials: "RM",
  status: "online"
}, {
  id: "5",
  username: "ChartAnalyst",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
  initials: "CA",
  status: "busy"
}, {
  id: "6",
  username: "SwingTrader",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face",
  initials: "ST",
  status: "online"
}];
function ChannelStatsCard() {
  const formatPnL = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${value.toLocaleString()}`;
  };
  const getPnLColor = (value: number) => {
    return value >= 0 ? "text-green-400" : "text-red-400";
  };
  return <motion.section initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }}>
      <Card className="bg-[#2f3136] border-white/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-[#7289da]" />
            Statistiques du Canal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-white/70 text-sm">Taux de réussite</dt>
              <dd className="text-[#7289da] font-bold text-lg">
                {channelStats.winRate}%
              </dd>
            </div>
            
            <div className="flex justify-between items-center">
              <dt className="text-white/70 text-sm">Trades totaux</dt>
              <dd className="text-white font-medium">
                {channelStats.totalTrades}
              </dd>
            </div>
            
            <div className="flex justify-between items-center">
              <dt className="text-white/70 text-sm">P&L</dt>
              <dd className={cn("font-bold", getPnLColor(channelStats.pnl))}>
                {formatPnL(channelStats.pnl)}
              </dd>
            </div>
            
            <div className="flex justify-between items-center">
              <dt className="text-white/70 text-sm">Meilleur jour</dt>
              <dd className="text-white font-medium text-sm">
                {channelStats.bestDay}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.section>;
}
function OnlineUserItem({
  user,
  index
}: {
  user: OnlineUser;
  index: number;
}) {
  const getStatusColor = (status: OnlineUser["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusLabel = (status: OnlineUser["status"]) => {
    switch (status) {
      case "online":
        return "En ligne";
      case "away":
        return "Absent";
      case "busy":
        return "Occupé";
      default:
        return "Hors ligne";
    }
  };
  return <motion.li initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} transition={{
    duration: 0.3,
    delay: index * 0.05
  }} whileHover={{
    scale: 1.02
  }} className="transition-transform duration-150">
      <div className={cn("flex items-center gap-3 p-2 rounded-lg", "hover:bg-[#36393f]/50 focus-within:bg-[#36393f]/50", "focus-within:ring-2 focus-within:ring-[#7289da]/50", "transition-all duration-200 cursor-pointer")} tabIndex={0} role="button" aria-label={`${user.username} - ${getStatusLabel(user.status)}`}>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={`Avatar de ${user.username}`} />
            <AvatarFallback className="bg-[#7289da] text-white text-xs">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2f3136]", getStatusColor(user.status))} aria-label={getStatusLabel(user.status)} />
        </div>
        <span className="text-white/90 text-sm font-medium truncate">
          {user.username}
        </span>
      </div>
    </motion.li>;
}
function CommunitySection() {
  return <motion.section initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: 0.1
  }} className="space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold text-[#7289da] uppercase tracking-wider px-2">
        <Users className="h-3 w-3" />
        Communauté — {onlineUsers.filter(u => u.status === "online").length}
      </h2>
      
      <ScrollArea className="max-h-64">
        <ul className="space-y-1" role="list">
          {onlineUsers.map((user, index) => <OnlineUserItem key={user.id} user={user} index={index} />)}
        </ul>
      </ScrollArea>
    </motion.section>;
}
function FormationButton() {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: 0.2
  }} whileHover={{
    scale: 1.02
  }} whileTap={{
    scale: 0.98
  }}>
      <Button className={cn("w-full bg-[#7289da] hover:bg-[#7289da]/90 text-white font-bold", "focus:ring-2 focus:ring-[#7289da]/50 focus:ring-offset-2 focus:ring-offset-[#23272a]", "transition-all duration-200 shadow-sm hover:shadow-md")} size="lg" aria-label="Accéder à la section formation">
        <GraduationCap className="h-4 w-4 mr-2" />
        Accéder à la formation
      </Button>
    </motion.div>;
}
export default function RightSidebar({
  className
}: RightSidebarProps) {
  return <aside className={cn("hidden xl:flex w-72 bg-[#23272a] border-l border-white/10", "flex-col overflow-hidden", className)}>
      <div className="flex flex-col h-full p-4 space-y-6">
        {/* Channel Stats */}
        <ChannelStatsCard />
        
        <Separator className="bg-white/10" />
        
        {/* Community Section */}
        <div className="flex-1 min-h-0">
          <CommunitySection />
        </div>
        
        <Separator className="bg-white/10" />
        
        {/* Formation Button */}
        <FormationButton />
      </div>
    </aside>;
}