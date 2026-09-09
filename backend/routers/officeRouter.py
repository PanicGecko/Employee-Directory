from fastapi import APIRouter

from database import SessionDep
from dependencies import HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.officeDto import OfficeCreateRequest, OfficeUpdateRequest
from services.officeService import create_office_service, update_office_service

router = APIRouter(
    prefix="/offices",
    tags=["offices"],
)


@router.post("")
def create_office(
    office_request: OfficeCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    office = create_office_service(
        session=session,
        office_data=office_request,
    )

    return ResponseDTO(
        status_code=201,
        msg="Office created successfully",
        data=office.model_dump(mode="json"),
    ).to_response()


@router.patch("/{office_id}")
def update_office(
    office_id: int,
    office_request: OfficeUpdateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    office = update_office_service(
        session=session,
        office_id=office_id,
        office_data=office_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Office updated successfully",
        data=office.model_dump(mode="json"),
    ).to_response()
