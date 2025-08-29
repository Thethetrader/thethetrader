# Nettoyage Firebase Database

## Pour supprimer les messages dupliqués:

1. **Va sur** https://console.firebase.google.com/
2. **Sélectionne** ton projet "tradingpourlesnuls-e7da4"
3. **Clique "Realtime Database"** (menu de gauche)
4. **Clique sur "messages"**
5. **Supprime tous les messages** ou le dossier entier
6. **Clique "Confirm"**

## Ou via le code (temporaire):

```javascript
// Fonction de nettoyage (à supprimer après usage)
export const clearAllMessages = async () => {
  try {
    const messagesRef = ref(database, 'messages');
    await remove(messagesRef);
    console.log('✅ Tous les messages supprimés');
  } catch (error) {
    console.error('❌ Erreur suppression messages:', error);
  }
};
```

## Après nettoyage:
- Les messages dupliqués disparaîtront
- Les nouveaux messages seront uniques
- Le système de déduplication empêchera les futures duplications 