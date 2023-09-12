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

load_dotenv()


def summarize_pdf(pdf_file_path, options):
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

def getResponse(isStreaming,llm_name,messages):
  response = openai.ChatCompletion.create(model=llm_name, messages=messages, temperature=0, stream=isStreaming,)
  return response

def setChatMsg(msg_typ,s_codesets,prompt):
  if msg_typ == 'summarise':
    messages = [{"role": "system", "content": os.environ['OPENAI_MESSAGE_SUMMARISE']},{"role": "user", "content": prompt}]
  else:
    messages = [{"role": "system", "content": os.environ['OPENAI_MESSAGE_CODEGEN']+s_codesets},{"role": "user", "content": prompt}]
  return messages

def setCodeGenPrompt(note, doc_type, incl_hist, codeset):
  if incl_hist == 'Yes':
    history_prompt1 = ' Consider Patient history for the codes. Seperate these under a different section named as History Code in response.'
    history_prompt2 = ' Separate codes based on history of patient into a different section and name it as History.'
  else:
    history_prompt1 = ' Do not consider any history for the generating the codes.'
    history_prompt2 = ''
 
  prompt = f"""{os.environ['OPENAI_CODEGEN_PROMPT1']}Consider codes only related to {codeset}.{history_prompt1}\
{os.environ['OPENAI_CODEGEN_PROMPT2']}{history_prompt2}\
{os.environ['OPENAI_CODEGEN_PROMPT3']}
```{note}```"""

  return prompt

encoding = tiktoken.encoding_for_model(os.environ['DEFAULT_LLM_MODEL'])
def num_tokens_from_response(response_text):
  num_tokens = len(encoding.encode(response_text))
  return num_tokens

def num_tokens_from_messages(messages):
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

### Calculate cost as per the pricing given on 21-Aug-23 in https://openai.com/pricing#language-models
def getOpenaiApiCost(llm_name,completion_tokens,prompt_tokens):
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