from datetime import datetime

from fastapi import HTTPException, status

from dto.departmentDto import DepartmentCreateRequest, DepartmentResponse, DepartmentUpdateRequest
from models.department import Department
from repos.departmentRepo import (
    create_department,
    get_department_by_id,
    list_active_departments,
    list_departments,
    update_department,
)
from repos.employeeRepo import has_employees_in_department
from services.auditService import record_audit_log


def list_departments_service(session) -> list[DepartmentResponse]:
    departments = list_departments(session=session)

    return [
        DepartmentResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            is_active=department.is_active,
            created_at=department.created_at,
            updated_at=department.updated_at,
        )
        for department in departments
    ]


def list_active_departments_service(session) -> list[DepartmentResponse]:
    departments = list_active_departments(session=session)

    return [
        DepartmentResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            is_active=department.is_active,
            created_at=department.created_at,
            updated_at=department.updated_at,
        )
        for department in departments
    ]


def create_department_service(
    session,
    department_data: DepartmentCreateRequest,
    actor_employee_id: int,
) -> DepartmentResponse:
    normalized_name = department_data.name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name is required",
        )

    department = Department(
        name=normalized_name,
        description=department_data.description.strip() if department_data.description else None,
    )

    created_department = create_department(session=session, department=department)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="department",
        target_id=created_department.id,
        action="create",
        new_values={
            "name": created_department.name,
            "description": created_department.description,
            "is_active": created_department.is_active,
        },
    )
    session.commit()

    return DepartmentResponse(
        id=created_department.id,
        name=created_department.name,
        description=created_department.description,
        is_active=created_department.is_active,
        created_at=created_department.created_at,
        updated_at=created_department.updated_at,
    )


def update_department_service(
    session,
    department_id: int,
    department_data: DepartmentUpdateRequest,
    actor_employee_id: int,
) -> DepartmentResponse:
    if department_data.name is None and department_data.description is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    department = get_department_by_id(session=session, department_id=department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    old_name = department.name
    old_description = department.description

    new_name = department_data.name.strip() if department_data.name is not None else department.name
    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name is required",
        )

    new_description = (
        department_data.description.strip() or None
        if department_data.description is not None
        else department.description
    )

    # No changes detected, skip the write
    if new_name == department.name and new_description == department.description:
        return DepartmentResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            is_active=department.is_active,
            created_at=department.created_at,
            updated_at=department.updated_at,
        )

    department.name = new_name
    department.description = new_description
    department.updated_at = datetime.utcnow()

    updated_department = update_department(session=session, department=department)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="department",
        target_id=updated_department.id,
        action="update",
        old_values={
            "name": old_name,
            "description": old_description,
        },
        new_values={
            "name": updated_department.name,
            "description": updated_department.description,
        },
    )
    session.commit()

    return DepartmentResponse(
        id=updated_department.id,
        name=updated_department.name,
        description=updated_department.description,
        is_active=updated_department.is_active,
        created_at=updated_department.created_at,
        updated_at=updated_department.updated_at,
    )


def delete_department_service(
    session,
    department_id: int,
    actor_employee_id: int,
) -> DepartmentResponse:
    department = get_department_by_id(session=session, department_id=department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    if has_employees_in_department(session=session, department_id=department_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Department is assigned to employees and cannot be deleted",
        )

    department.is_active = False
    department.updated_at = datetime.utcnow()

    deactivated_department = update_department(session=session, department=department)
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee_id,
        target_type="department",
        target_id=deactivated_department.id,
        action="delete",
        old_values={
            "name": deactivated_department.name,
            "description": deactivated_department.description,
            "is_active": True,
        },
        new_values={
            "name": deactivated_department.name,
            "description": deactivated_department.description,
            "is_active": deactivated_department.is_active,
        },
    )
    session.commit()

    return DepartmentResponse(
        id=deactivated_department.id,
        name=deactivated_department.name,
        description=deactivated_department.description,
        is_active=deactivated_department.is_active,
        created_at=deactivated_department.created_at,
        updated_at=deactivated_department.updated_at,
    )
