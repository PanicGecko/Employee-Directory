from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field


class ProficiencyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class Skill(SQLModel, table=True):
    __tablename__ = "skills"

    id: Optional[int] = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    name: str = Field(max_length=150, unique=True, nullable=False)
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class EmployeeSkill(SQLModel, table=True):
    __tablename__ = "employee_skills"

    employee_id: int = Field(foreign_key="employees.id", primary_key=True)
    skill_id: int = Field(foreign_key="skills.id", primary_key=True)
    proficiency: ProficiencyLevel = Field(nullable=False)
