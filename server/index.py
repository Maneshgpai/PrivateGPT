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
# import sentry_sdk
# from sentry_sdk import capture_exception, capture_message
import logging
from dotenv import load_dotenv, find_dotenv
import PyPDF2
# from sentry_sdk.integrations.logging import LoggingIntegration
# from sentry_sdk.integrations.flask import FlaskIntegration
import json
import base64
from google.cloud import firestore
import pytz
import datetime
import random
import math
import stripe

load_dotenv(find_dotenv())

openai.api_key = os.environ['OPENAI_API_KEY']
firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
stripe_secret_key = os.environ["STRIPE_SECRET_KEY"]
stripe_instance = stripe.api_key = stripe_secret_key

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

####################################### START STRIPE ############################################
@app.route("/api/create-sub", methods=["POST"])
def createSub():
    try:
        user_id = request.args.get("uid")
        def get_cost_units(uid):
            # db = get_firebase_app()
            db = firestore.Client.from_service_account_info(firestore_key_json)
            collection_ref = db.collection(uid + "_usage")
            docs = collection_ref.stream()
            tot_units = 0
            for doc in docs:
                data = doc.to_dict()
                if "total_tokens" in data:
                    tot_units += data["total_tokens"]
            return tot_units
        tot_units = get_cost_units(user_id)
        # print(f"Total units consumed {tot_units}, by userid {user_id}")

        # METERED USAGE RECORDING GOES HERE        
        # https://stripe.com/docs/billing/subscriptions/usage-based/recording-usage
        # stripe.SubscriptionItem.create_usage_record('{{SUBSCRIPTION_ITEM_ID}}',quantity=tot_units,timestamp=<timestamp>,action='increment',)
        # TO REMOVE THIS LOGIC, AND CHANGE TO METERED USAGE LOGIC IN upload-file OR summarise-text API CALLS
        unit_amount = math.ceil(tot_units * 100)
        product = stripe.Product.create(name="privateGPT", description="private gpt")
        price = stripe.Price.create(
            unit_amount=unit_amount,
            currency="usd",
            recurring={"interval": "month", "usage_type": "metered"},
            product=product.id,
        )
        metered_price_id = price.id
        session = stripe.checkout.Session.create(
            shipping_address_collection={"allowed_countries": ["IN"]},
            line_items=[{"price": metered_price_id}],
            mode="subscription",
            success_url="http://localhost:3000" + "?success=true",
            cancel_url="http://localhost:3000" + "?canceled=true",
        )
    except Exception as error:
        # print(error)
        return jsonify(error=str(error)), 500
    # print(session.url)
    return jsonify({"checkout_url": session.url})  # redirect(session.url, code=303)
####################################### END STRIPE ##############################################

def home():
    return jsonify({"message": "Hello"})

@app.route("/api/upload-file", methods=["POST"])
def upload_files():
    if not request.files.getlist("files"):
        logger.error("No file detected")
        return jsonify({"message": "Please send one or more Files"}), 400

    files = request.files.getlist("files")

    summaries = []
    allFiles = []

    try:
        for file in files:
            if file:
                filename = secure_filename(file.filename)
                filepath = os.path.join(
                    'documents', os.path.basename(filename))
                
                reader = PyPDF2.PdfReader(file)
                # Iterate over each page and extract text
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text = page.extract_text()
                    allFiles.append(
                        {"filename": filename, "text": text}
                    )
                    # logger.info(text)
        
        uid = request.args.get('uid')
        userId = uid



        
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(userId)
        user_data = user_ref.get().to_dict()

        if user_data['status'] != 'payment_method_added':
            return jsonify({'error': 'Please add payment method', "message" : "Payment Issue" , "status": 400}), 200


        now = datetime.datetime.utcnow()
        query_id = str(int((now.timestamp()*1000000))+random.randint(1000,9999))
        query_text = text.strip()
        mod_response = openai.Moderation.create(input=str(allFiles), )
        # logger.info(mod_response)
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            logger.error(error)
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
            return jsonify({"message": error}), 401
        else:
            llmmodel = os.environ['DEFAULT_LLM_MODEL']
            openai.api_key = os.environ['OPENAI_API_KEY']
            # physicianType = request.args.get('selectedPhysicianType')

            try:
                prompt = openai_funcs.setCodeGenPrompt(str(allFiles), 'file_upload')
                message = openai_funcs.setChatMsg('code_response', prompt)
                prompt_tokens = openai_funcs.num_tokens_from_messages(message)
                # full_response = ""
                def generate():
                    full_response = ""
                    for resp in openai.ChatCompletion.create(model=llmmodel, messages=message, temperature=0, stream=True):
                        if "content" in resp.choices[0].delta:
                            text = resp.choices[0].delta.content
                            final_text =text.replace('\n', '\\n')
                            full_response += final_text
                            yield f"{final_text}"
                    
                    db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                        ,"source":"upload_file","query_id":query_id,"query":query_text,"response":full_response.strip(),"upload_file":filename})

                    completion_tokens = openai_funcs.num_tokens_from_response(full_response.strip())
                    if user_data['stripe_subscription_id']:
                        subscription_item_id = user_data['stripe_subscription_item_id']  # Retrieve the subscription item ID
                        total_tokens = prompt_tokens + completion_tokens
                        print("all tokens", total_tokens, subscription_item_id)

                        stripe.SubscriptionItem.create_usage_record(
                            subscription_item_id,  # Use the retrieved subscription item ID
                            quantity=total_tokens,
                            api_key=stripe_secret_key,
                            action='increment',
                        )


############################# STRIPE Start ###################################
                    # stripe.SubscriptionItem.create_usage_record(
                    #     "si_IutmSSymhsWA5i",
                    #     quantity=prompt_tokens+completion_tokens,
                    #     timestamp=datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f'),)
############################# STRIPE End ###################################
                    db.collection(uid+"_usage").document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                        .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                            ,"prompt_tokens":prompt_tokens,"completion_tokens":completion_tokens,"total_tokens":prompt_tokens+completion_tokens,"llm_cost":openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens), "query_id":query_id})

                return Response(stream_with_context(generate()), content_type='text/event-stream')

            except AuthenticationError:
                error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'

                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 401
            except APIError:
                error = 'Retry your request after a brief wait and contact us if the issue persists.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 401
            except RateLimitError:
                error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 401
            except APIConnectionError:
                error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 401
            except ServiceUnavailableError:
                error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 401
            except:
                error = "Error: {}".format(traceback.format_exc())
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
                return jsonify({"message": error}), 400

    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
            .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                  ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
        return jsonify({"message": error}), 400

@app.route("/api/summarise-text", methods=["POST"])
def summarise_text():
    try:
        uid = request.args.get('uid')            
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        now = datetime.datetime.utcnow()
        query_id = str(int((now.timestamp()*1000000))+random.randint(1000,9999))
        

        data = request.get_json()
        if 'text' not in data:
            return jsonify({'error': 'Text not found in request'}), 400
        
        text = data['text']
        userId = data['userId']

        user_ref = db.collection('users').document(userId)
        user_data = user_ref.get().to_dict()

        if user_data['status'] != 'payment_method_added':
            return jsonify({'error': 'Please add payment method', "message" : "Payment Issue" , "status": 400}), 200

        query_text = text.strip()
        mod_response = openai.Moderation.create(input=text, )
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
            return jsonify({"message": error}), 401
        else:
            llmmodel = os.environ['DEFAULT_LLM_MODEL']
            openai.api_key = os.environ['OPENAI_API_KEY']
            # physicianType = request.args.get('selectedPhysicianType')
            prompt = openai_funcs.setCodeGenPrompt(text.strip(), 'paste_text')

            # 'summarise' for Summarising a medical note during a file upload.
            # 'code_response' for Generating medical codes directly from the text pasted
            message = openai_funcs.setChatMsg('code_response', prompt)
            prompt_tokens = openai_funcs.num_tokens_from_messages(message)

            try:
                def generate():
                    full_response = ""
                    for resp in openai.ChatCompletion.create(model=llmmodel, messages=message, temperature=0, stream=True):
                        if "content" in resp.choices[0].delta:
                            text = resp.choices[0].delta.content
                            final_text =text.replace('\n', '\\n')
                            full_response += final_text
                            yield f"{final_text}"
                            # time.sleep(1)  # Simulating a delay
                    db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                        .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                            ,"source":"paste_content","query_id":query_id,"query":query_text,"response":full_response.strip()})

                    completion_tokens = openai_funcs.num_tokens_from_response(full_response.strip())

                    db.collection(uid+"_usage").document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                        .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                            ,"prompt_tokens":prompt_tokens,"completion_tokens":completion_tokens,"total_tokens":prompt_tokens+completion_tokens,"llm_cost":openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens), "query_id":query_id})
                    if user_data['stripe_subscription_id']:
                        subscription_item_id = user_data['stripe_subscription_item_id']  # Retrieve the subscription item ID
                        total_tokens = prompt_tokens + completion_tokens
                        print("all tokens", total_tokens, subscription_item_id)

                        stripe.SubscriptionItem.create_usage_record(
                            subscription_item_id,  # Use the retrieved subscription item ID
                            quantity=total_tokens,
                            api_key=stripe_secret_key,
                            action='increment',
                        )

                return Response(stream_with_context(generate()), content_type='text/event-stream')

            except AuthenticationError:
                error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except APIError:
                error = 'Retry your request after a brief wait and contact us if the issue persists.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except RateLimitError:
                error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except APIConnectionError:
                error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except ServiceUnavailableError:
                error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except:
                error = "Error: {}".format(traceback.format_exc())
                logger.error(error)
                # capture_exception(
                #     error, data={"request": request}
                # )
                # capture_message(
                #     traceback.format_exc(),
                # )

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 400

            # summary1 = summary.replace('\n', '\\n')
            # return jsonify([{"summary": "summary"}]), 200
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        # print(traceback.format_exc())   

        db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
            .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                  ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
        return jsonify({"message": error}), 400


@app.route("/api/browser-extn", methods=["POST"])
def browser_extn_search():
    try:
        # print("Entered browser-extn *************")
        uid = request.args.get('uid')
        if (uid == 'user_textUserBrowserExtn'):
            firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
            firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
            db = firestore.Client.from_service_account_info(firestore_key_json)
            now = datetime.datetime.utcnow()
            query_id = str(int((now.timestamp()*1000000))+random.randint(1000,9999))

            data = request.get_json()
            if 'text' not in data:
                return jsonify({'error': 'Text not found in request'}), 400
            text = data['text']
            query_text = text.strip()
            mod_response = openai.Moderation.create(input=text, )
            if (mod_response['results'][0]['flagged']):
                error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                        ,"source":"browser_extn","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            else:
                llmmodel = os.environ['DEFAULT_LLM_MODEL']
                openai.api_key = os.environ['OPENAI_API_KEY']

                prompt = openai_funcs.setCodeGenPrompt(text.strip(), 'browser_extn')
                message = openai_funcs.setChatMsg('browser_extn', prompt)
                prompt_tokens = openai_funcs.num_tokens_from_messages(message)

                try:
                    response = openai_funcs.getResponse(False, llmmodel, message)
                except AuthenticationError:
                    error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'
                    logger.error(error)
                    return jsonify({"message": error}), 401
                except APIError:
                    error = 'Retry your request after a brief wait and contact us if the issue persists.'
                    logger.error(error)
                    return jsonify({"message": error}), 401
                except RateLimitError:
                    error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
                    logger.error(error)
                    return jsonify({"message": error}), 401
                except APIConnectionError:
                    error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
                    logger.error(error)
                    return jsonify({"message": error}), 401
                except ServiceUnavailableError:
                    error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
                    logger.error(error)
                    return jsonify({"message": error}), 401
                except:
                    error = "Error: {}".format(traceback.format_exc())
                    logger.error(error)
                    return jsonify({"message": error}), 400

                resp = response['choices'][0]['message']['content']
                completion_tokens = openai_funcs.num_tokens_from_response(resp)

                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                        ,"source":"paste_content","query_id":query_id,"query":query_text,"response":resp.strip()})

                completion_tokens = openai_funcs.num_tokens_from_response(resp.strip())
                db.collection(uid+"_usage").document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                        ,"prompt_tokens":prompt_tokens,"completion_tokens":completion_tokens,"total_tokens":prompt_tokens+completion_tokens,"llm_cost":openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens), "query_id":query_id})

                return jsonify({"summary": resp}), 200
        else:
            return jsonify({"message": "User not valid"}), 401
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400

@app.route("/user-created", methods=["POST"])
def user_created():
    try:
        # Extract user data from the request
        data = request.get_json()

        # Create a Stripe customer
        stripe_customer = stripe.Customer.create(
            email=data['data']['email_addresses'][0]['email_address'],
            name=f"{data['data']['first_name']} {data['data']['last_name']}"
        )

        # Create a Stripe subscription
        stripe_subscription = stripe.Subscription.create(
            customer=stripe_customer.id,
            items=[{'price': 'price_1OQ4ZYSGzDVqCKx1RX63pMag'}]
        )

        print("stripe_sub", stripe_subscription)

        # Prepare user data for Firestore
        user_data = {
            'stripe_customer_id': stripe_customer.id,
            'stripe_subscription_id': stripe_subscription.id,
            'stripe_subscription_item_id': stripe_subscription['items']['data'][0]['id'],
            # Include other user data you want to store
            'user_id': data['data']['id'],
            'first_name': data['data']['first_name'],
            'last_name': data['data']['last_name'],
            'email': data['data']['email_addresses'][0]['email_address'],
            'created_at': firestore.SERVER_TIMESTAMP,
            'status': 'signup'

        }

        # Save to Firestore
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        db.collection('users').document(data['data']['id']).set(user_data)

        return jsonify({"message": "User created and Stripe subscription set"}), 200
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400
    

@app.route("/api/check-user-status", methods=["POST"])
def check_user_status():
    try:
        data = request.get_json()
        user_id = data['id']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_data = user_ref.get().to_dict()
        if user_data:
            return jsonify({"status": user_data['status']})

        return jsonify({"status": "not_found"}), 404
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400


@app.route("/api/update-user-status", methods=["POST"])
def update_user_status():
    try:
        data = request.get_json()
        user_id = data['id']
        status = data['status']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'status': status})
        return jsonify({"message": "User status updated successfully"})
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400


@app.route("/api/get-user-data", methods=["POST"])
def get_user_data():
    try:
        data = request.get_json()
        user_id = data['id']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_data = user_ref.get().to_dict()
        if user_data:
            return jsonify(user_data)

        return jsonify({"message": "User not found"}), 404
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400



@app.route('/api/add-payment-method', methods=['POST'])
def add_payment_method():
    try:
        data = request.json
        customer_id = data.get('customer_id')  # Replace with actual customer ID
        payment_method_id = data.get('payment_method_id')
        user_id = data.get('id')
        # Attach the payment method to the customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )

        # Set the default payment method
        stripe.Customer.modify(
            customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
        status = 'payment_method_added'
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'status': status})



        return jsonify({'message': 'Payment method added successfully'}), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True) ### For Render
    # app.run(debug=True, host='0.0.0.0', port=8000) ### For Local host
    # app.run(port=8080) ### For Local host
