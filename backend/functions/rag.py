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
    # Mapping mots-clés documentaires → fichiers
    keyword_to_file = {
        "histoire": "historique.txt",
        "historique": "historique.txt",
        "mission": "missions.txt",
        "missions": "missions.txt",
        "présentation": "crf_presentation.txt",
        "presentation": "crf_presentation.txt",
        "contact": "contact.txt",
        "origine": "historique.txt",
        "création": "historique.txt",
        "fondateur": "historique.txt",
        "but": "missions.txt",
        "objectif": "missions.txt"
    }
    question_lower = question.lower()
    selected_file = None
    for kw, fname in keyword_to_file.items():
        if kw in question_lower:
            if fname in docs:
                selected_file = fname
                break
    best_match = None
    best_score = 0
    if selected_file:
        # Priorité au fichier associé au mot-clé
        content = docs[selected_file]
        score = difflib.SequenceMatcher(None, question_lower, content.lower()).ratio()
        if score > 0.1:
            return f"Réponse extraite du document '{selected_file}' : {content[:200]}"
        # Si le score est trop faible, fallback sur la recherche classique
    for fname, content in docs.items():
        score = difflib.SequenceMatcher(None, question_lower, content.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = (fname, content)
    if best_match and best_score > 0.1:
        return f"Réponse extraite du document '{best_match[0]}' : {best_match[1][:200]}"
    else:
        return "Aucun document pertinent trouvé pour votre question."
