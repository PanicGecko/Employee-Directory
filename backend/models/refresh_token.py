from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    employee_id: int = Field(foreign_key="employees.id", nullable=False, index=True)
    token_hash: str = Field(max_length=255, unique=True, nullable=False)
    expires_at: datetime = Field(nullable=False)
