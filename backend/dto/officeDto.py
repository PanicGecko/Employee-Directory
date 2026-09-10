from datetime import datetime

from pydantic import BaseModel


class OfficeCreateRequest(BaseModel):
    name: str
    street_address: str
    city: str
    state: str | None = None
    zip_code: str | None = None
    country: str


class OfficeUpdateRequest(BaseModel):
    name: str | None = None
    street_address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    country: str | None = None


class OfficeResponse(BaseModel):
    id: int
    name: str
    street_address: str
    city: str
    state: str | None = None
    zip_code: str | None = None
    country: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
