from flask import Flask, request, jsonify
from flask_cors import CORS
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from transformers import pipeline

app = Flask(__name__)
CORS(app)

endpoint = "https://minihackathon.cognitiveservices.azure.com/"
key = "46d79c54c94b4979b30ac58d8b6fdeca"
text_analytics_client = TextAnalyticsClient(endpoint=endpoint, credential=AzureKeyCredential(key))

generator = pipeline("text2text-generation", model="google/flan-t5-base")

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    if request.method == "POST":
        try:
            data = request.get_json()
            sentence = data["sentence"]
            result = analyze_sentence(sentence)
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    return "Method not allowed!", 405
    
def analyze_sentence(sentence):
    try:
        result = text_analytics_client.analyze_sentiment([sentence])
        sentiment = result[0].sentiment
        scores = result[0].confidence_scores
        score = max(scores.values())
        paraphrase = generator(sentence, max_length=50, num_return_sequences=1, do_sample=True)[0]['generated_text']
        return {"sentiment": sentiment, "score": score, "paraphrase": paraphrase}
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6600)