import os
import pickle
from dotenv import load_dotenv

load_dotenv()

os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

from langchain import OpenAI
from llama_index import SimpleDirectoryReader, LLMPredictor, get_response_synthesizer, VectorStoreIndex, ServiceContext, StorageContext, load_index_from_storage
from llama_index.retrievers import VectorIndexRetriever
from llama_index.query_engine import RetrieverQueryEngine
from llama_index.indices.postprocessor import SimilarityPostprocessor
from llama_index.node_parser import SimpleNodeParser

from logging_config import logger

index = None
stored_docs = []
index_name = "./saved_index"
pkl_name = "stored_documents.pkl"


def initialize_index():
    """Create a new global index, or load one from the pre-set path."""
    global index, stored_docs

    llm_predictor = LLMPredictor(llm=OpenAI(temperature=0, model_name="text-davinci-003"))

    # service_context = ServiceContext.from_defaults(chunk_size_limit=512)
    service_context = ServiceContext.from_defaults(llm_predictor=llm_predictor)

    if os.path.exists(index_name):
        index = load_index_from_storage(StorageContext.from_defaults(persist_dir=index_name),
                                        service_context=service_context)
    else:
        index = VectorStoreIndex([], service_context=service_context)
        index.storage_context.persist(persist_dir=index_name)

    if os.path.exists(pkl_name):
        with open(pkl_name, "rb") as f:
            stored_docs = pickle.load(f)

def load_index():
    llm_predictor = LLMPredictor(llm=OpenAI(temperature=0, model_name="text-davinci-003"))

    # service_context = ServiceContext.from_defaults(chunk_size_limit=512)
    service_context = ServiceContext.from_defaults(llm_predictor=llm_predictor)

    if os.path.exists(index_name):
        index = load_index_from_storage(StorageContext.from_defaults(persist_dir=index_name),
                                        service_context=service_context)
    else:
        index = VectorStoreIndex([], service_context=service_context)
        index.storage_context.persist(persist_dir=index_name)

    return index


def query_index(query_text):
    """Query the global index."""
    global index

    ### Try different variations for retrievers:
    ### https://gpt-index.readthedocs.io/en/latest/api_reference/query/retrievers.html
    retriever = VectorIndexRetriever(index=index, similarity_top_k=5,)

    query_engine = RetrieverQueryEngine.from_args(
            retriever,
            ### Try different variations for response_mode: compact, tree_summarize, no_text, accumulate.
            ### https://gpt-index.readthedocs.io/en/latest/end_to_end_tutorials/usage_pattern.html#configuring-response-synthesis
            # response_mode='default',
            node_postprocessors=[SimilarityPostprocessor(similarity_cutoff=0.70)]
            )
    
    # response = index.as_query_engine().query(query_text)
    query_text = query_text + ". Analyze response against the context provided and calculate your own answer. Then compare with response and only provide a response."
    response = query_engine.query(query_text)

    return response


def insert_into_index(docs):
    """Insert new document into global index."""

    global index, stored_docs, pkl_name

    for doc in docs:
        try:
            document = SimpleDirectoryReader(input_files=[doc],filename_as_id=True).load_data()
            parser = SimpleNodeParser.from_defaults(chunk_size=1024, chunk_overlap=20)
            nodes = parser.get_nodes_from_documents(document)
            index.insert_nodes(nodes)
            index.storage_context.persist(persist_dir=index_name)
            stored_docs.append(document[0].metadata['file_name']) 
        
        except Exception as e:
            error = "Error: {}".format(str(e))
            logger.error(error)
        
    with open(pkl_name, "wb") as f:
        pickle.dump(stored_docs, f)

    return


def get_documents_list():
    """Get the list of currently stored documents."""
    global stored_docs
    return stored_docs