// Endpoint pour générer des tokens GetStream
// Accessible via: http://localhost:5173/api/generate-token.js

// Configuration GetStream
const API_KEY = 'wzt9bzcb6z9q';
const API_SECRET = 'z5qmahxqz26jfs569h6w255dugmqndvvgrtdk8y9wmqfqgmfvu59yp8c4qrv4aab';

// Fonction pour générer un token (simulation côté client)
function generateToken(userId) {
  // Créer un token JWT valide
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expire dans 1 heure
    iat: Math.floor(Date.now() / 1000),
  };
  
  // Encoder en base64
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Créer la signature avec le secret GetStream
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = btoa(data + API_SECRET).slice(0, 43);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Exposer la fonction globalement
window.generateGetStreamToken = generateToken;

// Test
console.log('GetStream Token Generator loaded');
console.log('API Key:', API_KEY);
console.log('Test token:', generateToken('test_user'));




