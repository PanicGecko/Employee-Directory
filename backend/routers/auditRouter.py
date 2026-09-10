from fastapi import APIRouter, Query

from database import SessionDep
from dependencies import HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from services.auditService import list_audit_logs_service

router = APIRouter(
    prefix="/audit-logs",
    tags=["audit-logs"],
)


@router.get("")
def list_audit_logs(
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    del current_admin
    audit_logs = list_audit_logs_service(
        session=session,
        page=page,
        page_size=page_size,
    )

    return ResponseDTO(
        status_code=200,
        msg="Audit logs retrieved successfully",
        data=audit_logs.model_dump(mode="json"),
    ).to_response()
