from fastapi import APIRouter

from database import SessionDep
from dependencies import CurrentEmployeeDep, HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.departmentDto import DepartmentCreateRequest, DepartmentUpdateRequest
from services.departmentService import (
    create_department_service,
    delete_department_service,
    list_active_departments_service,
    list_departments_service,
    update_department_service,
)

router = APIRouter(
    prefix="/departments",
    tags=["departments"],
)


@router.get("")
def list_departments(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    departments = list_departments_service(session=session)

    return ResponseDTO(
        status_code=200,
        msg="Departments retrieved successfully",
        data=[department.model_dump(mode="json") for department in departments],
    ).to_response()


@router.get("/active")
def list_active_departments(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    departments = list_active_departments_service(session=session)

    return ResponseDTO(
        status_code=200,
        msg="Active departments retrieved successfully",
        data=[department.model_dump(mode="json") for department in departments],
    ).to_response()


@router.post("")
def create_department(
    department_request: DepartmentCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    department = create_department_service(
        session=session,
        department_data=department_request,
        actor_employee_id=current_admin.id,
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
    department = update_department_service(
        session=session,
        department_id=department_id,
        department_data=department_request,
        actor_employee_id=current_admin.id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Department updated successfully",
        data=department.model_dump(mode="json"),
    ).to_response()


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    department = delete_department_service(
        session=session,
        department_id=department_id,
        actor_employee_id=current_admin.id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Department deleted successfully",
        data=department.model_dump(mode="json"),
    ).to_response()
