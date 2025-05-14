"""
Module de recherche contextuelle (RAG) pour le chatbot CRF.
Ce module lit les fichiers texte du dossier documents et retourne le contenu le plus pertinent selon la question.
"""

import os
import difflib

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'documents')

def load_documents():
    """
    Charge tous les documents texte du dossier documents.
    Returns:
        dict: Dictionnaire {nom_fichier: contenu}
    """
    docs = {}
    for fname in os.listdir(DOCUMENTS_DIR):
        if fname.endswith('.txt'):
            with open(os.path.join(DOCUMENTS_DIR, fname), encoding='utf-8') as f:
                docs[fname] = f.read()
    return docs

def contextual_answer(question):
    """
    Recherche le document le plus pertinent pour répondre à la question.
    Args:
        question (str): La question posée par l'utilisateur.
    Returns:
        str: Extrait du document le plus pertinent ou message d'absence de résultat.
    """
    docs = load_documents()
    best_match = None
    best_score = 0
    for fname, content in docs.items():
        score = difflib.SequenceMatcher(None, question.lower(), content.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = (fname, content)
    if best_match and best_score > 0.1:
        return f"Réponse extraite du document '{best_match[0]}' : {best_match[1][:200]}"
    else:
        return "Aucun document pertinent trouvé pour votre question."
