from typing import Any
from pydantic import BaseModel
from typing import Any
from fastapi.responses import JSONResponse


class ResponseDTO(BaseModel):
    status_code: int
    msg: str
    data: Any | None = None

    def to_response(self):
        return JSONResponse(
            status_code=self.status_code,
            content=self.model_dump(mode="json")
        )