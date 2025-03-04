import random 
import os 
import json



class user_bot_respond:
    def __init__(self,message_user, identifiant):
        self.user_message = message_user
        self.bot_message  = ""
        self.identifiant  = identifiant

    def add_bot_respond(self,type="random"):
        if type=="random":
            self.bot_message = str(random.randint(0,100))

    



class Conversation:

    def __init__(self,ident):
        self.base_message = "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
        self.identifiant_conv = ident
        self.liste_user_bot_repond = {}   # on a un dictionnaire avec tout nos couple user-bot messages
        self.compteur_identifiant = 0     # un compteur qui nous permet de mettre un identifiant pour les coupe; user-bot messages
        self.arbre_message = {}           # structure d'abre pour sauvegarder l'odre des messages 
        # oui arbre_messge à une structure de graphe mais d'après l'implémentation on reste toujours dans le cas d'un arbre


    def add_message_user(self, message_parent_identifiant, new_message):
        self.compteur_identifiant += 1  # on incrément le compteur car nouveau message  
        
        new_user_bot_resond = user_bot_respond(new_message, self.compteur_identifiant)   # on initialise le nouveau couple question reponse
        new_user_bot_resond.add_bot_respond()    # on ajoute la réponse générer par notre bot
        
        self.arbre_message[self.compteur_identifiant] = []    # on ajoute un noeud dans notre arbre
        self.arbre_message[message_parent_identifiant].append(self.compteur_identifiant)

        self.liste_user_bot_repond[self.compteur_identifiant] = new_user_bot_resond


    def export_conversation_to_json(self, filename="conversation_export.json"):

        conversation_data = {
            "base_message": self.base_message,
            "identifiant_conv": self.identifiant_conv,
            "compteur_identifiant": self.compteur_identifiant,
            "arbre_message": self.arbre_message,
            "messages": {}
        }
        
        # Ajout des messages (couples user-bot)
        for id_message, user_bot_obj in self.liste_user_bot_repond.items():
            conversation_data["messages"][id_message] = {
                "user_message": user_bot_obj.user_message,
                "bot_message": user_bot_obj.bot_message,
                "identifiant": user_bot_obj.identifiant
            }
        
        # Écriture dans le fichier JSON
        with open(filename, 'w', encoding='utf-8') as json_file:
            json.dump(conversation_data, json_file, ensure_ascii=False, indent=4)
        
        # Retourne le chemin absolu du fichier créé
        return os.path.abspath(filename)


