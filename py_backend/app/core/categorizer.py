# py_backend/app/core/categorizer.py
from datetime import datetime
from typing import List, Dict, Any
import re

"""
Simple rule-based categorizer.

Usage: python categorizer.py --input statement.txt

Objective: Map rows of text to {date, desc, amt, category}.
"""