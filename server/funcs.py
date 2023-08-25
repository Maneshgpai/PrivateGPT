import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.chains.summarize import load_summarize_chain
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document
from langchain.prompts import PromptTemplate

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


def summarize_text(text, options):
    llm = ChatOpenAI(temperature=options['temperature'], model_name=options['model'])
    text_splitter = CharacterTextSplitter()
    texts = text_splitter.split_text(text)
    doc = [Document(page_content=t) for t in texts]

    prompt_template = """Write a concise summary of the following:
    "{doc}"
    CONCISE SUMMARY:"""
    prompt = PromptTemplate.from_template(prompt_template)

    chain = load_summarize_chain(
        llm, document_variable_name="doc", chain_type="stuff", prompt=prompt)
    summary = chain.run(doc)
    return summary.strip()


def get_options(request):
    default_temperature = 0
    default_model = "gpt-3.5-turbo-16k"

    return {
        "temperature": float(request.args.get('temperature', default_temperature)),
        "model": request.args.get('model', default_model)
    }
