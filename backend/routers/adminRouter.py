from fastapi import APIRouter

from database import SessionDep
from dependencies import HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.employeeDto import EmployeeCreateRequest
from services.employeeService import create_employee_service

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@router.post("/employees")
def create_employee(
    employee_request: EmployeeCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    employee = create_employee_service(
        session=session,
        employee_data=employee_request,
        actor_employee=current_admin,
    )

    return ResponseDTO(
        status_code=201,
        msg="Employee created successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()
