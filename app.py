from flask import Flask, request, render_template
import random

app = Flask(__name__)
messages = []  # Stockage en mémoire (pas de DB pour l'instant)

@app.route("/", methods=["GET", "POST"])
def chat():
    if request.method == "POST":
        user_message = request.form.get("message")
        if user_message.strip():
            # Ajoute message utilisateur + réponse aléatoire
            bot_response = f"Réponse du serveur : {random.randint(0, 100)}"
            messages.append(("Vous", user_message))
            messages.append(("Bot", bot_response))
    
    return render_template("chat.html", messages=messages)

if __name__ == "__main__":
    app.run(debug=True)