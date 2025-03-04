from flask import Flask, request, render_template, session
from src.conv_classe import Conversation
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Nécessaire pour utiliser les sessions

@app.route("/", methods=["GET", "POST"])
def chat():
    if session["conversation"]:
        id_conv = session["conversation"]
if __name__ == "__main__":
    app.run(debug=True)