from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from models.skill import ProficiencyLevel


class SkillCreateRequest(BaseModel):
    name: str
    description: str | None = None


class SkillUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class SkillResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class AssignSkillRequest(BaseModel):
    employee_public_id: UUID
    skill_id: int | None = None
    skill_name: str | None = None
    proficiency: ProficiencyLevel


class UpdateSkillProficiencyRequest(BaseModel):
    proficiency: ProficiencyLevel


class EmployeeSkillResponse(BaseModel):
    skill_id: int
    skill_name: str
    description: str | None = None
    proficiency: ProficiencyLevel
