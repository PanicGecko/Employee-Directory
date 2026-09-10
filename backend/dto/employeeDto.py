from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from dto.departmentDto import DepartmentResponse
from dto.officeDto import OfficeResponse
from dto.skillDto import EmployeeSkillResponse
from models.employee import CollaborationStatus, EmployeeRole, WorkMode


class EmployeeCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: EmployeeRole = EmployeeRole.EMPLOYEE
    phone: str | None = None
    street_address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    collaboration_status: CollaborationStatus = CollaborationStatus.OPEN
    work_mode: WorkMode = WorkMode.REMOTE
    department_id: int | None = None
    manager_id: int | None = None
    office_id: int | None = None
    is_active: bool = True


class EmployeePublicResponse(BaseModel):
    public_id: UUID
    first_name: str
    last_name: str
    email: str
    role: str
    phone: str | None = None
    street_address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None
    collaboration_status: str
    work_mode: str
    department_id: int | None = None
    manager_id: int | None = None
    office_id: int | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    department: DepartmentResponse | None = None
    office: OfficeResponse | None = None
    skills: list[EmployeeSkillResponse] = Field(default_factory=list)


class EmployeeManagerAssignmentRequest(BaseModel):
    manager_public_id: UUID


class EmployeeSelfUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: str | None = Field(default=None, max_length=30)
    street_address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    zip_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)
    collaboration_status: CollaborationStatus | None = None
    work_mode: WorkMode | None = None


class EmployeeManagerUpdateRequest(EmployeeSelfUpdateRequest):
    pass


class EmployeeAdminUpdateRequest(EmployeeSelfUpdateRequest):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = None
    role: EmployeeRole | None = None
    manager_public_id: UUID | None = None
    department_id: int | None = None
    office_id: int | None = None


class EmployeeHierarchyNode(BaseModel):
    employee: EmployeePublicResponse
    direct_reports: list["EmployeeHierarchyNode"] = Field(default_factory=list)


class EmployeePaginatedResponse(BaseModel):
    items: list[EmployeePublicResponse]
    total: int
    page: int
    page_size: int
