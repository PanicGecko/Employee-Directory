from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session

from dto.auditDto import AuditLogPaginatedResponse, AuditLogResponse
from models.audit_log import AuditLog
from repos.auditRepo import create_audit_log, list_audit_logs


def _normalize_audit_value(value: Any) -> Any:
    if hasattr(value, "value"):
        return value.value
    if isinstance(value, UUID):
        return str(value)
    return value


def build_changed_profile_audit_values(
    original_employee: Any,
    updated_values: dict[str, Any],
    safe_fields: set[str],
) -> tuple[dict[str, Any], dict[str, Any]]:
    old_values: dict[str, Any] = {}
    new_values: dict[str, Any] = {}

    for field_name, value in updated_values.items():
        if field_name not in safe_fields:
            continue

        old_value = getattr(original_employee, field_name)
        if old_value == value:
            continue

        old_values[field_name] = _normalize_audit_value(old_value)
        new_values[field_name] = _normalize_audit_value(value)

    return old_values, new_values


def record_audit_log(
    session: Session,
    *,
    actor_employee_id: int,
    target_type: str,
    target_id: int,
    action: str,
    old_values: dict[str, Any] | None = None,
    new_values: dict[str, Any] | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        actor_employee_id=actor_employee_id,
        target_type=target_type,
        target_id=target_id,
        action=action,
        old_values=old_values,
        new_values=new_values,
    )
    return create_audit_log(session=session, audit_log=audit_log)


def list_audit_logs_service(
    session: Session,
    *,
    page: int,
    page_size: int,
) -> AuditLogPaginatedResponse:
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be 1 or greater",
        )
    if page_size < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be 1 or greater",
        )

    audit_logs, total = list_audit_logs(
        session=session,
        page=page,
        page_size=page_size,
    )

    return AuditLogPaginatedResponse(
        items=[
            AuditLogResponse(
                id=audit_log.id,
                actor_employee_id=audit_log.actor_employee_id,
                actor_name=actor_name,
                target_type=audit_log.target_type,
                target_id=audit_log.target_id,
                target_name=target_name,
                action=audit_log.action,
                old_values=audit_log.old_values,
                new_values=audit_log.new_values,
                created_at=audit_log.created_at,
            )
            for audit_log, actor_name, target_name in audit_logs
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
