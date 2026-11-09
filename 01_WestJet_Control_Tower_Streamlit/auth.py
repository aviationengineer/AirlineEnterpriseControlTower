"""Shared-password gate — simple login for the Streamlit app.

How it works
------------
* The password is read from Streamlit secrets (``APP_PASSWORD``) only.
  There is no environment-variable fallback, no config constant and no
  hard-coded value: the password is chosen by the app owner and entered
  in Streamlit Cloud (Manage app → Settings → Secrets). It is never
  committed to the repo and never passes through chat.
* Fail closed: when no password is configured the app shows a short
  "not configured" message and stops — it never falls back to open
  access, and it never loads the workbook or starts tracking.
* Once a session is authenticated (``st.session_state`` flag), the gate
  returns immediately. Signing in compares the entered password with
  ``hmac.compare_digest``; on success the flag is set and the app
  reruns, on failure a generic "Incorrect password" is shown and
  nothing else is revealed.
* ``sign_out()`` clears the flag; the caller reruns the app.

Limits (stated honestly)
------------------------
This is a SHARED password: one password for everyone who knows it, no
per-user identity, no brute-force lockout. It gates the app's pages
only — the workbook and data live in the public repo, so the data files
themselves are not protected by it. The HTML/Pages version is not
gated by this module.

Import safety
--------------
Importing this module never requires a running Streamlit app: the
``streamlit`` import is guarded, and all Streamlit calls happen inside
``require_auth`` / ``sign_out``. Unit tests can therefore import and
exercise the pure helpers without Streamlit at all.
"""

from __future__ import annotations

import hmac

try:
    import streamlit as st
except Exception:  # pragma: no cover - streamlit unavailable in tests
    st = None  # type: ignore[assignment]

_AUTH_SESSION_KEY = "_auth_authenticated"

_NOT_CONFIGURED_MESSAGE = (
    "Authentication is not configured — set APP_PASSWORD in this app's "
    "Streamlit Cloud Secrets."
)


def resolve_app_password() -> str:
    """Read the password from Streamlit secrets only.

    Returns "" when no password is configured (or Streamlit is not
    running, or the secret is not a non-empty string). The gate treats
    "" as 'not configured' and fails closed.
    """
    if st is None:
        return ""
    try:
        value = st.secrets.get("APP_PASSWORD")
    except Exception:
        return ""
    return value if isinstance(value, str) and value else ""


def is_authenticated() -> bool:
    """True when this session has already signed in."""
    if st is None:
        return False
    try:
        return bool(st.session_state.get(_AUTH_SESSION_KEY))
    except Exception:
        return False


def sign_out() -> None:
    """Clear the authenticated flag for this session (no-op without
    Streamlit). The caller reruns the app after calling this."""
    if st is None:
        return
    try:
        st.session_state.pop(_AUTH_SESSION_KEY, None)
    except Exception:
        pass


def require_auth() -> bool:
    """Gate the app behind the shared password.

    Call this first, before any data loading or tracking. Returns True
    when the session is authenticated and the caller may proceed; False
    when the login screen was rendered and the caller should return
    without loading anything. When no password is configured it shows
    the not-configured message and stops the script (``st.stop()``
    raises in a real run, so the ``return False`` after it is only a
    fallback for environments where stop does not raise).
    """
    if st is None:
        return False
    password = resolve_app_password()
    if not password:
        st.error(_NOT_CONFIGURED_MESSAGE)
        st.stop()
        return False  # unreachable in a real run (st.stop raises)
    if is_authenticated():
        return True
    st.title("WestJet — Enterprise Aviation Control Tower")
    st.markdown("Sign in to continue.")
    entered = st.text_input("Password", type="password",
                            key="auth_password")
    if st.button("Sign in", key="auth_sign_in"):
        if entered and hmac.compare_digest(entered, password):
            try:
                st.session_state[_AUTH_SESSION_KEY] = True
            except Exception:
                return False
            st.rerun()
            return True  # unreachable in a real run (st.rerun raises)
        st.error("Incorrect password")
    return False
