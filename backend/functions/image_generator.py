"""
Module de génération d'images pour le chatbot CRF.
La fonction generate_image utilise l'API Stability.ai (Stable Diffusion) pour générer une image à partir du prompt fourni.
"""

import os
import requests
from dotenv import load_dotenv
from deep_translator import GoogleTranslator

# Charger automatiquement les variables d'environnement du fichier .env
load_dotenv()


def generate_image(prompt):
    """
    Génère une image via l'API Stability.ai (Stable Diffusion) et retourne l'URL de l'image générée.
    Args:
        prompt (str): Le texte décrivant l'image à générer.
    Returns:
        str: URL de l'image générée ou message d'erreur.
    """
    api_key = os.getenv('STABILITY_API_KEY')
    if not api_key:
        return "Erreur : clé API Stability.ai non trouvée (variable d'environnement STABILITY_API_KEY)."
    # Traduire automatiquement le prompt en anglais si besoin
    try:
        prompt_en = GoogleTranslator(source='auto', target='en').translate(prompt)
    except Exception as e:
        prompt_en = prompt  # fallback : envoie le prompt original si la traduction échoue
    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }
    # Envoi en multipart/form-data
    files = {
        'prompt': (None, prompt_en),
        'output_format': (None, 'png')
    }
    try:
        response = requests.post(url, headers=headers, files=files, timeout=60)
        response.raise_for_status()
        # L'API retourne l'image en binaire (content-type: image/png)
        if response.headers.get('content-type', '').startswith('image/'):
            import base64
            img_b64 = base64.b64encode(response.content).decode('utf-8')
            return f"data:image/png;base64,{img_b64}"
        # Sinon, retourne le message d'erreur JSON
        result = response.json()
        return result.get("image") or result.get("artifacts", [{}])[0].get("url", "Erreur : pas d'URL d'image retournée.")
    except Exception as e:
        try:
            # Affiche le message d'erreur détaillé de l'API Stability.ai
            err_json = response.json()
            return f"Erreur Stability.ai : {err_json.get('message', str(err_json))}"
        except Exception:
            return f"Erreur lors de la génération d'image : {e}"
