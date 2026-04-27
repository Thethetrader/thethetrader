import { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';

interface LiveStreamViewerProps {
  roomName: string;
  userId: string;
  identity?: string;
  label: string;
}

function StreamDisplay({ label }: { label: string }) {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]).filter(t => t.participant.isAgent === false && !t.participant.isLocal);

  const videoTrack = tracks[0];

  if (!videoTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-sm">Stream hors ligne</p>
        <p className="text-xs text-gray-500">En attente de {label}...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <VideoTrack trackRef={videoTrack} className="w-full h-full object-contain" />
    </div>
  );
}

export default function LiveStreamViewer({ roomName, userId, identity, label }: LiveStreamViewerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId, identity }),
      });
      if (res.status === 403) {
        setError('premium');
        return;
      }
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch {
      setError('Impossible de rejoindre le stream.');
    } finally {
      setLoading(false);
    }
  }, [roomName, userId, identity]);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 gap-3">
        <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
        <span className="text-sm">Connexion au stream...</span>
      </div>
    );
  }

  if (error === 'premium') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <span className="text-3xl">⭐</span>
        </div>
        <p className="text-white font-semibold">Contenu Premium</p>
        <p className="text-gray-400 text-sm">Ce livestream est réservé aux membres premium.</p>
        <a href="/premium" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-semibold transition-colors">
          Devenir Premium
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <p className="text-sm">{error}</p>
        <button onClick={fetchToken} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">
          Réessayer
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) return null;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio={false}
      video={false}
      onConnectionStateChanged={setConnectionState}
      style={{ height: '100%', background: '#111827' }}
    >
      <RoomAudioRenderer />
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          {connectionState === ConnectionState.Connected && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
          <span className="text-sm text-white font-medium">{label}</span>
        </div>
        {/* Video */}
        <div className="flex-1 bg-black relative overflow-hidden">
          <StreamDisplay label={label} />
        </div>
      </div>
    </LiveKitRoom>
  );
}
