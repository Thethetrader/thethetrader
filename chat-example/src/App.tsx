import { useState, useEffect } from 'react';
import type { User, Channel as StreamChannel } from 'stream-chat';
import { useCreateChatClient, Chat, Channel, ChannelHeader, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';

import './layout.css';

// Configuration GetStream avec tes vraies clés
const apiKey = 'apk7cmaduwd3';
const userId = 'user_1';
const userName = 'Test User';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: (userId) => {
      // Utiliser devToken pour le développement
      const StreamChat = require('stream-chat').StreamChat;
      const tempClient = new StreamChat(apiKey);
      return tempClient.devToken(userId);
    },
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const channel = client.channel('messaging', 'live-chat', {
      image: 'https://getstream.io/random_png/?name=chat',
      name: 'Chat Live',
      members: [userId],
    });

    setChannel(channel);
  }, [client]);

  if (!client) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#4fc3f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🚀 Configuration client GetStream...</h2>
          <p>Connexion en cours</p>
        </div>
      </div>
    );
  }

  return (
    <Chat client={client} theme='str-chat__theme-custom'>
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default App;