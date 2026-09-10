from fastapi import APIRouter

from database import SessionDep
from dependencies import CurrentEmployeeDep, HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.officeDto import OfficeCreateRequest, OfficeUpdateRequest
from services.officeService import (
    create_office_service,
    delete_office_service,
    list_active_offices_service,
    list_offices_service,
    update_office_service,
)

router = APIRouter(
    prefix="/offices",
    tags=["offices"],
)


@router.get("")
def list_offices(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    offices = list_offices_service(session=session)

    return ResponseDTO(
        status_code=200,
        msg="Offices retrieved successfully",
        data=[office.model_dump(mode="json") for office in offices],
    ).to_response()


@router.get("/active")
def list_active_offices(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    offices = list_active_offices_service(session=session)

    return ResponseDTO(
        status_code=200,
        msg="Active offices retrieved successfully",
        data=[office.model_dump(mode="json") for office in offices],
    ).to_response()


@router.post("")
def create_office(
    office_request: OfficeCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    office = create_office_service(
        session=session,
        office_data=office_request,
        actor_employee_id=current_admin.id,
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
    office = update_office_service(
        session=session,
        office_id=office_id,
        office_data=office_request,
        actor_employee_id=current_admin.id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Office updated successfully",
        data=office.model_dump(mode="json"),
    ).to_response()


@router.delete("/{office_id}")
def delete_office(
    office_id: int,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    office = delete_office_service(
        session=session,
        office_id=office_id,
        actor_employee_id=current_admin.id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Office deleted successfully",
        data=office.model_dump(mode="json"),
    ).to_response()
