import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("preview_endpoint", "https://onet-tiles-update.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/cde"


def _mock_token(nickname: str) -> str:
    return f"mock-token:{nickname}@connectify.com"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def opid():
    return str(uuid.uuid4())


@pytest.fixture
def user_session():
    """Fresh nickname + provisioned account each test."""
    nick = f"tuser{uuid.uuid4().hex[:8]}"
    token = _mock_token(nick)
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    # Provision
    r = s.post(f"{API}?action=provision", json={"username": nick})
    assert r.status_code == 200, r.text
    s.nickname = nick  # type: ignore
    return s


def get_profile(session):
    r = session.get(f"{API}?action=get_profile")
    assert r.status_code == 200, r.text
    return r.json()["profile"]


def mutate(session, op_type, payload, base_revision, opid=None):
    body = {
        "opId": opid or str(uuid.uuid4()),
        "type": op_type,
        "payload": payload,
        "baseRevision": base_revision,
    }
    return session.post(f"{API}?action=mutate_state", json=body)


@pytest.fixture
def helpers():
    class H:
        get_profile = staticmethod(get_profile)
        mutate = staticmethod(mutate)
        API = API
    return H
