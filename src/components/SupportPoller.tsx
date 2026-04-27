import { useEffect, useRef } from 'react';

const GET_URL = '/.netlify/functions/get-conversation';

interface Props {
  userId: string;
  isOnSupportChannel: boolean;
  onNewAdminMessage: () => void;
}

export default function SupportPoller({ userId, isOnSupportChannel, onNewAdminMessage }: Props) {
  const lastSeenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      if (isOnSupportChannel) return;
      const convId = localStorage.getItem(`tplnchat_conv_${userId}`);
      if (!convId) return;

      try {
        const params = new URLSearchParams({ conversation_id: convId });
        if (lastSeenRef.current) params.set('since', lastSeenRef.current);
        const res = await fetch(`${GET_URL}?${params}`);
        if (!res.ok) return;
        const json = await res.json() as { messages: Array<{ id: string; sender_type: string; created_at: string }> };
        if (!json.messages?.length) return;
        const adminMsgs = json.messages.filter(m => m.sender_type === 'admin');
        if (adminMsgs.length > 0) onNewAdminMessage();
        lastSeenRef.current = json.messages[json.messages.length - 1].created_at;
      } catch {}
    };

    pollRef.current = setInterval(poll, 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId, isOnSupportChannel, onNewAdminMessage]);

  // Reset lastSeen when user opens Support so we don't re-trigger badge
  useEffect(() => {
    if (isOnSupportChannel) lastSeenRef.current = null;
  }, [isOnSupportChannel]);

  return null;
}
