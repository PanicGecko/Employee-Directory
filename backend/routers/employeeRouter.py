from uuid import UUID

from fastapi import APIRouter, Query

from database import SessionDep
from dependencies import CurrentEmployeeDep, HRAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.employeeDto import (
    EmployeeAdminUpdateRequest,
    EmployeeManagerAssignmentRequest,
    EmployeeManagerUpdateRequest,
    EmployeeSelfUpdateRequest,
)
from models.employee import CollaborationStatus, WorkMode
from models.skill import ProficiencyLevel
from services.employeeService import (
    activate_employee_service,
    assign_employee_manager_service,
    deactivate_employee_service,
    get_all_descendants_service,
    get_direct_reports_service,
    get_employee_by_public_id_service,
    get_full_hierarchy_service,
    get_employee_manager_service,
    list_employees_service,
    update_own_profile_service,
    update_employee_as_admin_service,
    update_subordinate_profile_service,
)

router = APIRouter(
    prefix="/employees",
    tags=["employees"],
)


@router.get("")
def list_employees(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, min_length=1),
    department_id: int | None = Query(default=None),
    office_id: int | None = Query(default=None),
    work_mode: WorkMode | None = Query(default=None),
    collaboration_status: CollaborationStatus | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    skill_id: int | None = Query(default=None),
    proficiency: ProficiencyLevel | None = Query(default=None),
):
    del current_employee
    result = list_employees_service(
        session=session,
        page=page,
        page_size=page_size,
        search=search,
        department_id=department_id,
        office_id=office_id,
        work_mode=work_mode,
        collaboration_status=collaboration_status,
        is_active=is_active,
        skill_id=skill_id,
        proficiency=proficiency,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employees retrieved successfully",
        data=result.model_dump(mode="json"),
    ).to_response()


@router.get("/hierarchy")
def get_employee_hierarchy(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    hierarchy = get_full_hierarchy_service(session)

    return ResponseDTO(
        status_code=200,
        msg="Employee hierarchy retrieved successfully",
        data=[node.model_dump(mode="json") for node in hierarchy],
    ).to_response()


@router.patch("/me")
def update_own_profile(
    employee_request: EmployeeSelfUpdateRequest,
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    employee = update_own_profile_service(
        session=session,
        current_employee=current_employee,
        employee_data=employee_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee profile updated successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.patch("/{public_id}/profile")
def update_subordinate_profile(
    public_id: UUID,
    employee_request: EmployeeManagerUpdateRequest,
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    employee = update_subordinate_profile_service(
        session=session,
        current_employee=current_employee,
        employee_public_id=public_id,
        employee_data=employee_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee profile updated successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.patch("/{public_id}/activate")
def activate_employee(
    public_id: UUID,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    employee = activate_employee_service(
        session=session,
        employee_public_id=public_id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee activated successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.patch("/{public_id}/deactivate")
def deactivate_employee(
    public_id: UUID,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    employee = deactivate_employee_service(
        session=session,
        employee_public_id=public_id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee deactivated successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.patch("/{public_id}")
def update_employee_as_admin(
    public_id: UUID,
    employee_request: EmployeeAdminUpdateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    employee = update_employee_as_admin_service(
        session=session,
        employee_public_id=public_id,
        employee_data=employee_request,
        actor_employee=current_admin,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee updated successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.get("/{public_id}")
def get_employee(public_id: UUID, session: SessionDep, current_employee: CurrentEmployeeDep):
    del current_employee
    employee = get_employee_by_public_id_service(session=session, public_id=public_id)

    return ResponseDTO(
        status_code=200,
        msg="Employee retrieved successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.get("/{public_id}/manager")
def get_employee_manager(public_id: UUID, session: SessionDep, current_employee: CurrentEmployeeDep):
    del current_employee
    manager = get_employee_manager_service(session=session, public_id=public_id)

    return ResponseDTO(
        status_code=200,
        msg="Employee manager retrieved successfully",
        data=manager.model_dump(mode="json") if manager is not None else None,
    ).to_response()


@router.patch("/{public_id}/manager")
def assign_employee_manager(
    public_id: UUID,
    manager_request: EmployeeManagerAssignmentRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    employee = assign_employee_manager_service(
        session=session,
        employee_public_id=public_id,
        manager_data=manager_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee manager assigned successfully",
        data=employee.model_dump(mode="json"),
    ).to_response()


@router.get("/{public_id}/direct-reports")
def get_employee_direct_reports(public_id: UUID, session: SessionDep, current_employee: CurrentEmployeeDep):
    del current_employee
    direct_reports = get_direct_reports_service(session=session, public_id=public_id)

    return ResponseDTO(
        status_code=200,
        msg="Direct reports retrieved successfully",
        data=[report.model_dump(mode="json") for report in direct_reports],
    ).to_response()


@router.get("/{public_id}/descendants")
def get_employee_descendants(
    public_id: UUID,
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    descendants = get_all_descendants_service(
        session=session,
        public_id=public_id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee descendants retrieved successfully",
        data=[employee.model_dump(mode="json") for employee in descendants],
    ).to_response()
