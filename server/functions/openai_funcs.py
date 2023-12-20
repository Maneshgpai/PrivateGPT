import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.chains.summarize import load_summarize_chain
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate
import openai
import tiktoken
from logging_config import logger
from sentry_sdk import capture_exception, capture_message
import traceback
from flask import jsonify


load_dotenv()


def summarize_pdf(pdf_file_path, options):
    try:
      llm = ChatOpenAI(temperature=options['temperature'], model_name=options['model'])
      loader = PyPDFLoader(pdf_file_path)
      doc = loader.load_and_split()

      prompt_template = """Write a concise summary of the following:
      "{doc}"
      CONCISE SUMMARY:"""
      prompt = PromptTemplate.from_template(prompt_template)

      chain = load_summarize_chain(
          llm, document_variable_name="doc", chain_type="stuff", prompt=prompt)
      summary = chain.run(doc)
      return summary.strip()

    except Exception as e:
      error = "Error: {}".format(str(e))
      logger.error(error)
      capture_exception(
          e, data={"pdf_file_path": pdf_file_path, "options": options}
      )
      capture_message(
          traceback.format_exc(),
      )
      return jsonify({"message": error}), 400

def getResponse(isStreaming,llm_name,messages):
  try:
    response = openai.ChatCompletion.create(model=llm_name, messages=messages, temperature=0, stream=isStreaming,)
    return response
  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"isStreaming": isStreaming, "llm_name": llm_name, "messages": messages}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400

def setChatMsg(msg_typ,prompt):
  try:
    if msg_typ == 'summarise':
      messages = [{"role": "system", "content": os.environ['OPENAI_MESSAGE_SUMMARISE']},{"role": "user", "content": prompt}]
    else:
      messages = [{"role": "system", "content": os.environ['OPENAI_MESSAGE_CODEGEN']},{"role": "user", "content": prompt}]
    return messages

  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"msg_typ": msg_typ, "prompt": prompt}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400

def setCodeGenPrompt(note, search_type):
  try:
    if search_type == 'file_upload':
      prompt = f"""{os.environ['OPENAI_CODEGEN_PROMPT_START']}\
        {os.environ['OPENAI_CODEGEN_PROMPT1_UPLOAD_JSON1']}\
        {os.environ['OPENAI_CODEGEN_PROMPT2']}\
        {os.environ['OPENAI_CODEGEN_PROMPT3_UPLOAD_JSON2']}\
        {os.environ['OPENAI_CODEGEN_PROMPT4']}\
        {note}\
        {os.environ['OPENAI_CODEGEN_PROMPT_END']}"""
    else:
      # prompt = f"""{os.environ['OPENAI_CODEGEN_PROMPT1']}{note}{os.environ['OPENAI_CODEGEN_PROMPT2']}"""
      prompt = f"""{os.environ['OPENAI_CODEGEN_PROMPT_START']}\
        {os.environ['OPENAI_CODEGEN_PROMPT2']}\
        {os.environ['OPENAI_CODEGEN_PROMPT4']}\
        {note}\
        {os.environ['OPENAI_CODEGEN_PROMPT_END']}"""
    return prompt
  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"note": note}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400

encoding = tiktoken.encoding_for_model(os.environ['DEFAULT_LLM_MODEL'])
def num_tokens_from_response(response_text):
  try:
    num_tokens = len(encoding.encode(response_text))
    return num_tokens
  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"response_text": response_text}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400

def num_tokens_from_messages(messages):
  try:
    tokens_per_message = 3
    tokens_per_name = 1
    num_tokens = 0
    for message in messages:
      num_tokens += tokens_per_message
      for key, value in message.items():
        num_tokens += len(encoding.encode(value))
        if key == "name":
          num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens
  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"messages": messages}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400

### Calculate cost as per the pricing given on 21-Aug-23 in https://openai.com/pricing#language-models
def getOpenaiApiCost(llm_name,completion_tokens,prompt_tokens):
  try:
    if llm_name == "gpt-3.5-turbo":
      ###	4K context: Input/Prompt tokens @ $0.0015/1K tokens, Output/Response tokens @ $0.002/1K tokens
      ip_cost = (prompt_tokens/1000) * 0.0015
      op_cost = (completion_tokens/1000) * 0.002

    elif llm_name == "gpt-3.5-turbo-16k":
      ###	16K context: Input/Prompt tokens @ $0.003/1K tokens, Output/Response tokens @ $0.004/1K tokens
      ip_cost = (prompt_tokens/1000) * 0.003
      op_cost = (completion_tokens/1000) * 0.004

    elif llm_name == "gpt-4":
      ###	8K context: Input/Prompt tokens @ $0.03/1K tokens, Output/Response tokens @ $0.06/1K tokens
      ip_cost = (prompt_tokens/1000) * 0.03
      op_cost = (completion_tokens/1000) * 0.06

    tot_cost = round((op_cost + ip_cost),4)
    return (tot_cost)
  except Exception as e:
    error = "Error: {}".format(str(e))
    logger.error(error)
    capture_exception(
        e, data={"llm_name": llm_name, "completion_tokens": completion_tokens, "prompt_tokens": prompt_tokens}
    )
    capture_message(
        traceback.format_exc(),
    )
    return jsonify({"message": error}), 400