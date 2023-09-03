import requests
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import funcs
from logging_config import logger

app = Flask(__name__)
CORS(app)


@app.route("/api", methods=['GET'])
def home():
    return jsonify({"message": "Hello"})


@app.route("/api/set-open-ai-key", methods=['GET'])
def conversation():
    openai_endpoint = "https://api.openai.com/v1/chat/completions"
    api_key = request.headers.get('x-open-ai-key')

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": "Hello!"}],
        "temperature": 0.7
    }

    response = requests.post(openai_endpoint, json=data, headers=headers)
    response_data = response.json()

    if response.status_code == 200:
        response_data = response.json()
        generated_text = response_data['choices'][0]['message']['content']
        return jsonify({"generated_text": generated_text})
    else:
        return jsonify({"error": "Failed to get response from OpenAI API"}), 500


@app.route("/api/upload-file", methods=["POST"])
def upload_files():
    os.environ['OPENAI_API_KEY'] = request.headers.get('x-open-ai-key')
    if not request.files.getlist("files"):
        logger.error("No file detected")
        return jsonify({"message": "Please send one or more Files"}), 400

    files = request.files.getlist("files")

    summaries = []
    try:
        for file in files:
            if file:
                filename = secure_filename(file.filename)
                filepath = os.path.join('documents', filename)
                options = funcs.get_options(request)

                try:
                    file.save(filepath)
                    summary = funcs.summarize_pdf(filepath, options)
                    summaries.append(
                        {"filename": filename, "summary": summary})
                finally:
                    os.remove(filepath)
        return jsonify(summaries), 200
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400


@app.route("/api/summarise-text", methods=["POST"])
def summarise_text():
    os.environ['OPENAI_API_KEY'] = request.headers.get('x-open-ai-key')
    try:
        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Text not found in request'}), 400
        text = data['text']

        options = funcs.get_options(request)
        summary = funcs.summarize_text(text, options)

        return jsonify([{"summary": summary}]), 200
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400


if __name__ == "__main__":
    app.run(debug=True, port=8080)
