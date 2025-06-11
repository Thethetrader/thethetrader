"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
export interface MainContentAreaProps {
  className?: string;
}
interface Message {
  id: string;
  username: string;
  avatar: string;
  initials: string;
  timestamp: string;
  content: string;
  reactions: {
    emoji: string;
    count: number;
    label: string;
  }[];
}
const mockMessages: Message[] = [{
  id: "1",
  username: "TradingMaster",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
  initials: "TM",
  timestamp: "Aujourd'hui à 14:32",
  content: "🚀 Signal EURUSD: Achat à 1.0850, TP: 1.0900, SL: 1.0820. Confluence parfaite avec la résistance cassée qui devient support!",
  reactions: [{
    emoji: "👍",
    count: 12,
    label: "J'aime"
  }, {
    emoji: "🚀",
    count: 8,
    label: "Fusée"
  }, {
    emoji: "💯",
    count: 5,
    label: "Parfait"
  }]
}, {
  id: "2",
  username: "CryptoAnalyst",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
  initials: "CA",
  timestamp: "Aujourd'hui à 13:45",
  content: "Bitcoin montre des signes de force au-dessus de 42k. Les volumes augmentent et la structure reste haussière. Attention au niveau 43.5k comme prochaine résistance majeure.",
  reactions: [{
    emoji: "👍",
    count: 15,
    label: "J'aime"
  }, {
    emoji: "🔥",
    count: 7,
    label: "Feu"
  }]
}, {
  id: "3",
  username: "ForexPro",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
  initials: "FP",
  timestamp: "Aujourd'hui à 12:18",
  content: "Analyse technique GBP/JPY: Formation d'un triangle ascendant sur H4. Cassure attendue vers 185.50. Volume en augmentation, momentum positif.",
  reactions: [{
    emoji: "👍",
    count: 9,
    label: "J'aime"
  }, {
    emoji: "📈",
    count: 6,
    label: "Graphique croissant"
  }, {
    emoji: "💯",
    count: 3,
    label: "Parfait"
  }]
}, {
  id: "4",
  username: "RiskManager",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
  initials: "RM",
  timestamp: "Aujourd'hui à 11:30",
  content: "⚠️ Rappel important: N'oubliez jamais votre gestion des risques! Maximum 2% du capital par trade. Le money management est la clé du succès à long terme.",
  reactions: [{
    emoji: "👍",
    count: 18,
    label: "J'aime"
  }, {
    emoji: "⚠️",
    count: 4,
    label: "Attention"
  }, {
    emoji: "💡",
    count: 7,
    label: "Idée"
  }]
}];
function ReactionButton({
  emoji,
  count,
  label
}: {
  emoji: string;
  count: number;
  label: string;
}) {
  return <motion.div whileHover={{
    scale: 1.05
  }} whileTap={{
    scale: 0.95
  }} transition={{
    duration: 0.15
  }} data-magicpath-id="0" data-magicpath-path="MainContentArea.tsx">
      <Button variant="ghost" size="sm" className={cn("h-7 px-2 gap-1 text-xs bg-[#36393f]/50 text-white/70 hover:text-white", "hover:bg-[#7289da]/20 focus:ring-2 focus:ring-[#7289da]/50", "border border-white/10 hover:border-[#7289da]/30", "transition-all duration-200")} aria-label={`${label}: ${count} réactions`} data-magicpath-id="1" data-magicpath-path="MainContentArea.tsx">
        <span className="text-sm" data-magicpath-id="2" data-magicpath-path="MainContentArea.tsx">{emoji}</span>
        <span className="font-medium" data-magicpath-id="3" data-magicpath-path="MainContentArea.tsx">{count}</span>
      </Button>
    </motion.div>;
}
function MessageCard({
  message,
  index
}: {
  message: Message;
  index: number;
}) {
  return <motion.article initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: index * 0.1
  }} className="w-full" data-magicpath-id="4" data-magicpath-path="MainContentArea.tsx">
      <Card className="bg-[#2f3136] border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200" data-magicpath-id="5" data-magicpath-path="MainContentArea.tsx">
        <CardContent className="p-4 lg:p-6" data-magicpath-id="6" data-magicpath-path="MainContentArea.tsx">
          <div className="flex gap-3 lg:gap-4" data-magicpath-id="7" data-magicpath-path="MainContentArea.tsx">
            {/* Avatar */}
            <div className="flex-shrink-0" data-magicpath-id="8" data-magicpath-path="MainContentArea.tsx">
              <Avatar className="h-10 w-10 lg:h-12 lg:w-12" data-magicpath-id="9" data-magicpath-path="MainContentArea.tsx">
                <AvatarImage src={message.avatar} alt={`Avatar de ${message.username}`} data-magicpath-id="10" data-magicpath-path="MainContentArea.tsx" />
                <AvatarFallback className="bg-[#7289da] text-white text-sm lg:text-base" data-magicpath-id="11" data-magicpath-path="MainContentArea.tsx">
                  {message.initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0" data-magicpath-id="12" data-magicpath-path="MainContentArea.tsx">
              {/* Header */}
              <div className="flex items-baseline justify-between gap-2 mb-2" data-magicpath-id="13" data-magicpath-path="MainContentArea.tsx">
                <h2 className="font-bold text-white text-sm lg:text-base truncate" data-magicpath-id="14" data-magicpath-path="MainContentArea.tsx">
                  {message.username}
                </h2>
                <time className="text-xs text-white/50 flex-shrink-0" dateTime={new Date().toISOString()} data-magicpath-id="15" data-magicpath-path="MainContentArea.tsx">
                  {message.timestamp}
                </time>
              </div>

              {/* Message Text */}
              <p className="text-white/90 text-sm lg:text-base leading-relaxed mb-3" data-magicpath-id="16" data-magicpath-path="MainContentArea.tsx">
                {message.content}
              </p>

              {/* Reactions */}
              {message.reactions.length > 0 && <nav className="flex flex-wrap gap-2" aria-label="Réactions au message" data-magicpath-id="17" data-magicpath-path="MainContentArea.tsx">
                  {message.reactions.map((reaction, reactionIndex) => <ReactionButton key={`${message.id}-${reaction.emoji}`} emoji={reaction.emoji} count={reaction.count} label={reaction.label} data-magicpath-id="18" data-magicpath-path="MainContentArea.tsx" />)}
                </nav>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>;
}
export default function MainContentArea({
  className
}: MainContentAreaProps) {
  return <main className={cn("flex-1 bg-[#23272a] overflow-hidden", className)} data-magicpath-id="19" data-magicpath-path="MainContentArea.tsx">
      <ScrollArea className="h-full" data-magicpath-id="20" data-magicpath-path="MainContentArea.tsx">
        <div className="container max-w-4xl mx-auto px-4 py-6 lg:py-8" data-magicpath-id="21" data-magicpath-path="MainContentArea.tsx">
          {/* Messages Feed */}
          <section className="space-y-4 lg:space-y-6" aria-label="Flux des messages de trading" data-magicpath-id="22" data-magicpath-path="MainContentArea.tsx">
            {mockMessages.map((message, index) => <MessageCard key={message.id} message={message} index={index} data-magicpath-id="23" data-magicpath-path="MainContentArea.tsx" />)}
          </section>

          {/* Loading State Placeholder */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.3,
          delay: 0.5
        }} className="flex justify-center py-8" data-magicpath-id="24" data-magicpath-path="MainContentArea.tsx">
            <p className="text-white/50 text-sm" data-magicpath-id="25" data-magicpath-path="MainContentArea.tsx">
              Chargement de plus de messages...
            </p>
          </motion.div>
        </div>
      </ScrollArea>
    </main>;
}