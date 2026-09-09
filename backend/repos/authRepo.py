from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from models.employee import Employee
from models.refresh_token import RefreshToken


def get_employee_by_email(session: Session, email: str) -> Employee | None:
    return session.exec(
        select(Employee).where(Employee.email == email)
    ).first()


def get_employee_by_id(session: Session, employee_id: int) -> Employee | None:
    return session.get(Employee, employee_id)


def get_employee_by_public_id(
    session: Session,
    public_id: UUID,
) -> Employee | None:
    return session.exec(
        select(Employee).where(Employee.public_id == public_id)
    ).first()


def get_refresh_token_by_hash(
    session: Session,
    token_hash: str,
) -> RefreshToken | None:
    statement = (
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .with_for_update()
    )
    return session.exec(statement).first()


def create_refresh_token_record(
    session: Session,
    employee_id: int,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    refresh_token = RefreshToken(
        employee_id=employee_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    session.add(refresh_token)
    return refresh_token


def delete_refresh_token_record(
    session: Session,
    refresh_token: RefreshToken,
) -> None:
    session.delete(refresh_token)
