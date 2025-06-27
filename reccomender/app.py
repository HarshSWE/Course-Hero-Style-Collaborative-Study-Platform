from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import requests
import numpy as np  

app = Flask(__name__)
CORS(app)

def load_file_metadata():
    """
    Fetch file metadata from an internal API endpoint,
    then combine 'course' and 'school' columns into a single 'text' column for similarity analysis.
    Returns a pandas DataFrame.
    """
    # Get Metadata from Node.js API
    res = requests.get("http://localhost:5000/file/metadata")
    data = res.json()
    # Convert to DataFrame
    df = pd.DataFrame(data)
    # Concatenate course and school info into one string
    df['text'] = df['course'] + " " + df['school']
    return df

def build_similarity_matrix():
    """
    Load the metadata, create a TF-IDF vectorizer,
    and generate the TF-IDF matrix for the combined text data.
    Returns the DataFrame, vectorizer, and TF-IDF matrix.
    """
    df = load_file_metadata()
    vectorizer = TfidfVectorizer()
    # Convert text data into TF-IDF vectors
    tfidf_matrix = vectorizer.fit_transform(df['text'])
    return df, vectorizer, tfidf_matrix

@app.route("/recommend", methods=["POST"])
def recommend_endpoint():
    """
    Endpoint to provide file recommendations based on user's saved files.
    Expects JSON body with a 'saved_files' list containing dicts with 'course' and 'school'.
    Returns up to 5 recommended files similar to the saved ones.
    """
    saved_files = request.json.get("saved_files", [])
    if not saved_files:
        return jsonify([])

    # Build similarity data structures
    df, vectorizer, tfidf_matrix = build_similarity_matrix()

    # Create text strings from saved files for similarity comparison
    target_texts = [f"{file['course']} {file['school']}" for file in saved_files]
    saved_tfidf = vectorizer.transform(target_texts)
    
    # Calculate average vector to represent the user's saved files collectively
    avg_vector = np.asarray(saved_tfidf.mean(axis=0))  

    # Compute cosine similarity between user's average vector and all file vectors
    similarities = cosine_similarity(avg_vector, tfidf_matrix).flatten()    

    # Pair each file index with its similarity score
    scores = list(enumerate(similarities))

    # Track file IDs already saved by user
    saved_ids = set(f["_id"] for f in saved_files)
    recommendations = []

    # Sort files by similarity score descending and select top 5 that user hasn't saved
    for i, _ in sorted(scores, key=lambda x: x[1], reverse=True):
        file_id = df.iloc[i]["_id"]
        if file_id not in saved_ids:
            recommendations.append(df.iloc[i])
        if len(recommendations) == 5:
            break
    
    # Convert recommendations to JSON-serializable dictionaries
    recommendations_json = recommendations = [r.to_dict() for r in recommendations]

    return jsonify(recommendations_json)

if __name__ == "__main__":
    app.run(port=8000)
