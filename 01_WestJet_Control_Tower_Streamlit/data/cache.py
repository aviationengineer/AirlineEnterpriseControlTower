"""data/cache.py — cache loaded frames so repeated filtering does not
reload the workbook.

Keyed by workbook path + file modification time, so an updated workbook is
reloaded automatically. Also caches the built AviationModel. Thread-safe
enough for a single-process Streamlit app; call clear_cache() in tests.
"""

from __future__ import annotations

import os
from pathlib import Path

from data.loader import WorkbookData, load_workbook
from data.transformer import build_model
from models.aviation_model import AviationModel

_cache: dict[str, dict] = {}


def _cache_key(path: str | os.PathLike) -> str:
    resolved = Path(path)
    mtime = resolved.stat().st_mtime if resolved.exists() else 0.0
    return f"{resolved.resolve()}::{mtime}"


def get_workbook(path: str | os.PathLike | None = None) -> WorkbookData:
    """Load the workbook, or return the cached copy if unchanged."""
    from data.loader import DEFAULT_WORKBOOK_PATH
    resolved = Path(path) if path is not None else DEFAULT_WORKBOOK_PATH
    key = _cache_key(resolved)
    entry = _cache.get(key)
    if entry is not None and "workbook" in entry:
        return entry["workbook"]
    data = load_workbook(resolved)
    _cache[key] = {"workbook": data}
    return data


def get_model(path: str | os.PathLike | None = None) -> AviationModel:
    """Load the workbook and build the canonical model (cached)."""
    from data.loader import DEFAULT_WORKBOOK_PATH
    resolved = Path(path) if path is not None else DEFAULT_WORKBOOK_PATH
    key = _cache_key(resolved)
    entry = _cache.get(key)
    if entry is not None and "model" in entry:
        return entry["model"]
    data = get_workbook(resolved)
    model = build_model(data.frames, targets=data.targets)
    _cache.setdefault(key, {})["model"] = model
    return model


def clear_cache() -> None:
    """Drop all cached workbook/model entries."""
    _cache.clear()
