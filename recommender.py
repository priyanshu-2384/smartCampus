from flask import Flask, request, jsonify
import pymongo
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
import json

app = Flask(__name__)

# MongoDB connection
client = pymongo.MongoClient("mongodb://127.0.0.1:27017/")
db = client["smartCamp"]
events_collection = db["events"]
groups_collection = db["groups"]
listings_collection = db["listings"]
users_collection = db["users"]

# Fetch All Events, Groups, Posts & User data
def fetch_data():
    events_data = events_collection.find({}, {
        "_id": 1, "name": 1, "description": 1, "objectives": 1,
        "rules": 1, "prizes": 1, "location": 1
    })

    event_texts = []
    event_ids = []
    for event in events_data:
        text = f"{event.get('name', '')} {event.get('description', '')} {event.get('objectives', '')} {event.get('rules', '')} {event.get('prizes', '')} {event.get('location', '')}"
        event_texts.append(text)
        event_ids.append(str(event["_id"]))

    # Similarly for groups and listings data...
    # Return all texts and IDs
    return event_texts, event_ids

@app.route('/recommendations', methods=['POST'])
def recommend():
    user_data = request.json  # Assuming the user data is posted as JSON

    user_id = user_data.get('_id')
    user_record = users_collection.find_one({"_id": user_id})
    user_text = f"{user_record.get('description', '')} {' '.join(user_record.get('interests', []))}"

    # Get event, group, and listing data
    event_texts, event_ids = fetch_data()

    def recommend(corpus_texts, corpus_ids, user_text, top_n=10):
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([user_text] + corpus_texts)

        knn = NearestNeighbors(n_neighbors=top_n + 1, metric="cosine")
        knn.fit(tfidf_matrix[1:])

        distances, indices = knn.kneighbors(tfidf_matrix[0])

        return [corpus_ids[i] for i in indices[0]]

    recommended_events = recommend(event_texts, event_ids, user_text, top_n=10)

    return jsonify({
        "events": recommended_events
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # Port 5000
