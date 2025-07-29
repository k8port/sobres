# tests/unit/test_core/test_statement_extractor.py

import io
import pandas as pd
import numpy as np
import pytest
from app.core.statement_extractor import extract_pdf_content

# A tiny dummy “page” that mimics pdfplumber’s API
class DummyPage:
    def __init__(self, text: str, tables: list):
        self._text = text
        self._tables = tables

    def extract_text(self):
        return self._text

    def extract_tables(self):
        # each table is a list-of-rows, where first row is header
        return self._tables

# A dummy PDF context manager
class DummyPDF:
    def __init__(self, pages):
        self.pages = pages
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        pass

def test_extract_pdf_content_empty_pdf(monkeypatch):
    # Simulate pdfplumber.open raising an error
    monkeypatch.setattr("pdfplumber.open", lambda stream: (_ for _ in ()).throw(RuntimeError("boom")))
    result = extract_pdf_content("%PDF-1.4…")
    assert result["text"] == ""
    assert isinstance(result["tables"], pd.DataFrame)
    assert result["tables"].empty

def test_extract_pdf_content_text_only(monkeypatch):
    # One page, text only, no tables
    dummy = DummyPDF([DummyPage("Hello\nWorld", [])])
    monkeypatch.setattr("pdfplumber.open", lambda stream: dummy)

    out = extract_pdf_content(b"whatever")
    assert out["text"] == "Hello\nWorld"
    # tables DataFrame should exist but be empty
    assert isinstance(out["tables"], pd.DataFrame)
    assert out["tables"].empty

def test_extract_pdf_content_one_table(monkeypatch):
    # One page, with a 2x2 table
    header = ["A", "B"]
    rows = [
        ["1", "2"],
        ["3", "4"],
    ]
    dummy = DummyPDF([DummyPage("", [ [header] + rows ])])
    monkeypatch.setattr("pdfplumber.open", lambda stream: dummy)

    out = extract_pdf_content(b"bytes")
    # text is empty
    assert out["text"] == ""
    # tables should have 2 rows, 2 columns
    df = out["tables"]
    assert list(df.columns) == header
    assert df.shape == (2, 2)
    # check values
