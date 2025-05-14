"""
Classifieur d'intention basé sur DistilBERT pour le chatbot CRF.
Utilise un modèle pré-entraîné pour classer les messages selon les intentions : image, document, aide, simple.
"""

from transformers import pipeline

# Labels d'intention
INTENT_LABELS = [
    "image",
    "document",
    "aide",
    "simple"
]

# Prompt d'instruction pour la classification
INSTRUCTION = (
    "Classifie le message utilisateur dans l'une des catégories suivantes : "
    "image, document, aide, simple. "
    "Réponds uniquement par le label correspondant."
)

# Initialisation du pipeline zero-shot (DistilBERT)
classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")

def classify_intent(message):
    """
    Classe le message utilisateur dans une intention parmi les labels prédéfinis.
    Args:
        message (str): Message utilisateur.
    Returns:
        str: Label d'intention le plus probable.
    """
    try:
        result = classifier(message, INTENT_LABELS)
        return result['labels'][0]
    except Exception as e:
        return "simple"  # fallback en cas d'erreur
