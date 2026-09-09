from datetime import datetime

from fastapi import HTTPException, status

from dto.departmentDto import DepartmentCreateRequest, DepartmentResponse, DepartmentUpdateRequest
from models.department import Department
from repos.departmentRepo import (
    create_department,
    get_department_by_id,
    update_department,
)


def create_department_service(session, department_data: DepartmentCreateRequest) -> DepartmentResponse:
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

    return DepartmentResponse(
        id=created_department.id,
        name=created_department.name,
        description=created_department.description,
        created_at=created_department.created_at,
        updated_at=created_department.updated_at,
    )


def update_department_service(
    session,
    department_id: int,
    department_data: DepartmentUpdateRequest,
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
            created_at=department.created_at,
            updated_at=department.updated_at,
        )

    department.name = new_name
    department.description = new_description
    department.updated_at = datetime.utcnow()

    updated_department = update_department(session=session, department=department)

    return DepartmentResponse(
        id=updated_department.id,
        name=updated_department.name,
        description=updated_department.description,
        created_at=updated_department.created_at,
        updated_at=updated_department.updated_at,
    )
