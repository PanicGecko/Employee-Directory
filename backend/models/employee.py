import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship


class EmployeeRole(str, Enum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    HR_ADMIN = "hr_admin"


class CollaborationStatus(str, Enum):
    OPEN = "open"
    BUSY = "busy"
    UNAVAILABLE = "unavailable"


class WorkMode(str, Enum):
    REMOTE = "remote"
    IN_OFFICE = "in_office"
    HYBRID = "hybrid"


class Employee(SQLModel, table=True):
    __tablename__ = "employees"

    id: Optional[int] = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    public_id: uuid.UUID = Field(default_factory=uuid.uuid4, unique=True, index=True, nullable=False)
    first_name: str = Field(max_length=100, nullable=False)
    last_name: str = Field(max_length=100, nullable=False)
    email: str = Field(max_length=255, unique=True, nullable=False, index=True)
    password_hash: str = Field(max_length=255, nullable=False)
    role: EmployeeRole = Field(nullable=False)
    phone: Optional[str] = Field(default=None, max_length=30)
    street_address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    zip_code: Optional[str] = Field(default=None, max_length=20)
    country: Optional[str] = Field(default=None, max_length=100)
    collaboration_status: CollaborationStatus = Field(nullable=False)
    work_mode: WorkMode = Field(nullable=False)
    department_id: Optional[int] = Field(default=None, foreign_key="departments.id")
    manager_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    office_id: Optional[int] = Field(default=None, foreign_key="offices.id")
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

