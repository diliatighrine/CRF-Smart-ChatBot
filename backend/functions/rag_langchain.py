"""
Module RAG avancé basé sur LangChain (Python) pour la recherche sémantique dans les documents locaux.
"""

import os
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'documents')

# Initialisation des embeddings (sentence-transformers)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Chargement et découpage des documents
def load_and_split_documents():
    docs = []
    for fname in os.listdir(DOCUMENTS_DIR):
        if fname.endswith('.txt'):
            with open(os.path.join(DOCUMENTS_DIR, fname), encoding='utf-8') as f:
                content = f.read()
                # On splitte en passages de 300 caractères max
                splitter = CharacterTextSplitter(chunk_size=300, chunk_overlap=30)
                for chunk in splitter.split_text(content):
                    docs.append(Document(page_content=chunk, metadata={"source": fname}))
    return docs

# Indexation FAISS (en RAM, rapide pour petit corpus)
def build_vectorstore():
    docs = load_and_split_documents()
    return FAISS.from_documents(docs, embeddings)

vectorstore = build_vectorstore()

def rag_langchain_answer(question, k=1):
    """
    Recherche sémantique dans les documents via LangChain + FAISS.
    Args:
        question (str): Question utilisateur.
        k (int): Nombre de passages à retourner.
    Returns:
        str: Passage le plus pertinent trouvé.
    """
    results = vectorstore.similarity_search(question, k=k)
    if results:
        passage = results[0].page_content
        source = results[0].metadata.get("source", "?")
        return f"Réponse sémantique extraite de '{source}' : {passage}"
    else:
        return "Aucun passage pertinent trouvé (RAG LangChain)."
