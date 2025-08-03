import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AddSignalModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
}

export const AddSignalModal: React.FC<AddSignalModalProps> = ({ open, onClose, channelId }) => {
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [entry, setEntry] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!symbol.trim() || !timeframe.trim() || !entry || !tp || !sl) {
      setError('Tous les champs sont requis');
      return;
    }
    const entryNum = parseFloat(entry);
    const tpNum = parseFloat(tp);
    const slNum = parseFloat(sl);
    if (isNaN(entryNum) || isNaN(tpNum) || isNaN(slNum)) {
      setError('Entrée, TP et SL doivent être des nombres');
      return;
    }
    const risk = Math.abs(entryNum - slNum);
    const reward = Math.abs(tpNum - entryNum);
    const ratio = risk === 0 ? 0 : reward / risk;
    const generatedText = `✅ Signal ${direction} ${symbol.toUpperCase()} - ${timeframe}\n\n` +
      `🔹 Entrée : ${entry} USD\n` +
      `🔹 Take Profit : ${tp} USD\n` +
      `🔹 Stop Loss : ${sl} USD\n` +
      `🎯 Ratio R:R ≈ ${ratio.toFixed(2)}`;
    setText(generatedText);
    try {
      setLoading(true);
      const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : Date.now().toString();
      const imageUrls: string[] = [];

      // Convert images to base64 for localStorage
      if (files) {
        for (let i = 0; i < Math.min(files.length, 2); i++) {
          const file = files[i];
          const reader = new FileReader();
          const imageBase64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          imageUrls.push(imageBase64);
        }
      }

      const insertData = {
        id,
        text: generatedText,
        image1: imageUrls[0] || null,
        image2: imageUrls[1] || '',
        created_at: new Date().toISOString(),
        status: 'ACTIVE' as const,
        channel_id: channelId,
      };

      // Save to localStorage for now
      const existingSignals = JSON.parse(localStorage.getItem('signals') || '[]');
      existingSignals.unshift(insertData);
      localStorage.setItem('signals', JSON.stringify(existingSignals));

      // Envoyer notification push
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('TheTheTrader - Nouveau Signal', {
          body: `${direction} ${symbol.toUpperCase()} - ${timeframe}`,
          icon: '/favicon.png',
          badge: '/favicon.png',
          data: {
            signalId: id,
            channelId: channelId
          }
        });
      } catch (error) {
        console.log('Erreur notification:', error);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 w-full max-w-lg rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Ajouter un signal</h2>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as 'BUY' | 'SELL')} className="w-full p-2 bg-gray-700 rounded text-white">
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Symbole</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white" placeholder="BTCUSD" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Timeframe</label>
              <input value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white" placeholder="1 min" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Entrée</label>
              <input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Take Profit</label>
              <input type="number" value={tp} onChange={(e) => setTp(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Stop Loss</label>
              <input type="number" value={sl} onChange={(e) => setSl(e.target.value)} className="w-full p-2 bg-gray-700 rounded text-white" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="w-full text-sm text-gray-300"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              {loading ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 