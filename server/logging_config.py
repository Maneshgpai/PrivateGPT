import logging
from sentry_sdk.integrations.logging import LoggingIntegration

# Capture logs of all levels
sentry_logging = LoggingIntegration(
    level=logging.INFO,        # Capture info and above as breadcrumbs
    event_level=logging.ERROR  # Send errors as events
)


# Configure logging to write messages to stdout and a log file
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] [%(filename)s:%(lineno)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log")  # Specify the log file name here
    ]
)

# Get the root logger
logger = logging.getLogger()
