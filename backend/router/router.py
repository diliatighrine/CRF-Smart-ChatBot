"""
Module de routage intelligent pour le chatbot CRF.
Analyse le message utilisateur et redirige vers le module approprié (image, RAG, aide, simple).
"""

import logging
from functions.image_generator import generate_image
from functions.rag import contextual_answer

logging.basicConfig(level=logging.INFO)

def route_request(message, user_id):
    """
    Analyse le message et décide du module à appeler.
    Args:
        message (str): Message utilisateur.
        user_id (str): Identifiant utilisateur.
    Returns:
        dict: Réponse structurée avec type, contenu et métadonnées.
    """
    message_lower = message.lower()
    decision = None
    response = None
    response_type = None
    metadata = {"user_id": user_id}

    if 'image' in message_lower:
        decision = 'image_generation'
        response = generate_image(message)
        response_type = 'image'
    elif 'document' in message_lower:
        decision = 'rag_search'
        response = contextual_answer(message)
        response_type = 'text'
    elif 'aide' in message_lower or 'faq' in message_lower:
        decision = 'help_faq'
        response = "Voici la FAQ ou l'aide du chatbot. (Réponse simulée)"
        response_type = 'text'
    else:
        decision = 'simple_local_response'
        response = "Réponse simple locale."
        response_type = 'text'

    metadata['router_decision'] = decision
    logging.info(f"Router decision: {decision} | User: {user_id} | Message: {message}")
    return {"response": response, "type": response_type, "metadata": metadata}
