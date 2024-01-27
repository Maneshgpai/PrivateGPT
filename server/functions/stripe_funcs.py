from flask import jsonify
import os
import functions.openai_funcs as openai_funcs
import json
import base64
from google.cloud import firestore
import stripe

# firestore_key = str(os.environ['FIRESTORE_KEY'])[2:-1]
# firestore_key_json= json.loads(base64.b64decode(firestore_key).decode('utf-8'))
stripe_secret_key = os.environ["STRIPE_SECRET_KEY"]
stripe_instance = stripe.api_key = stripe_secret_key

def check_status(user_data):
    try:
        stripe_subscription = stripe.Subscription.retrieve(user_data['stripe_subscription_id'])
        stripe_customer = stripe.Customer.retrieve(user_data['stripe_customer_id'])            
        if stripe_subscription["status"] == 'trialing':
            stripe_status = 'trialing'
        elif (stripe_subscription["status"] == 'active'):
            if stripe_customer['invoice_settings']['default_payment_method']:
                print("User is not in trial but has added payment method. Allow usage.")
                stripe_status = 'active_and_payment_added'
            else:
                print("User is not in trial. Does not have payment method. Don't allow usage.")
                stripe_status = 'active_and_payment_not_added'
        else:
            stripe_status = stripe_subscription["status"]

        return stripe_status
    except Exception as e:
        error = "Error: {}".format(str(e))
        print(error)
        return jsonify({"message": error}), 400