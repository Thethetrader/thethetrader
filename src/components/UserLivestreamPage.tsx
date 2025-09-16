import React, { useState } from 'react';

function UserLivestreamPage() {
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Livestream Trading</h1>
      
      <button onClick={() => setIsLiveActive(!isLiveActive)}>
        {isLiveActive ? 'Arrêter Live' : 'Démarrer Live'}
      </button>
      
      {isLiveActive && (
        <iframe
          src="https://tote-livestream-033.app.100ms.live/streaming/meeting/hzs-ukns-nts"
          width="100%"
          height="600px"
          style={{ marginTop: '20px', border: 'none' }}
        />
      )}
    </div>
  );
}

export default UserLivestreamPage;
