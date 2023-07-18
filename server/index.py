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
    return jsonify({"message":"Hello"})



@app.route("/api/query", methods=["GET"])
def query_index():
    query_text = request.args.get("text", None)
    if query_text is None:
        logger.error("No text found, please include a ?text=blah parameter in the URL")
        return jsonify({"error":"No text found, please include a ?text=blah parameter in the URL"}), 400
    logger.info(f"Query : {query_text}")
    response = funcs.query_index(query_text)
    logger.info(f"Response : {response}")
    return jsonify({"message": f"{response}"})


@app.route("/api/uploadFile", methods=["POST"])
def upload_file():
    print("Called upload_file() ...........")
    if 'file' not in request.files:
        # return "Please send a POST request with a file", 400
        logger.error("No file detected")
        return jsonify({"message":"Please send a File"}), 400
    
    filepath = None
    try:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        filepath = os.path.join('documents', os.path.basename(filename))
    
        print("Called upload_file(): filename:",filename)
        print("Called upload_file(): filepath:",filepath)
    
        uploaded_file.save(filepath)

        logger.info(f"File named {filename} has been uploaded")

        if request.form.get("filename_as_doc_id", None) is not None:
            print("entered IF...")
            funcs.insert_into_index(filepath, doc_id=filename)
        else:
            print("entered ELSE...")
            funcs.insert_into_index(filepath)
        # os.remove(filepath)
    except Exception as e:
        # cleanup temp file
        if filepath is not None and os.path.exists(filepath):
            os.remove(filepath)
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message":error}), 400


    # cleanup temp file
    # if filepath is not None and os.path.exists(filepath):
    #     os.remove(filepath)
    logger.info(f"{filename} inserted")
    return jsonify({"message":"File inserted!"}), 200


@app.route("/api/getDocuments", methods=["GET"])
def get_documents():
    document_list = funcs.get_documents_list()
    return make_response(jsonify(document_list)), 200

funcs.initialize_index()

if __name__ == "__main__":
    app.run(debug=True, port=8080)