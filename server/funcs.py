import os
import pickle
from dotenv import load_dotenv

load_dotenv()

os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

from langchain import OpenAI
from llama_index import SimpleDirectoryReader, LLMPredictor, get_response_synthesizer, GPTVectorStoreIndex, ServiceContext, StorageContext, load_index_from_storage
from llama_index.retrievers import VectorIndexRetriever
from llama_index.query_engine import RetrieverQueryEngine
from llama_index.indices.postprocessor import SimilarityPostprocessor
from llama_index.node_parser import SimpleNodeParser

index = None
stored_docs = {}
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
        index = GPTVectorStoreIndex([], service_context=service_context)
        index.storage_context.persist(persist_dir=index_name)
    if os.path.exists(pkl_name):
        with open(pkl_name, "rb") as f:
            stored_docs = pickle.load(f)


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


def insert_into_index(doc_file_path, doc_id=None):
    """Insert new document into global index."""
    global index, stored_docs
    
    # document = SimpleDirectoryReader(input_files=[doc_file_path]).load_data()[0]

    document = SimpleDirectoryReader(input_files=[doc_file_path],filename_as_id=True).load_data()

    print("1.funcs.py > insert_into_index: ",doc_id)

    # if doc_id is not None:
    #     document.doc_id = doc_id
    
    print("2.funcs.py > insert_into_index: document:")

    parser = SimpleNodeParser()
    nodes = parser.get_nodes_from_documents(document)
    index = GPTVectorStoreIndex.from_documents(document,show_progress=True)
    index.insert_nodes(nodes)

    index.storage_context.persist(persist_dir=index_name)


    # Keep track of stored docs -- llama_index doesn't make this easy
    # stored_docs[document.doc_id] = document.text[0:200]  # only take the first 200 chars

    print("3.funcs.py > insert_into_index > stored_docs:",stored_docs)

    with open(pkl_name, "wb") as f:
        pickle.dump(stored_docs, f)

    return


def get_documents_list():
    """Get the list of currently stored documents."""
    global stored_doc
    documents_list = []
    print("funcs.py > get_documents_list",stored_docs.items())
    for doc_id, doc_text in stored_docs.items():
        documents_list.append({"id": doc_id, "text": doc_text})

    return documents_list

# init the global index
# if __name__ == "__main__":
# print("Initializing index...")
# initialize_index()
# print("Initialised index")
