import requests
from flask import Flask, jsonify, request, make_response, Response, stream_with_context
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import functions.openai_funcs as openai_funcs
import openai
from logging_config import logger
from openai.error import AuthenticationError, APIError, RateLimitError, APIConnectionError, ServiceUnavailableError
import traceback
import sentry_sdk
from sentry_sdk import capture_exception, capture_message
import logging
# from sentry_sdk.integrations.logging import LoggingIntegration
# from sentry_sdk.integrations.flask import FlaskIntegration
import datetime


openai.api_key = os.environ['OPENAI_API_KEY']



# sentry_sdk.init(
#     dsn=os.environ['SENTRY_DSN'],
#     # Set traces_sample_rate to 1.0 to capture 100%
#     # of transactions for performance monitoring.
#     traces_sample_rate=1.0,
#     integrations=[FlaskIntegration()],

#     # Set profiles_sample_rate to 1.0 to profile 100%
#     # of sampled transactions.
#     # We recommend adjusting this value in production.
#     profiles_sample_rate=1.0,
# )




app = Flask(__name__)
CORS(app)


# @app.before_request
# def log_request():
#     capture_message(
#         f"Request--> <Method: {request.method}> <URL: {request.url}> <Headers: {request.headers}> <Data: {request.data}> <Time: {datetime.datetime.now()}>",

#         level=logging.INFO,
#     )
    

@app.route("/api", methods=['GET'])
def home():
    return jsonify({"message": "Hello"})


# @app.route("/api/set-open-ai-key", methods=['GET'])
# def conversation():
#     openai_endpoint = "https://api.openai.com/v1/chat/completions"
#     api_key = request.headers.get('x-open-ai-key')
#     llm_model = request.headers.get('llmModel')
#     llm_temp = request.headers.get('llmTemp')

#     headers = {
#         "Content-Type": "application/json",
#         "Authorization": f"Bearer {api_key}"
#     }

#     data = {
#         "selectedModel": llm_model,
#         "messages": [{"role": "user", "content": "Hello!"}],
#         "temperature": llm_temp
#     }

#     response = requests.post(openai_endpoint, json=data, headers=headers)
#     response_data = response.json()

#     if response.status_code == 200:
#         response_data = response.json()
#         generated_text = response_data['choices'][0]['message']['content']
#         return jsonify({"generated_text": generated_text})
#     else:
#         return jsonify({"error": "Failed to get response from OpenAI API"}), 500


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
                filepath = os.path.join(
                    'documents', os.path.basename(filename))

                options = openai_funcs.get_options(request)
                summary = openai_funcs.summarize_pdf(filepath, options)
                summaries.append({"filename": filename, "summary": summary})
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        capture_exception(
            e, data={"request": request, "summaries": summaries}
        )
        capture_message(
            traceback.format_exc(),
        )
        return jsonify({"message": error}), 400


@app.route("/api/summarise-text", methods=["POST"])
def summarise_text():
    try:
        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Text not found in request'}), 400
        
        text = data['text']
        logger.info(text)
        mod_response = openai.Moderation.create(input=text, )
        logger.info(mod_response)
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            logger.error(error)
            return jsonify({"message": error}), 401
        else:
            llmmodel = os.environ['DEFAULT_LLM_MODEL']
            openai.api_key = os.environ['OPENAI_API_KEY']
            physicianType = request.args.get('selectedPhysicianType')
            selectedCodeset = request.args.get('selectedCodeset')
            
            logger.info(llmmodel)
            logger.info(physicianType)
            logger.info(selectedCodeset)

            if selectedCodeset == 'All':
                s_codesets = os.environ['ALL_CODESETS']
            else:
                s_codesets = selectedCodeset
            logger.info(s_codesets)

            prompt = openai_funcs.setCodeGenPrompt(text.strip(), physicianType, 'No', s_codesets)
            logger.info(prompt)

            # 'summarise' for Summarising a medical note during a file upload.
            # 'code_response' for Generating medical codes directly from the text pasted
            message = openai_funcs.setChatMsg('code_response', s_codesets, prompt)
            logger.info(message)
            prompt_tokens = openai_funcs.num_tokens_from_messages(message)
            logger.info(prompt_tokens)

            try:
                full_response = ""
                def generate():
                    for resp in openai.ChatCompletion.create(model=llmmodel, messages=message, temperature=0, stream=True):
                        if "content" in resp.choices[0].delta:
                            text = resp.choices[0].delta.content
                            # print(text, end='', flush=True)  # Print the live data as it comes in
                            final_text =text.replace('\n', '\\n')
                            yield f"{final_text}"
                            # time.sleep(1)  # Simulating a delay

                # response = openai_funcs.getResponse(False, llmmodel, message)
                return Response(stream_with_context(generate()), content_type='text/event-stream')

                response = full_response
                logger.info(response)
                # print("Response generating...", response)
            except AuthenticationError:
                error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'

                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )
                return jsonify({"message": error}), 401
            except APIError:
                error = 'Retry your request after a brief wait and contact us if the issue persists.'
                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )

                return jsonify({"message": error}), 401
            except RateLimitError:
                error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )
                return jsonify({"message": error}), 401
            except APIConnectionError:
                error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )
                return jsonify({"message": error}), 401
            except ServiceUnavailableError:
                error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )
                return jsonify({"message": error}), 401
            except:
                error = "Error: {}".format(traceback.format_exc())
                logger.error(error)
                capture_exception(
                    error, data={"request": request}
                )
                capture_message(
                    traceback.format_exc(),
                )
                return jsonify({"message": error}), 400

            # summary = response['choices'][0]['message']['content']
            # logger.info(summary)
            
            # completion_tokens = openai_funcs.num_tokens_from_response(summary)
            # logger.info(completion_tokens)

            # logger.info(openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens))

            

            # summary1 = summary.replace('\n', '\\n')
            return jsonify([{"summary": "summary"}]), 200
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        # print(traceback.format_exc())   
        return jsonify({"message": error}), 400


if __name__ == "__main__":
    app.run(port=8000)
