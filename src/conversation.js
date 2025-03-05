/**
 * Classe représentant un couple message utilisateur / réponse bot
 */
class UserBotRespond {
    /**
     * Crée un nouvel objet UserBotRespond
     * @param {string} message_user - Le message de l'utilisateur
     * @param {number} identifiant - L'identifiant unique du message
     */
    constructor(message_user, identifiant) {
        this.user_message = message_user;
        this.bot_message = "";
        this.identifiant = identifiant;
    }

    /**
     * Ajoute une réponse du bot au message de l'utilisateur
     * @param {string} type - Le type de réponse à générer (par défaut: "random")
     */
    add_bot_respond(type = "random") {
        if (type === "random") {
            this.bot_message = String(Math.floor(Math.random() * 101)); // Nombre aléatoire entre 0 et 100
        }
    }
}

/**
 * Classe représentant une conversation entre un utilisateur et un bot
 */
class Conversation {
    /**
     * Crée une nouvelle conversation
     * @param {string} ident - L'identifiant unique de la conversation
     */
    constructor(ident) {
        this.base_message = "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
        this.identifiant_conv = ident;
        this.liste_user_bot_repond = {};  // Dictionnaire contenant les couples user-bot messages
        this.compteur_identifiant = 0;    // Compteur pour les identifiants des couples user-bot messages
        this.arbre_message = {};          // Structure d'arbre pour sauvegarder l'ordre des messages
    }

    /**
     * Ajoute un nouveau message utilisateur à la conversation
     * @param {number} message_parent_identifiant - L'identifiant du message parent
     * @param {string} new_message - Le nouveau message de l'utilisateur
     */
    add_message_user(message_parent_identifiant, new_message) {
        this.compteur_identifiant += 1;  // Incrémentation du compteur pour le nouveau message
        
        // Initialisation du nouveau couple question-réponse
        const new_user_bot_respond = new UserBotRespond(new_message, this.compteur_identifiant);
        new_user_bot_respond.add_bot_respond();  // Ajout de la réponse générée par le bot
        
        // Création d'un nouveau nœud dans l'arbre des messages
        if (!this.arbre_message[this.compteur_identifiant]) {
            this.arbre_message[this.compteur_identifiant] = [];
        }
        
        // Ajout du lien parent-enfant dans l'arbre
        if (!this.arbre_message[message_parent_identifiant]) {
            this.arbre_message[message_parent_identifiant] = [];
        }
        this.arbre_message[message_parent_identifiant].push(this.compteur_identifiant);
        
        // Stockage du couple dans le dictionnaire
        this.liste_user_bot_repond[this.compteur_identifiant] = new_user_bot_respond;
    }

    /**
     * Exporte la conversation au format JSON
     * @param {string} filename - Le nom du fichier pour l'export (par défaut: "conversation_export.json")
     * @returns {string} - Le chemin absolu du fichier créé
     */
    export_conversation_to_json(filename = "conversation_export.json") {
        const fs = require('fs');
        const path = require('path');
        
        const conversation_data = {
            base_message: this.base_message,
            identifiant_conv: this.identifiant_conv,
            compteur_identifiant: this.compteur_identifiant,
            arbre_message: this.arbre_message,
            messages: {}
        };
        
        // Ajout des messages (couples user-bot)
        Object.entries(this.liste_user_bot_repond).forEach(([id_message, user_bot_obj]) => {
            conversation_data.messages[id_message] = {
                user_message: user_bot_obj.user_message,
                bot_message: user_bot_obj.bot_message,
                identifiant: user_bot_obj.identifiant
            };
        });
        
        // Écriture dans le fichier JSON
        fs.writeFileSync(filename, JSON.stringify(conversation_data, null, 4), 'utf8');
        
        // Retourne le chemin absolu du fichier créé
        return path.resolve(filename);
    }
}

module.exports = {
    UserBotRespond,
    Conversation
};