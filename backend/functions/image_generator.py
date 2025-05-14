"""
Module de génération d'images simulée pour le chatbot CRF.
La fonction generate_image retourne une URL d'image personnalisée selon le prompt fourni.
"""

import urllib.parse


def generate_image(prompt):
    """
    Génère une URL d'image fictive personnalisée à partir du prompt utilisateur.
    Args:
        prompt (str): Le texte décrivant l'image à générer.
    Returns:
        str: URL de l'image générée (mock).
    """
    prompt_encoded = urllib.parse.quote_plus(prompt)
    return f"https://via.placeholder.com/300x200.png?text={prompt_encoded}"
