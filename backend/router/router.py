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
    # Ajout d'une règle manuelle pour surclasser l'intention si mots-clés documentaires détectés
    document_keywords = [
        "histoire", "mission", "présentation", "origine", "création", "fondateur", "but", "objectif"
    ]
    # Ajout d'une règle manuelle pour surclasser l'intention si mots-clés d'aide/FAQ détectés
    aide_keywords = [
        "fonctionne", "fonctionnement", "utiliser", "mode d'emploi", "faq", "comment faire", "aide", "support", "explication", "explications", "guide", "tutoriel"
    ]
    msg_lower = message.lower()
    if intent != 'image':
        if any(kw in msg_lower for kw in aide_keywords):
            decision = 'aide'  # Surclassement aide/FAQ prioritaire
        elif any(kw in msg_lower for kw in document_keywords):
            decision = 'document'  # Surclassement document
    response = None
    response_type = None
    metadata = {"user_id": user_id, "intent": intent, "router_decision": decision}

    if decision == 'image':
        response = generate_image(message)
        response_type = 'image'
    elif decision == 'document':
        response = contextual_answer(message)
        response_type = 'text'
    elif decision == 'aide':
        response = "Voici la FAQ ou l'aide du chatbot. (Réponse simulée)"
        response_type = 'text'
    else:
        response = "Réponse simple locale."
        response_type = 'text'

    logging.info(f"Router decision: {decision} | User: {user_id} | Message: {message} | Intent: {intent}")
    return {"response": response, "type": response_type, "metadata": metadata}
