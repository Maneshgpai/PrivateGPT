import requests
from flask import Flask, jsonify, request, make_response, Response, stream_with_context
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import functions.openai_funcs as openai_funcs
import functions.stripe_funcs as stripe_funcs
import openai
from logging_config import logger
from openai.error import AuthenticationError, APIError, RateLimitError, APIConnectionError, ServiceUnavailableError
import traceback
import logging
from dotenv import load_dotenv, find_dotenv
import PyPDF2
import json
import base64
from google.cloud import firestore
import pytz
import datetime
import random
import stripe
from svix.webhooks import Webhook, WebhookVerificationError
import smtplib
from email.message import EmailMessage

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

def home():
    return jsonify({"message": "Hello"})

@app.route("/api/upload-file", methods=["POST"])
def upload_files():

    uid = request.args.get('uid')
    db = firestore.Client.from_service_account_info(firestore_key_json)
    now = datetime.datetime.utcnow()
    query_id = str(int((now.timestamp()*1000000))+random.randint(1000,9999))
    user_ref = db.collection('users').document(uid)
    user_data = user_ref.get().to_dict()
    
    if not(user_data):
        return jsonify({"status": "user_not_found"}), 404

    # Fetch Stripe details from Firebase USER collection
    # Raise error if Trial is expired but there is no payment method added
    stripe_status = stripe_funcs.check_status(user_data)
    if not(stripe_status == 'trialing' or stripe_status == 'active_and_payment_added'):
        return jsonify({"status": "Billing issue. Please contact hello@physikally.com"}), 404

    # Raise error if on on Trial period, but the daily quote is over
    ####### Logic TBD #######

    if not request.files.getlist("files"):
        logger.error("No file detected")
        return jsonify({"message": "Please send one or more Files"}), 400
    files = request.files.getlist("files")

    allFiles = []
    try:
        for file in files:
            if file:
                filename = secure_filename(file.filename)
                # filepath = os.path.join('documents', os.path.basename(filename))
                
                reader = PyPDF2.PdfReader(file)
                # Iterate over each page and extract text
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text = page.extract_text()
                    allFiles.append(
                        {"filename": filename, "text": text}
                    )
        
        # Moderate text using OpenAI moderation 
        mod_response = openai.Moderation.create(input=str(allFiles), )
        # logger.info(mod_response)
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            logger.error(error)
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"upload_file","query_id":query_id,"query":str(allFiles),"upload_file":filename,"error":error})
            return jsonify({"message": error}), 401
            
        llmmodel = os.environ['DEFAULT_LLM_MODEL']
        openai.api_key = os.environ['OPENAI_API_KEY']
        query_text = str(allFiles)

        # try:
        #     def generate():
        #         for i in range(len(allFiles)):
        #             filenm = allFiles[i]['filename']
        #             text = allFiles[i]['text']

        #             prompt = openai_funcs.setCodeGenPrompt(str(allFiles[i]), 'file_upload')
        #             message = openai_funcs.setChatMsg('code_response', prompt)
        #             full_response = ""
        #             for resp in openai.ChatCompletion.create(model=llmmodel, messages=message, temperature=0, stream=True):
        #                 if "content" in resp.choices[0].delta:
        #                     text = resp.choices[0].delta.content
        #                     final_text =text.replace('\n', '\\n')
        #                     full_response += final_text
        #                     yield f"{final_text}"
                        
        #             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
        #                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
        #                       ,"source":"upload_file","query_id":query_id,"query":text,"response":full_response.strip(),"upload_file":filenm})

        #             prompt_tokens = openai_funcs.num_tokens_from_messages(message)
        #             completion_tokens = openai_funcs.num_tokens_from_response(full_response.strip())
        #             if user_data['stripe_subscription_id']:
        #                 subscription_item_id = user_data['stripe_subscription_item_id']  # Retrieve the subscription item ID
        #                 total_tokens = prompt_tokens + completion_tokens
        #                 stripe.SubscriptionItem.create_usage_record(subscription_item_id,quantity=total_tokens,api_key=stripe_secret_key,action='increment',)
        try:
            prompt = openai_funcs.setCodeGenPrompt(str(allFiles), 'file_upload')
            message = openai_funcs.setChatMsg('code_response', prompt)
            prompt_tokens = openai_funcs.num_tokens_from_messages(message)
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
                              ,"source":"upload_file","query_id":query_id,"query":text,"response":full_response.strip(),"upload_file":filename})

                completion_tokens = openai_funcs.num_tokens_from_response(full_response.strip())
                if user_data['stripe_subscription_id']:
                    subscription_item_id = user_data['stripe_subscription_item_id']
                    total_tokens = prompt_tokens + completion_tokens

                    stripe.SubscriptionItem.create_usage_record(
                            subscription_item_id,  # Use the retrieved subscription item ID
                            quantity=total_tokens,
                            api_key=stripe_secret_key,
                            action='increment',
                        )
                db.collection(uid+"_usage").document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                        .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                              ,"prompt_tokens":prompt_tokens,"completion_tokens":completion_tokens,"total_tokens":\
                                prompt_tokens+completion_tokens,"llm_cost":openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens)\
                                    , "query_id":query_id})

            return Response(stream_with_context(generate()), content_type='text/event-stream')

        except AuthenticationError:
             error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'
             logger.error(error)
             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                       ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
             return jsonify({"message": error}), 401
        except APIError:
             error = 'Retry your request after a brief wait and contact us if the issue persists.'
             logger.error(error)
             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                       ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
             return jsonify({"message": error}), 401
        except RateLimitError:
             error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
             logger.error(error)
             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                       ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
             return jsonify({"message": error}), 401
        except APIConnectionError:
             error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
             logger.error(error)
             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                       ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
             return jsonify({"message": error}), 401
        except ServiceUnavailableError:
             error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
             logger.error(error)
             db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                 .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                       ,"source":"upload_file","query_id":query_id,"query":query_text,"upload_file":filename,"error":error})
             return jsonify({"message": error}), 401
        except:
             error = "Error: {}".format(traceback.format_exc())
             logger.error(error)
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

@app.route("/api/get-usage", methods=["POST"])
def get_usage():
    try:
        data = request.get_json()
        uid = data['id']
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(uid)
        user_data = user_ref.get().to_dict()
        
        stripe_usage_hist = stripe.SubscriptionItem.list_usage_record_summaries(user_data['stripe_subscription_item_id'],limit=100,)
        usage = []
        for item in stripe_usage_hist["data"]:
            data = {}
            data["start date"]=datetime.datetime.fromtimestamp(item["period"]["start"]).date()
            if (item["period"]["end"]):
                data["end date"]=datetime.datetime.fromtimestamp(item["period"]["start"]).date()
            data["units used"]=item["total_usage"]
            data["cost"]=round((item["total_usage"] * 0.000169),2)
            usage.append(data)

        return jsonify({"data": usage}), 200
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400
    

@app.route("/api/summarise-text", methods=["POST"])
def summarise_text():
    try:
        # print("Entered Summarize Text ////////////")
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

        # Fetch Stripe details from Firebase USER collection
        if not(user_data):
            return jsonify({"status": "user_not_found"}), 404

        # Raise error if Trial is expired but there is no payment method added
        stripe_status = stripe_funcs.check_status(user_data)
        if not(stripe_status == 'trialing' or stripe_status == 'active_and_payment_added'):
            return jsonify({"status": "Billing issue. Please contact hello@physikally.com"}), 404

        # Raise error if on on Trial period, but the daily quote is over
        # Logic TBD

        # Moderate text using OpenAI moderation 
        query_text = text.strip()
        mod_response = openai.Moderation.create(input=text, )
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
            return jsonify({"message": error}), 401
        else:
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
                    llmmodel = os.environ['DEFAULT_LLM_MODEL']
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
                db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                    .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                          ,"source":"paste_content","query_id":query_id,"query":query_text,"error":error})
                return jsonify({"message": error}), 401
            except APIError:
                error = 'Retry your request after a brief wait and contact us if the issue persists.'
                logger.error(error)
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
        uid = request.args.get('uid')
        if (uid == 'user_extnTestUser1'):
            return jsonify({"summary": "User not valid"}), 401
        elif (uid == 'user_textUserBrowserExtn'):
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
                return jsonify({"summary": error}), 401
            else:
                llmmodel = os.environ['DEFAULT_LLM_MODEL']
                openai.api_key = os.environ['OPENAI_API_KEY']

                prompt = openai_funcs.setCodeGenPrompt(text.strip(), 'browser_extn_medcode')
                message = openai_funcs.setChatMsg('browser_extn', prompt)
                prompt_tokens = openai_funcs.num_tokens_from_messages(message)

            ######################## START ##############################
                try:
                    response = openai_funcs.getResponse(False, llmmodel, message)
                except AuthenticationError:
                    error = 'Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.'
                    logger.error(error)
                    return jsonify({"summary": error}), 401
                except APIError:
                    error = 'Retry your request after a brief wait and contact us if the issue persists.'
                    logger.error(error)
                    return jsonify({"summary": error}), 401
                except RateLimitError:
                    error = 'The API key has reached the rate limit. Contact Admin if isue persists.'
                    logger.error(error)
                    return jsonify({"summary": error}), 401
                except APIConnectionError:
                    error = 'Check your network settings, proxy configuration, SSL certificates, or firewall rules.'
                    logger.error(error)
                    return jsonify({"summary": error}), 401
                except ServiceUnavailableError:
                    error = 'Retry your request after a brief wait and contact us if the issue persists. Check OpenAI status page: https://status.openai.com/'
                    logger.error(error)
                    return jsonify({"summary": error}), 401
                except:
                    error = "Error: {}".format(traceback.format_exc())
                    logger.error(error)
                    return jsonify({"summary": error}), 400

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
            ####################### END ##########################
        else:
            return jsonify({"summary": "User not valid"}), 401
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"summary": error}), 400

@app.route("/api/browser-extn-stream", methods=["POST"])
def browser_extn_st_search():
    try:
        data = request.get_json()

        if 'userId' not in data or data['userId'].strip()=="":
            return Response("Please login to continue.", content_type='text/event-stream')

        if 'text' not in data or data['text'].strip()=="":
            return Response("No text is selected. Please select a medical relevant text to continue.", content_type='text/event-stream')

        uid = data['userId'].strip()
        text = data['text'].strip()
        
        # Firebase log entry
        db = firestore.Client.from_service_account_info(firestore_key_json)
        now = datetime.datetime.utcnow()
        query_id = str(int((now.timestamp()*1000000))+random.randint(1000,9999))

        # Fetch Stripe details from Firebase USER collection
        user_ref = db.collection('users').document(uid)
        user_data = user_ref.get().to_dict()
        if not(user_data):
            return Response("User is not valid. Please email hello@physikally.com to continue using.", content_type='text/event-stream')

        # Check if Trial expired but not yet added payment method. Basically perform check-user-status as a function
        stripe_status = stripe_funcs.check_status(user_data)
        # print("stripe_status:",stripe_status)
        if not(stripe_status == 'trialing' or stripe_status == 'active_and_payment_added'):
            return Response("Your trial period is over. Please email hello@physikally.com to continue using.", content_type='text/event-stream')

       
        # Moderate text using OpenAI moderation 
        mod_response = openai.Moderation.create(input=text, )
        query_text = text.strip()
        if (mod_response['results'][0]['flagged']):
            error = 'This text violates website\'s content policy! Please use content relevant to medical coding only.'
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"browser_extn","query_id":query_id,"query":query_text,"error":error})
            return Response(error, content_type='text/event-stream')

        # Call OpenAI to get response
        llmmodel = os.environ['DEFAULT_LLM_MODEL']
        openai.api_key = os.environ['OPENAI_API_KEY']
        prompt = openai_funcs.setCodeGenPrompt(text.strip(), 'browser_extn_medcode')
        message = openai_funcs.setChatMsg('browser_extn', prompt)
        prompt_tokens = openai_funcs.num_tokens_from_messages(message)
        def generate():
            full_response = ""
            for resp in openai.ChatCompletion.create(model=llmmodel, messages=message, temperature=0, stream=True):
                if "content" in resp.choices[0].delta:
                    text = resp.choices[0].delta.content
                    final_text =text #.replace('\n', '\\n')
                    full_response += final_text
                    yield f"{final_text}"
            
            # Log entry for user collection
            db.collection(uid).document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"source":"browser_extn","query_id":query_id,"query":query_text,"response":full_response.strip()})

            completion_tokens = openai_funcs.num_tokens_from_response(full_response.strip())
            total_tokens = prompt_tokens + completion_tokens

            # Log entry for usage collection
            db.collection(uid+"_usage").document(str(datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')))\
                .set({"timestamp": datetime.datetime.now(pytz.utc).strftime('%Y-%m-%d %H:%M:%S.%f')\
                      ,"prompt_tokens":prompt_tokens,"completion_tokens":completion_tokens,"total_tokens":total_tokens,"llm_cost":openai_funcs.getOpenaiApiCost(llmmodel,completion_tokens,prompt_tokens), "query_id":query_id})
            
            # Add usage data to Stripe
            if user_data['stripe_subscription_id']:
                subscription_item_id = user_data['stripe_subscription_item_id']
                stripe.SubscriptionItem.create_usage_record(subscription_item_id,quantity=total_tokens,api_key=stripe_secret_key,action='increment',)

        return Response(stream_with_context(generate()), content_type='text/event-stream')
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return Response(error, content_type='text/event-stream')

@app.route("/user-delete", methods=["POST"])
def user_deleted():
    # Authenticating Webhook from Clerk
    webhook_secret = os.environ["USER_DELETE_WEBHOOK_SECRET"]
    try:
        headers = request.headers
        payload = request.get_data()
        wh = Webhook(webhook_secret)
        msg = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        return jsonify({"error": "Webhook not verified!"}), 400
    try:
        data = request.get_json()
        uid = data['data']['id']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(uid)
        user_ref.update({'status': "user_deleted"})
        user_ref.update({'status_upd_dt': firestore.SERVER_TIMESTAMP})

        user_data = user_ref.get().to_dict()
        
        ## Delete Stripe account
        # stripe.Customer.delete(user_data['stripe_customer_id'])

        msg = EmailMessage()
        message = "email:"+user_data['email']+\
            "\nfirst_name:"+user_data['first_name']+\
            "\nuser_id:"+user_data['user_id']+\
            "\n\nNext actions:"+\
            "\n1. Check Stripe payment status. If all bills settled, delete account. Else followup."+\
            "\n2. Check usage and type of queries run from Firebase usage logs"+\
            "\n3. Ask why deleted - engage with user without being intrusive into queries"+\
            "\n4. Share user survey which should get saved to CRM"
            # "\n ============="+\
            # "\n user_data:"+str(user_data)+\
        msg.set_content(message)
        sender_email_id = os.environ["sender_email_id"]
        sender_email_pwd = os.environ["sender_email_pwd"]
        rcvr_email_id = os.environ["rcvr_email_id"]

        msg['Subject'] = f'User DELETED : '+user_data['email']
        msg['From'] = sender_email_id
        msg['To'] = rcvr_email_id
        
        s = smtplib.SMTP('smtp.gmail.com', 587)
        s.starttls()
        s.login(sender_email_id, sender_email_pwd)
        s.send_message(msg)
        s.quit()

        return jsonify({"message": "User account with all associated data is deleted from server"}), 200
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400



@app.route("/user-created", methods=["POST"])
def user_created():
    # Authenticating Webhook from Clerk
    webhook_secret = os.environ["USER_CREATE_WEBHOOK_SECRET"]
    
    try:
        # print("Entered user-CREATED++++++++++")
        headers = request.headers
        payload = request.get_data()
        wh = Webhook(webhook_secret)
        msg = wh.verify(payload, headers)
    except WebhookVerificationError as e:
        return jsonify({"error": "Webhook not verified!"}), 400

    try:
        # Extract user data from the request
        data = request.get_json()
        # Create a Stripe customer
        stripe_customer = stripe.Customer.create(
            email=data['data']['email_addresses'][0]['email_address'],
            name=f"{data['data']['first_name']} {data['data']['last_name']}"
        )

        # Create a Stripe subscription
        trialDays=14
        stripe_std_coding_price = os.environ['STRIPE_STANDARD_CODING_PRICE_KEY']
        stripe_subscription = stripe.Subscription.create(
            customer=stripe_customer.id,
            items=[{'price': stripe_std_coding_price}],
            trial_period_days=trialDays,
            payment_settings={"save_default_payment_method": "on_subscription"}
        )
        
        # Prepare user data for Firestore
        user_data = {
            'stripe_customer_id': stripe_customer.id,
            'stripe_subscription_id': stripe_subscription.id,
            'stripe_subscription_item_id': stripe_subscription['items']['data'][0]['id'],
            'user_id': data['data']['id'],
            'first_name': data['data']['first_name'],
            'last_name': data['data']['last_name'],
            'email': data['data']['email_addresses'][0]['email_address'],
            'created_at': firestore.SERVER_TIMESTAMP,
            'status': stripe_subscription.status,
            'status_upd_dt':firestore.SERVER_TIMESTAMP
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
        # print("CHECK-user-status*********")
        data = request.get_json()
        uid = data['id']

        # Fetch Stripe details from Firebase USER collection
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(uid)
        user_data = user_ref.get().to_dict()
        if not(user_data):
            return jsonify({"status": "user_not_found"}), 404
        
        return jsonify({"status": stripe_funcs.check_status(user_data)})

        # firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        # firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        # db = firestore.Client.from_service_account_info(firestore_key_json)
        # user_ref = db.collection('users').document(user_id)
        # user_data = user_ref.get().to_dict()
        # stripe_subscription = stripe.Subscription.retrieve(user_data['stripe_subscription_id'])
        # stripe_customer = stripe.Customer.retrieve(user_data['stripe_customer_id'])
        # if stripe_subscription["status"] == 'trialing':
        #     # print("User is under trial. Allow usage.")
        #     stripe_status = 'trialing'
        # elif (stripe_subscription["status"] == 'active'):
        #     if stripe_customer['invoice_settings']['default_payment_method']:
        #         print("User is not in trial but has added payment method. Allow usage.")
        #         stripe_status = 'active_and_payment_added'
        #     else:
        #         print("User is not in trial. Does not have payment method. Don't allow usage.")
        #         stripe_status = 'active_and_payment_not_added'
        # else:
        #     stripe_status = stripe_subscription["status"]
        #     print("CHECK-user-status > stripe_subscription_status:",stripe_status)
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        print(error)
        return jsonify({"message": error}), 400


@app.route("/api/update-user-status", methods=["POST"])
def update_user_status():
    try:
        # print("UPDATE-user-status =================")
        data = request.get_json()
        user_id = data['id']
        status = data['status']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'status': status})
        user_ref.update({'status_upd_dt': firestore.SERVER_TIMESTAMP})
        return jsonify({"message": "User status updated successfully"})
    
    except Exception as e:
        error = "Error: {}".format(str(e))
        logger.error(error)
        return jsonify({"message": error}), 400


@app.route("/api/get-user-data", methods=["POST"])
def get_user_data():
    try:
        # print("GET-user-data &&&&&&&&&&&&&")
        data = request.get_json()
        user_id = data['id']
        firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
        firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
        db = firestore.Client.from_service_account_info(firestore_key_json)
        user_ref = db.collection('users').document(user_id)
        user_data = user_ref.get().to_dict()
        # print("GET-user-data > user_data:",user_data)
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
        user_ref.update({'status_upd_dt': firestore.SERVER_TIMESTAMP})
        return jsonify({'message': 'Payment method added successfully'}), 200

    except Exception as e:
        # print(traceback.format_exc())
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    # app.run(host='0.0.0.0', port=5000, debug=False) ### For Render
    app.run(debug=True, port=8080) ### For Local host
    # app.run(port=8080) ### For Local host
