"""
Module de routage intelligent pour le chatbot CRF.
Analyse le message utilisateur et redirige vers le module approprié (image, RAG, aide, simple).
"""

import logging
from functions.image_generator import generate_image
from functions.rag import contextual_answer
from functions.intent_classifier import classify_intent

logging.basicConfig(level=logging.INFO)

def route_request(message, user_id):
    """
    Analyse le message et décide du module à appeler (avec analyseur d'intention DistilBERT).
    Args:
        message (str): Message utilisateur.
        user_id (str): Identifiant utilisateur.
    Returns:
        dict: Réponse structurée avec type, contenu et métadonnées.
    """
    intent = classify_intent(message)
    decision = intent
    response = None
    response_type = None
    metadata = {"user_id": user_id, "intent": intent}

    if intent == 'image':
        response = generate_image(message)
        response_type = 'image'
    elif intent == 'document':
        response = contextual_answer(message)
        response_type = 'text'
    elif intent == 'aide':
        response = "Voici la FAQ ou l'aide du chatbot. (Réponse simulée)"
        response_type = 'text'
    else:
        response = "Réponse simple locale."
        response_type = 'text'

    metadata['router_decision'] = decision
    logging.info(f"Router decision: {decision} | User: {user_id} | Message: {message} | Intent: {intent}")
    return {"response": response, "type": response_type, "metadata": metadata}
