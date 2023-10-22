import logging


# Configure logging to write messages to stdout and a log file
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(filename)s:%(lineno)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log")  # Specify the log file name here
    ]
)

# Get the root logger
logger = logging.getLogger()
