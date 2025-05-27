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
    res = requests.get("http://localhost:5000/file/metadata")
    data = res.json()
    df = pd.DataFrame(data)
    df['text'] = df['course'] + " " + df['school']
    return df

def build_similarity_matrix():
    df = load_file_metadata()
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(df['text'])
    return df, vectorizer, tfidf_matrix

@app.route("/recommend", methods=["POST"])
def recommend_endpoint():
    saved_files = request.json.get("saved_files", [])
    if not saved_files:
        return jsonify([])

    df, vectorizer, tfidf_matrix = build_similarity_matrix()

    target_texts = [f"{file['course']} {file['school']}" for file in saved_files]
    saved_tfidf = vectorizer.transform(target_texts)
    
    avg_vector = np.asarray(saved_tfidf.mean(axis=0))  

    similarities = cosine_similarity(avg_vector, tfidf_matrix).flatten()
    scores = list(enumerate(similarities))

    saved_ids = set(f["_id"] for f in saved_files)
    recommendations = []
    for i, _ in sorted(scores, key=lambda x: x[1], reverse=True):
        file_id = df.iloc[i]["_id"]
        if file_id not in saved_ids:
            recommendations.append(df.iloc[i])
        if len(recommendations) == 5:
            break

    recommendations_json = recommendations = [r.to_dict() for r in recommendations]

    return jsonify(recommendations_json)

if __name__ == "__main__":
    app.run(port=8000)
