from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Office(SQLModel, table=True):
    __tablename__ = "offices"

    id: Optional[int] = Field(default=None, primary_key=True, sa_column_kwargs={"autoincrement": True})
    name: str = Field(max_length=150, unique=True, nullable=False)
    street_address: str = Field(max_length=255, nullable=False)
    city: str = Field(max_length=100, nullable=False)
    state: Optional[str] = Field(default=None, max_length=100)
    zip_code: Optional[str] = Field(default=None, max_length=20)
    country: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
