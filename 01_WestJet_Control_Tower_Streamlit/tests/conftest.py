"""Shared fixtures for the core test suite."""

import sys
from pathlib import Path

import pytest

PACKAGE_DIR = Path(__file__).resolve().parent.parent
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from data.cache import clear_cache  # noqa: E402
from data.loader import load_workbook  # noqa: E402
from data.transformer import build_model  # noqa: E402

WORKBOOK = PACKAGE_DIR / "data" / \
    "WestJet_Enterprise_Control_Tower_Input_Template.xlsx"


@pytest.fixture(scope="session")
def workbook_data():
    return load_workbook(WORKBOOK)


@pytest.fixture(scope="session")
def model(workbook_data):
    return build_model(workbook_data.frames, targets=workbook_data.targets)


@pytest.fixture(autouse=True)
def _clear_cache():
    clear_cache()
    yield
    clear_cache()
