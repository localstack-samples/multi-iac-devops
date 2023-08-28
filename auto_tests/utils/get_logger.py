import logging
import os


def logger():
    loggingLevel = os.getenv("LOGGING_LEVEL", "DEBUG")
    logging.getLogger().setLevel(loggingLevel)
    return logging.getLogger()
