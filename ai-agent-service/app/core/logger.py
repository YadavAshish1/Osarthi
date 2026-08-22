"""
Centralized structured logger for the AI Agent service.
"""

import logging
import sys
from app.core.config import settings


def setup_logger(name: str = "osarthi_ai") -> logging.Logger:
    """Configure and return a structured logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    return logger


logger = setup_logger("osarthi.ai")
