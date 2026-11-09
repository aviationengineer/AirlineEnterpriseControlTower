"""Shared-password gate tests: fail-closed when unconfigured, wrong and
correct passwords, already-authenticated pass-through, sign-out.

The gate is exercised with a stubbed ``streamlit`` module so no
Streamlit runtime is needed; one AppTest check boots the real app with
no password configured and asserts it stops at the not-configured
message. The test password below is a fixture only — never a real
credential.
"""

import sys
from pathlib import Path

import pytest

PACKAGE_DIR = Path(__file__).resolve().parent.parent
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

import auth  # noqa: E402
from auth import (  # noqa: E402
    is_authenticated,
    require_auth,
    resolve_app_password,
    sign_out,
)
from streamlit.runtime.scriptrunner.script_runner import (  # noqa: E402
    RerunException,
    StopException,
)
from streamlit.runtime.scriptrunner_utils.script_requests import (  # noqa: E402
    RerunData,
)
from streamlit.testing.v1 import AppTest  # noqa: E402

APP = str(PACKAGE_DIR / "app.py")
TIMEOUT = 120
TEST_PASSWORD = "test-password"
NOT_CONFIGURED = (
    "Authentication is not configured — set APP_PASSWORD in this app's "
    "Streamlit Cloud Secrets."
)


class _FakeStreamlit:
    """Minimal stand-in for the streamlit module used by auth.py."""

    def __init__(self, secrets=None, password_input="",
                 button_pressed=False):
        self.secrets = dict(secrets or {})
        self.session_state = {}
        self.password_input = password_input
        self.button_pressed = button_pressed
        self.titles: list = []
        self.errors: list = []

    def title(self, text):
        self.titles.append(text)

    def markdown(self, text, unsafe_allow_html=False):
        pass

    def text_input(self, label, type=None, key=None):
        return self.password_input

    def button(self, label, key=None):
        return self.button_pressed

    def error(self, message):
        self.errors.append(message)

    def stop(self):
        raise StopException()

    def rerun(self):
        raise RerunException(RerunData())


@pytest.fixture
def fake_st(monkeypatch):
    """Stub auth.st with a recorder fake."""
    fake = _FakeStreamlit()
    monkeypatch.setattr(auth, "st", fake)
    return fake


def test_no_password_means_not_configured(fake_st):
    """No secret: the gate stops with the not-configured message, and the
    login screen is never rendered."""
    assert resolve_app_password() == ""
    assert is_authenticated() is False
    with pytest.raises(StopException):
        require_auth()
    assert fake_st.errors == [NOT_CONFIGURED]
    assert fake_st.titles == []


def test_empty_password_secret_is_not_configured(fake_st):
    """An empty APP_PASSWORD is the same as no password: fail closed."""
    fake_st.secrets = {"APP_PASSWORD": ""}
    assert resolve_app_password() == ""
    with pytest.raises(StopException):
        require_auth()
    assert fake_st.errors == [NOT_CONFIGURED]


def test_non_string_password_is_not_configured(fake_st):
    """A non-string APP_PASSWORD (misconfigured secret) is ignored."""
    fake_st.secrets = {"APP_PASSWORD": 12345}
    assert resolve_app_password() == ""
    with pytest.raises(StopException):
        require_auth()


def test_login_screen_shown_without_submit(fake_st):
    """Password set, no button press: the login screen renders and the
    gate stays closed."""
    fake_st.secrets = {"APP_PASSWORD": TEST_PASSWORD}
    assert require_auth() is False
    assert fake_st.titles == ["WestJet — Enterprise Aviation Control Tower"]
    assert fake_st.errors == []
    assert is_authenticated() is False


def test_wrong_password_denied(fake_st):
    """A wrong password shows only the generic message — nothing about
    the configured password is revealed."""
    fake_st.secrets = {"APP_PASSWORD": TEST_PASSWORD}
    fake_st.password_input = "not-the-password"
    fake_st.button_pressed = True
    assert require_auth() is False
    assert fake_st.errors == ["Incorrect password"]
    assert is_authenticated() is False


def test_correct_password_authenticates(fake_st):
    """The right password sets the session flag, then reruns the app."""
    fake_st.secrets = {"APP_PASSWORD": TEST_PASSWORD}
    fake_st.password_input = TEST_PASSWORD
    fake_st.button_pressed = True
    with pytest.raises(RerunException):
        require_auth()
    assert is_authenticated() is True


def test_already_authenticated_passes_through(fake_st):
    """A signed-in session is not asked again — no login screen."""
    fake_st.secrets = {"APP_PASSWORD": TEST_PASSWORD}
    fake_st.session_state["_auth_authenticated"] = True
    assert require_auth() is True
    assert fake_st.titles == []
    assert fake_st.errors == []


def test_sign_out_clears_flag(fake_st):
    fake_st.session_state["_auth_authenticated"] = True
    assert is_authenticated() is True
    sign_out()
    assert is_authenticated() is False
    # Signing out twice is harmless.
    sign_out()
    assert is_authenticated() is False


def test_no_streamlit_is_fail_closed(monkeypatch):
    """No Streamlit runtime at all: nothing resolves, nothing passes."""
    monkeypatch.setattr(auth, "st", None)
    assert resolve_app_password() == ""
    assert is_authenticated() is False
    assert require_auth() is False


def test_app_stops_at_gate_when_no_password_configured():
    """The real app with no APP_PASSWORD secret: it stops at the gate
    with the not-configured message — the workbook is never loaded and
    no dashboard content renders."""
    at = AppTest.from_file(APP, default_timeout=TIMEOUT)
    at.run()
    assert not at.exception, f"app raised: {at.exception}"
    errors = [str(getattr(el, "value", "")) for el in at.error]
    assert any(NOT_CONFIGURED in e for e in errors)
    titles = [str(getattr(el, "value", "")) for el in at.title]
    assert "WestJet — Enterprise Aviation Control Tower" not in titles
