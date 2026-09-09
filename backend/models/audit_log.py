from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    actor_employee_id: int = Field(foreign_key="employees.id", nullable=False)
    target_type: str = Field(max_length=50, nullable=False)
    target_id: int = Field(nullable=False)
    action: str = Field(max_length=100, nullable=False)
    old_values: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    new_values: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
