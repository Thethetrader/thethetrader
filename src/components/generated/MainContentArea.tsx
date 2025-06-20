"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";

export interface MainContentAreaProps {
  className?: string;
  onSignalsChange?: (signals: Signal[]) => void;
  signals?: Signal[];
}

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  pair: string;
  entryPrice: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  image?: string;
  timestamp: Date;
  status: 'ACTIVE' | 'WIN' | 'LOSS';
  reactions: { [emoji: string]: number };
}

interface SignalFormData {
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  image?: string;
}

export default function MainContentArea({ className, onSignalsChange, signals: externalSignals = [] }: MainContentAreaProps) {
  const [signals, setSignals] = useState<Signal[]>(externalSignals);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<SignalFormData>({
    pair: '',
    direction: 'BUY',
    entry: '',
    takeProfit: '',
    stopLoss: '',
    description: ''
  });

  // Synchroniser avec les signaux externes
  React.useEffect(() => {
    setSignals(externalSignals);
  }, [externalSignals]);

  // Notifier le parent quand les signaux changent
  React.useEffect(() => {
    if (onSignalsChange) {
      onSignalsChange(signals);
    }
  }, [signals, onSignalsChange]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSignal = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSignal: Signal = {
      id: `signal-${Date.now()}`,
      type: formData.direction,
      pair: formData.pair,
      entryPrice: formData.entry,
      takeProfit: formData.takeProfit,
      stopLoss: formData.stopLoss,
      description: formData.description,
      image: formData.image,
      timestamp: new Date(),
      status: 'ACTIVE',
      reactions: {}
    };

    setSignals(prev => [newSignal, ...prev]);
    
    // Reset form
    setFormData({
      pair: '',
      direction: 'BUY',
      entry: '',
      takeProfit: '',
      stopLoss: '',
      description: '',
      image: undefined
    });
    setModalOpen(false);
  };

  const updateSignalStatus = (signalId: string, newStatus: 'WIN' | 'LOSS') => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        // Si on clique sur le même statut, remettre en ACTIVE
        if (signal.status === newStatus) {
          return { ...signal, status: 'ACTIVE' };
        }
        // Sinon, appliquer le nouveau statut
        return { ...signal, status: newStatus };
      }
      return signal;
    }));
  };

  const addReaction = (signalId: string, emoji: string) => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        const currentCount = signal.reactions[emoji] || 0;
        return {
          ...signal,
          reactions: {
            ...signal.reactions,
            [emoji]: currentCount + 1
          }
        };
      }
      return signal;
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#36393f]", className)}>
      {/* Header avec bouton Nouveau Signal */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Signaux de Trading</h2>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-[#7289da] hover:bg-[#5b6eae] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Signal
        </Button>
      </div>

      {/* Feed des signaux */}
      <div className="flex-1 overflow-y-auto p-4">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-[#2f3136] rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">Bienvenue dans ce salon !</h3>
              <p className="text-white/70 mb-4">
                C'est ici que vous partagerez vos signaux de trading. Commencez par créer votre premier signal.
              </p>
              <Button 
                onClick={() => setModalOpen(true)}
                className="bg-[#7289da] hover:bg-[#5b6eae] text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer le premier signal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <div key={signal.id} className="bg-[#2f3136] rounded-lg p-4 space-y-3">
                {/* Header du signal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#7289da] flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">TC</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Trade Captain</p>
                      <p className="text-white/50 text-sm">{formatTime(signal.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      signal.type === 'BUY' 
                        ? "bg-green-600 text-white" 
                        : "bg-red-600 text-white"
                    )}>
                      {signal.type === 'BUY' ? '📈 BUY' : '📉 SELL'}
                    </span>
                  </div>
                </div>

                {/* Contenu du signal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-white/70">Paire</p>
                    <p className="text-white font-semibold">{signal.pair}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Prix d'entrée</p>
                    <p className="text-white font-semibold">{signal.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Take Profit</p>
                    <p className="text-green-400 font-semibold">{signal.takeProfit}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Stop Loss</p>
                    <p className="text-red-400 font-semibold">{signal.stopLoss}</p>
                  </div>
                </div>

                {/* Description */}
                {signal.description && (
                  <p className="text-white/90 text-sm bg-[#36393f] rounded p-3">
                    {signal.description}
                  </p>
                )}

                {/* Image */}
                {signal.image && (
                  <img 
                    src={signal.image} 
                    alt="Signal chart" 
                    className="rounded-lg max-w-md w-full object-cover"
                  />
                )}

                {/* Statut et boutons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      signal.status === 'ACTIVE' && "bg-blue-600 text-white",
                      signal.status === 'WIN' && "bg-green-600 text-white", 
                      signal.status === 'LOSS' && "bg-red-600 text-white"
                    )}>
                      {signal.status}
                    </span>
                    
                    {signal.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateSignalStatus(signal.id, 'WIN')}
                          className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                        >
                          Win
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateSignalStatus(signal.id, 'LOSS')}
                          className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs"
                        >
                          Loss
                        </Button>
                      </div>
                    )}

                    {signal.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        onClick={() => updateSignalStatus(signal.id, signal.status as 'WIN' | 'LOSS')}
                        className="bg-gray-600 hover:bg-gray-700 text-white h-7 px-3 text-xs"
                      >
                        Réactiver
                      </Button>
                    )}
                  </div>

                  {/* Réactions */}
                  <div className="flex items-center gap-1">
                    {['👍', '❤️', '😂', '⚡', '🔥', '🎯', '💰', '📈'].map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => addReaction(signal.id, emoji)}
                        className="h-7 w-7 p-0 hover:bg-white/10 text-sm"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Compteur de réactions */}
                {Object.keys(signal.reactions).length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {Object.entries(signal.reactions).map(([emoji, count]) => (
                      <span key={emoji} className="bg-[#36393f] rounded-full px-2 py-1 text-white/70">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création de signal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#2f3136] text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Nouveau Signal de Trading</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateSignal} className="space-y-4">
            {/* Paire */}
            <div>
              <Label htmlFor="pair" className="text-white/70">Paire de trading</Label>
              <Input
                id="pair"
                value={formData.pair}
                onChange={(e) => setFormData(prev => ({ ...prev, pair: e.target.value }))}
                placeholder="Ex: EURUSD, BTCUSDT..."
                className="bg-[#36393f] border-white/10 text-white"
                required
              />
            </div>

            {/* Direction */}
            <div>
              <Label htmlFor="direction" className="text-white/70">Direction</Label>
              <Select value={formData.direction} onValueChange={(value: 'BUY' | 'SELL') => setFormData(prev => ({ ...prev, direction: value }))}>
                <SelectTrigger className="bg-[#36393f] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#36393f] border-white/10">
                  <SelectItem value="BUY" className="text-green-400">🟢 Achat (BUY)</SelectItem>
                  <SelectItem value="SELL" className="text-red-400">🔴 Vente (SELL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prix d'entrée */}
            <div>
              <Label htmlFor="entry" className="text-white/70">Prix d'entrée</Label>
              <Input
                id="entry"
                value={formData.entry}
                onChange={(e) => setFormData(prev => ({ ...prev, entry: e.target.value }))}
                placeholder="1.08500"
                className="bg-[#36393f] border-white/10 text-white"
                required
              />
            </div>

            {/* Take Profit */}
            <div>
              <Label htmlFor="takeProfit" className="text-white/70">Take Profit</Label>
              <Input
                id="takeProfit"
                value={formData.takeProfit}
                onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
                placeholder="1.09000"
                className="bg-[#36393f] border-white/10 text-white"
                required
              />
            </div>

            {/* Stop Loss */}
            <div>
              <Label htmlFor="stopLoss" className="text-white/70">Stop Loss</Label>
              <Input
                id="stopLoss"
                value={formData.stopLoss}
                onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
                placeholder="1.08200"
                className="bg-[#36393f] border-white/10 text-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white/70">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Confluence parfaite avec la résistance cassée..."
                className="bg-[#36393f] border-white/10 text-white resize-none"
                rows={3}
              />
            </div>

            {/* Upload d'image */}
            <div>
              <Label htmlFor="image" className="text-white/70">Image (optionnel)</Label>
              <div className="mt-1">
                {formData.image ? (
                  <div className="relative">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md border border-white/10"
                    />
                    <Button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: undefined }))}
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-md cursor-pointer hover:border-white/20 transition-colors">
                    <Upload className="h-8 w-8 text-white/50" />
                    <span className="text-sm text-white/50 mt-2">Cliquez pour ajouter une image</span>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1 border-white/10 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#7289da] hover:bg-[#5b6eae] text-white"
              >
                Publier le Signal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}