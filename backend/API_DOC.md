# Documentation de l'API Backend

> **Avant de lancer le backend, installez les dépendances Python avec :**
> ```bash
> pip install -r requirements.txt
> ```

## Structure des fichiers et dossiers du backend

- `app.py` : Point d'entrée de l'application Flask. Définit l'API REST `/chat` et gère la réception des requêtes du frontend.
- `requirements.txt` : Liste des dépendances Python nécessaires au backend (Flask, requests, python-dotenv, deep-translator, transformers, torch).
- `API_DOC.md` : Ce fichier, documentation technique et fonctionnelle du backend.
- `documents/` : Dossier contenant les fichiers texte utilisés comme base documentaire pour la recherche contextuelle (RAG).
    - `contact.txt`, `crf_presentation.txt`, `missions.txt`, `historique.txt` : Exemples de documents utilisés par le module RAG.
- `functions/` : Dossier des modules fonctionnels du backend.
    - `image_generator.py` : Module de génération d'images. Utilise l'API Stability.ai (Stable Diffusion) pour générer une image à partir d'un prompt utilisateur (avec traduction automatique en anglais si besoin). Retourne une image encodée en base64 (data URL).
    - `rag.py` : Module de recherche contextuelle (RAG). Recherche la réponse la plus pertinente dans les fichiers du dossier `documents/` en fonction de la question utilisateur.
    - `intent_classifier.py` : Classifieur d'intention basé sur DistilBERT (modèle Hugging Face). Permet de détecter automatiquement l'intention d'un message utilisateur (image, document, aide, simple) pour un routage intelligent dans le backend.
    - `__pycache__/` : Dossier généré automatiquement par Python pour accélérer l'exécution (à ignorer dans le versionnement).
- `router/` : Dossier contenant la logique de routage intelligent.
    - `router.py` : Router principal. Analyse chaque message utilisateur, utilise le classifieur d'intention, et redirige la requête vers le bon module (image, RAG, aide, simple). Logue chaque décision d'aiguillage.
    - `__pycache__/` : Dossier généré automatiquement par Python pour accélérer l'exécution (à ignorer dans le versionnement).

## Fichiers et modules spécifiques

- `functions/intent_classifier.py` :
  Classifieur d'intention basé sur DistilBERT (modèle Hugging Face). Permet de détecter automatiquement l'intention d'un message utilisateur (image, document, aide, simple) pour un routage intelligent dans le backend.
  
- Dépendances associées :
  - `transformers` : bibliothèque pour utiliser des modèles de NLP pré-entraînés (ici DistilBERT).
  - `torch` : backend nécessaire pour faire tourner les modèles de deep learning.

## Endpoint principal

POST `/chat`

- **Description** : Envoie un message à l'assistant intelligent et reçoit une réponse adaptée (texte, image, ou aide).
- **Body (JSON)** :
  - `message` (string, requis) : Message de l'utilisateur.
  - `user_id` (string, optionnel) : Identifiant utilisateur.

### Exemple de requête
```json
{
  "message": "document bénévolat",
  "user_id": "test"
}
```

### Exemple de réponse (texte)
```json
{
  "response": "Réponse extraite du document 'crf_presentation.txt' : La Croix-Rouge Française (CRF) est une association d'aide humanitaire fondée en 1864. Elle intervient dans les domaines du secourisme, de l'action sociale, de la formation et du bénévolat.",
  "type": "text",
  "metadata": {
    "user_id": "test",
    "router_decision": "rag_search"
  }
}
```

### Exemple de réponse (image)
```json
{
  "response": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
  "type": "image",
  "metadata": {
    "user_id": "test",
    "router_decision": "image_generation"
  }
}
```

### Exemple de réponse (erreur)
```json
{
  "error": "Le champ 'message' est requis et ne peut pas être vide."
}
```

- **Remarque** : Le backend analyse le message et choisit dynamiquement le module adapté (génération d'image, recherche documentaire, aide, etc.).

## Gestion des erreurs

L'API peut retourner différents messages d'erreur selon la situation. Voici les principaux cas gérés :

### 1. Message vide ou manquant
- **Code HTTP** : 400
- **Réponse** :
```json
{
  "error": "Le champ 'message' est requis et ne peut pas être vide."
}
```
- **Cause** : Le champ `message` est absent, vide ou non valide dans la requête.

### 2. Aucun document pertinent trouvé (RAG)
- **Code HTTP** : 200 (réponse normale, mais message d'information)
- **Réponse** :
```json
{
  "response": "Aucun document pertinent trouvé pour votre question.",
  "type": "text",
  "metadata": {
    "user_id": "...",
    "router_decision": "rag_search"
  }
}
```
- **Cause** : La recherche contextuelle n'a trouvé aucun document correspondant à la question.

### 3. Cas d'erreur interne (exemple générique)
- **Code HTTP** : 500
- **Réponse** :
```json
{
  "error": "Une erreur interne est survenue."
}
```
- **Cause** : Exception inattendue côté serveur (non prévue dans le flux normal).

**Remarque** :
- Le frontend doit toujours vérifier la présence d'une clé `error` dans la réponse pour gérer les cas d'échec.
- Les erreurs sont retournées au format JSON pour faciliter le traitement côté client.
