import { useEffect, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

interface LiveOneToOneProps {
  roomName: string;
  userId: string;
  identity?: string;
  isAdmin?: boolean;
  otherName?: string;
  onEnd?: () => void;
}

function SessionRoom({ isAdmin, otherName, onEnd }: { isAdmin: boolean; otherName?: string; onEnd?: () => void }) {
  const remoteTracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]).filter(t => !t.participant.isLocal);

  const remoteVideo = remoteTracks[0];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-white font-medium">Session avec {otherName || 'Admin'}</span>
        </div>
        <button
          onClick={onEnd}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
        >
          Terminer
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {remoteVideo ? (
          <VideoTrack trackRef={remoteVideo} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
            <p className="text-sm">En attente de la caméra...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <TrackToggle source={Track.Source.Microphone} className="flex flex-col items-center gap-1 text-xs text-gray-300" />
        <TrackToggle source={Track.Source.Camera} className="flex flex-col items-center gap-1 text-xs text-gray-300" />
      </div>
    </div>
  );
}

export default function LiveOneToOne({ roomName, userId, identity, isAdmin = false, otherName, onEnd }: LiveOneToOneProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId, identity, isPublisher: isAdmin }),
      });
      if (!res.ok) throw new Error('Erreur token');
      const data = await res.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch {
      setError('Impossible de rejoindre la session.');
    } finally {
      setLoading(false);
    }
  }, [roomName, userId, identity, isAdmin]);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 gap-3">
        <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
        <span className="text-sm">Connexion...</span>
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
      audio
      video
      style={{ height: '100%' }}
    >
      <RoomAudioRenderer />
      <SessionRoom isAdmin={isAdmin} otherName={otherName} onEnd={onEnd} />
    </LiveKitRoom>
  );
}
