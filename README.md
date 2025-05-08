# CRF-Smart-ChatBot
CRF Smart ChatBot

Assistant intelligent développé pour la Croix-Rouge Française (CRF). Ce chatbot intelligent utilise des technologies avancées de Function Calling, de génération d'images, et de recherche contextuelle (RAG). Il est conçu pour être flexible et évolutif grâce à une architecture multicouche, permettant de traiter des requêtes en local ou via des modèles distants.

## Objectifs du Projet

- Améliorer les capacités du chatbot existant en ajoutant des fonctionnalités avancées.
- Fonctionnalités principales :
  - Génération d'images à partir de texte (via DALL·E ou API équivalente).
  - Recherche contextuelle (RAG) pour enrichir les réponses avec des données externes.
  - Routage intelligent des requêtes vers des services locaux ou distants en fonction de la charge.
  - Architecture multicouche pour optimiser les ressources backend et frontend.

## Structure du Projet

### Backend (API)

Le backend fournit des services pour le traitement des requêtes, incluant la gestion du routage des tâches, la génération d'images et la recherche contextuelle.

- Technologies utilisées :
- Structure :
  - `app.py` : Point d'entrée de l’application.
  - `router/` : Gestion des routes et logique de routage des requêtes.
  - `functions/` : Modules pour la génération d'images et la recherche RAG.
  - `requirements.txt` : Liste des dépendances Python.

### Frontend (UI)

L’interface utilisateur permet aux utilisateurs d’interagir avec le chatbot.

- Technologies utilisées : Angular ou React (en fonction de la préférence de l’équipe)
- Structure :
  - `src/` : Composants, services, et logique frontend.
  - `package.json` : Dépendances JavaScript.

### Documents

Le dossier `docs/` contient les documents relatifs à la conception du projet, y compris les spécifications techniques, les diagrammes, et le cahier des charges.
