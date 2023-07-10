from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import funcs

app = Flask(__name__)
CORS(app)

@app.route("/api", methods=['GET'])
def home():
    return jsonify({"message":"Hello"})



@app.route("/api/query", methods=["GET"])
def query_index():
    query_text = request.args.get("text", None)
    if query_text is None:
        return jsonify({"error":"No text found, please include a ?text=blah parameter in the URL"}), 400

    response = funcs.query_index(query_text)
    return jsonify({"message": f"{response}"})


@app.route("/api/uploadFile", methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        # return "Please send a POST request with a file", 400
        return jsonify({"message":"Please send a File"}), 400
    
    filepath = None
    try:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join('documents', os.path.basename(filename))
        uploaded_file.save(filepath)

        if request.form.get("filename_as_doc_id", None) is not None:
            funcs.insert_into_index(filepath, doc_id=filename)
        else:
            funcs.insert_into_index(filepath)
    except Exception as e:
        # cleanup temp file
        if filepath is not None and os.path.exists(filepath):
            os.remove(filepath)
        error = "Error: {}".format(str(e))
        return jsonify({"message":error}), 400


    # cleanup temp file
    # if filepath is not None and os.path.exists(filepath):
    #     os.remove(filepath)
    return jsonify({"message":"File inserted!"}), 200


@app.route("/api/getDocuments", methods=["GET"])
def get_documents():
    document_list = funcs.get_documents_list_function()

    return make_response(jsonify(document_list)), 200

funcs.initialize_index()

if __name__ == "__main__":
    app.run(debug=True, port=8080)