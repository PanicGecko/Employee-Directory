from sqlmodel import Session, select
from sqlalchemy import and_, func
from sqlalchemy.orm import aliased

from models.audit_log import AuditLog
from models.employee import Employee


def create_audit_log(session: Session, audit_log: AuditLog) -> AuditLog:
    session.add(audit_log)
    session.flush()
    return audit_log


def list_audit_logs(
    session: Session,
    *,
    page: int,
    page_size: int,
) -> tuple[list[tuple[AuditLog, str | None, str | None]], int]:
    total = session.exec(
        select(func.count()).select_from(AuditLog)
    ).one()

    ActorEmployee = aliased(Employee)
    TargetEmployee = aliased(Employee)

    rows = session.exec(
        select(
            AuditLog,
            ActorEmployee.first_name,
            ActorEmployee.last_name,
            TargetEmployee.first_name,
            TargetEmployee.last_name,
        )
        .join(ActorEmployee, ActorEmployee.id == AuditLog.actor_employee_id, isouter=True)
        .outerjoin(
            TargetEmployee,
            and_(
                AuditLog.target_type == "employee",
                AuditLog.target_id == TargetEmployee.id,
            ),
        )
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    results = [
        (
            audit_log,
            f"{actor_first} {actor_last}" if actor_first is not None else None,
            f"{target_first} {target_last}" if target_first is not None else None,
        )
        for audit_log, actor_first, actor_last, target_first, target_last in rows
    ]

    return results, total
