import logging

# Configure logging to write messages to stdout and a log file
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log")  # Specify the log file name here
    ]
)

# Get the root logger
logger = logging.getLogger()
