from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session

from jwtToken import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from models.employee import Employee
from repos.authRepo import (
    create_refresh_token_record,
    delete_refresh_token_record,
    get_employee_by_email,
    get_employee_by_id,
    get_employee_by_public_id,
    get_refresh_token_by_hash,
)
from security import hash_refresh_token, verify_password


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _issue_tokens(session: Session, employee: Employee) -> dict[str, Any]:
    if employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    role = employee.role.value if hasattr(employee.role, "value") else employee.role
    employee_public_id = str(employee.public_id)

    access_token = create_access_token(
        user_id=employee_public_id,
        role=role,
    )
    refresh_token, _refresh_token_id, refresh_expires_at = create_refresh_token(
        user_id=employee_public_id,
        role=role,
    )

    create_refresh_token_record(
        session=session,
        employee_id=employee.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=refresh_expires_at,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "refresh_token_expires_at": refresh_expires_at.isoformat(),
        "employee": {
            "public_id": employee_public_id,
            "email": employee.email,
            "role": role,
        },
    }


def login_employee(
    session: Session,
    email: str,
    password: str,
) -> dict[str, Any]:
    employee = get_employee_by_email(
        session=session,
        email=email.strip().lower(),
    )

    if employee is None or not verify_password(password, employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive",
        )

    token_data = _issue_tokens(session, employee)
    session.commit()

    return token_data


def authenticate_access_token(
    session: Session,
    access_token: str,
) -> Employee:
    payload = decode_token(access_token)
    subject = payload.get("sub")

    if payload.get("type") != "access" or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        employee_public_id = UUID(str(subject))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    employee = get_employee_by_public_id(session, employee_public_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive",
        )

    return employee


def refresh_employee_tokens(
    session: Session,
    refresh_token: str,
) -> dict[str, Any]:
    payload = decode_token(refresh_token)

    if payload.get("type") != "refresh" or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    stored_token = get_refresh_token_by_hash(
        session=session,
        token_hash=hash_refresh_token(refresh_token),
    )

    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if _as_utc(stored_token.expires_at) <= datetime.now(timezone.utc):
        delete_refresh_token_record(session, stored_token)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    employee = get_employee_by_id(session, stored_token.employee_id)

    if employee is None or str(employee.public_id) != str(payload["sub"]):
        delete_refresh_token_record(session, stored_token)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if not employee.is_active:
        delete_refresh_token_record(session, stored_token)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is inactive",
        )

    delete_refresh_token_record(session, stored_token)
    token_data = _issue_tokens(session, employee)
    session.commit()

    return token_data
