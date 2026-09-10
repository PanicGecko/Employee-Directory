from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_employee_id: int
    actor_name: str | None = None
    target_type: str
    target_id: int
    target_name: str | None = None
    action: str
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    created_at: datetime


class AuditLogPaginatedResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
