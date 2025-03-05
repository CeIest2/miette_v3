const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { Conversation } = require('./src/conversation');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de l'application
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des dossiers statiques avec options de mise en cache
app.use('/static', express.static(path.join(__dirname, 'static'), {
  maxAge: 0,  // Désactive la mise en cache côté client
  etag: false // Désactive les ETags
}));
app.use(express.static(path.join(__dirname, 'templates'), {
  maxAge: 0,
  etag: false
}));

// Configuration de la session
app.use(session({
  secret: require('crypto').randomBytes(24).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Mettre à true en production avec HTTPS
}));

// Middleware pour initialiser la conversation si elle n'existe pas
app.use((req, res, next) => {
  if (!req.session.conversationId) {
    // Générer un identifiant unique pour la conversation
    req.session.conversationId = Date.now().toString();
    // Créer une nouvelle conversation
    const conversation = new Conversation(req.session.conversationId);
    
    // Initialiser avec l'arbre de messages (la racine est 0)
    conversation.arbre_message[0] = [];
    
    // Sauvegarder la conversation
    saveConversation(conversation);
  }
  next();
});

// Route principale pour le chat - renvoie simplement le fichier HTML
app.get('/', (req, res) => {
  try {
    // Lire le fichier HTML et le CSS
    let htmlContent = fs.readFileSync(path.join(__dirname, 'templates', 'chat.html'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, 'static', 'style.css'), 'utf8');
    
    // Remplacer la référence au CSS externe par le contenu CSS inline
    htmlContent = htmlContent.replace(
      /<link rel="preload"[^>]*>[\s]*<link rel="stylesheet" href="\/static\/style.css">/,
      `<style>${cssContent}</style>`
    );
    
    res.send(htmlContent);
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers:', error);
    res.sendFile(path.join(__dirname, 'templates', 'chat.html'));
  }
});

// API pour récupérer les messages
app.get('/api/messages', (req, res) => {
  const conversation = loadConversation(req.session.conversationId);
  
  // Préparation des messages pour l'affichage
  const messages = [];
  // Ajouter le message de base du bot
  messages.push({"sender": "Bot", "text": conversation.base_message, "id": 0});
  
  // Construire la liste des messages de façon plate pour l'affichage
  Object.entries(conversation.liste_user_bot_repond).forEach(([id, messageObj]) => {
    messages.push({"sender": "Vous", "text": messageObj.user_message, "id": messageObj.identifiant});
    messages.push({"sender": "Bot", "text": messageObj.bot_message, "id": messageObj.identifiant});
  });
  
  res.json({
    messages: messages,
    current_message_id: 0 // Par défaut, les nouveaux messages sont des réponses au message de base
  });
});

// Route pour envoyer un message
app.post('/api/messages', (req, res) => {
  const { message, parent_id } = req.body;
  const parentId = parseInt(parent_id || 0);
  
  const conversation = loadConversation(req.session.conversationId);
  
  // Ajouter le message de l'utilisateur à la conversation
  conversation.add_message_user(parentId, message);
  
  // Sauvegarder la conversation mise à jour
  saveConversation(conversation);
  
  // Renvoyer le nouveau message et la réponse du bot
  const newMessageId = conversation.compteur_identifiant;
  const newMessage = conversation.liste_user_bot_repond[newMessageId];
  
  res.json({
    userMessage: {"sender": "Vous", "text": newMessage.user_message, "id": newMessage.identifiant},
    botMessage: {"sender": "Bot", "text": newMessage.bot_message, "id": newMessage.identifiant}
  });
});

// Fonction pour charger une conversation depuis le stockage
function loadConversation(id) {
  const filePath = path.join(__dirname, 'data', `conversation_${id}.json`);
  
  try {
    if (fs.existsSync(filePath)) {
      const conversationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const conversation = new Conversation(conversationData.identifiant_conv);
      
      // Restaurer les propriétés de la conversation
      conversation.base_message = conversationData.base_message;
      conversation.compteur_identifiant = conversationData.compteur_identifiant;
      conversation.arbre_message = conversationData.arbre_message;
      
      // Restaurer les messages de la conversation
      Object.entries(conversationData.messages).forEach(([id, messageData]) => {
        const messageObj = {
          user_message: messageData.user_message,
          bot_message: messageData.bot_message,
          identifiant: messageData.identifiant
        };
        conversation.liste_user_bot_repond[id] = messageObj;
      });
      
      return conversation;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la conversation:', error);
  }
  
  // Retourner une nouvelle conversation si la conversation n'existe pas ou en cas d'erreur
  return new Conversation(id);
}

// Fonction pour sauvegarder une conversation
function saveConversation(conversation) {
  // S'assurer que le répertoire de données existe
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, `conversation_${conversation.identifiant_conv}.json`);
  
  // Convertir la conversation en format JSON compatible avec le format existant
  const conversationData = {
    base_message: conversation.base_message,
    identifiant_conv: conversation.identifiant_conv,
    compteur_identifiant: conversation.compteur_identifiant,
    arbre_message: conversation.arbre_message,
    messages: {}
  };
  
  // Ajouter les messages (couples user-bot)
  Object.entries(conversation.liste_user_bot_repond).forEach(([id, messageObj]) => {
    conversationData.messages[id] = {
      user_message: messageObj.user_message,
      bot_message: messageObj.bot_message,
      identifiant: messageObj.identifiant
    };
  });
  
  // Écriture dans le fichier JSON
  fs.writeFileSync(filePath, JSON.stringify(conversationData, null, 4), 'utf8');
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});