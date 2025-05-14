# Documentation de l'API Backend

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
  "response": "https://via.placeholder.com/300x200.png?text=g%C3%A9n%C3%A8re+une+image+de+la+CRF",
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
