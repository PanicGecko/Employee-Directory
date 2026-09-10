import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import get_session  # noqa: E402
from dependencies import (  # noqa: E402
    get_current_employee,
    get_hr_admin_employee,
    get_manager_or_admin_employee,
)
from main import app  # noqa: E402


@pytest.fixture()
def current_employee():
    return SimpleNamespace(id=1, role="hr_admin")


@pytest.fixture()
def client(current_employee):
    def override_session():
        yield SimpleNamespace(name="test-session")

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_employee] = lambda: current_employee
    app.dependency_overrides[get_hr_admin_employee] = lambda: current_employee
    app.dependency_overrides[get_manager_or_admin_employee] = lambda: current_employee

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture()
def unauthenticated_client():
    def override_session():
        yield SimpleNamespace(name="test-session")

    app.dependency_overrides[get_session] = override_session

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture()
def employee_client():
    regular_employee = SimpleNamespace(id=2, role="employee")

    def override_session():
        yield SimpleNamespace(name="test-session")

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_current_employee] = lambda: regular_employee

    yield TestClient(app)

    app.dependency_overrides.clear()
