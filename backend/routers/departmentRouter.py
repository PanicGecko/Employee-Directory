from fastapi import APIRouter

from database import SessionDep
from dependencies import HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.departmentDto import DepartmentCreateRequest, DepartmentUpdateRequest
from services.departmentService import create_department_service, update_department_service

router = APIRouter(
    prefix="/departments",
    tags=["departments"],
)


@router.post("")
def create_department(
    department_request: DepartmentCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    department = create_department_service(
        session=session,
        department_data=department_request,
    )

    return ResponseDTO(
        status_code=201,
        msg="Department created successfully",
        data=department.model_dump(mode="json"),
    ).to_response()


@router.patch("/{department_id}")
def update_department(
    department_id: int,
    department_request: DepartmentUpdateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    department = update_department_service(
        session=session,
        department_id=department_id,
        department_data=department_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Department updated successfully",
        data=department.model_dump(mode="json"),
    ).to_response()
