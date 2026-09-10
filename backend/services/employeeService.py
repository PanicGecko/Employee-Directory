from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session

from dto.departmentDto import DepartmentResponse
from dto.employeeDto import (
    EmployeeAdminUpdateRequest,
    EmployeeCreateRequest,
    EmployeeHierarchyNode,
    EmployeeManagerAssignmentRequest,
    EmployeeManagerUpdateRequest,
    EmployeePaginatedResponse,
    EmployeePublicResponse,
    EmployeeSelfUpdateRequest,
)
from dto.officeDto import OfficeResponse
from dto.skillDto import EmployeeSkillResponse
from models.employee import CollaborationStatus, Employee, EmployeeRole, WorkMode
from models.skill import ProficiencyLevel
from repos.departmentRepo import get_department_by_id
from repos.employeeRepo import (
    create_employee,
    deactivate_employee_and_reassign_direct_reports,
    get_all_descendants,
    get_all_employees_for_hierarchy_with_details,
    get_direct_reports,
    get_employee_by_email,
    get_employee_by_id,
    get_employee_by_public_id,
    get_manager_chain_ids,
    has_direct_reports,
    is_employee_descendant,
    list_employees_paginated,
    update_employee,
    update_employee_active_status,
    update_employee_manager,
)
from repos.employeeSkillRepo import get_employee_skills_with_details
from repos.officeRepo import get_office_by_id
from security import hash_password
from services.auditService import build_changed_profile_audit_values, record_audit_log


def _to_public_response(employee: Employee) -> EmployeePublicResponse:
    return EmployeePublicResponse(
        public_id=employee.public_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        role=employee.role.value if hasattr(employee.role, "value") else employee.role,
        phone=employee.phone,
        street_address=employee.street_address,
        city=employee.city,
        state=employee.state,
        zip_code=employee.zip_code,
        country=employee.country,
        collaboration_status=employee.collaboration_status.value
        if hasattr(employee.collaboration_status, "value")
        else employee.collaboration_status,
        work_mode=employee.work_mode.value
        if hasattr(employee.work_mode, "value")
        else employee.work_mode,
        department_id=employee.department_id,
        manager_id=employee.manager_id,
        office_id=employee.office_id,
        is_active=employee.is_active,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


def get_employee_by_public_id_service(session, public_id: UUID) -> EmployeePublicResponse:
    employee = get_employee_by_public_id(session=session, public_id=public_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    department = get_department_by_id(session=session, department_id=employee.department_id) if employee.department_id is not None else None
    office = get_office_by_id(session=session, office_id=employee.office_id) if employee.office_id is not None else None
    employee_skills = get_employee_skills_with_details(session=session, employee_id=employee.id)

    response = _to_public_response(employee)
    response.department = (
        DepartmentResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            is_active=department.is_active,
            created_at=department.created_at,
            updated_at=department.updated_at,
        )
        if department is not None
        else None
    )
    response.office = (
        OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )
        if office is not None
        else None
    )
    response.skills = [
        EmployeeSkillResponse(
            skill_id=skill.id,
            skill_name=skill.name,
            description=skill.description,
            proficiency=employee_skill.proficiency,
        )
        for employee_skill, skill in employee_skills
    ]

    return response


def list_employees_service(
    session,
    page: int,
    page_size: int,
    search: str | None = None,
    department_id: int | None = None,
    office_id: int | None = None,
    work_mode: WorkMode | None = None,
    collaboration_status: CollaborationStatus | None = None,
    is_active: bool | None = None,
    skill_id: int | None = None,
    proficiency: ProficiencyLevel | None = None,
) -> EmployeePaginatedResponse:
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be 1 or greater",
        )

    if page_size < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page size must be 1 or greater",
        )

    normalized_search = search.strip() if search else None

    employees, total = list_employees_paginated(
        session=session,
        page=page,
        page_size=page_size,
        search=normalized_search,
        department_id=department_id,
        office_id=office_id,
        work_mode=work_mode,
        collaboration_status=collaboration_status,
        is_active=is_active,
        skill_id=skill_id,
        proficiency=proficiency,
    )

    return EmployeePaginatedResponse(
        items=[_to_public_response(employee) for employee in employees],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_employee_manager_service(session, public_id: UUID) -> EmployeePublicResponse | None:
    employee = get_employee_by_public_id(session=session, public_id=public_id)

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if employee.manager_id is None:
        return None

    manager = get_employee_by_id(session=session, employee_id=employee.manager_id)

    if manager is None:
        return None

    return _to_public_response(manager)


def get_direct_reports_service(session, public_id: UUID) -> list[EmployeePublicResponse]:
    manager = get_employee_by_public_id(session=session, public_id=public_id)

    if manager is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    direct_reports = get_direct_reports(session=session, manager_id=manager.id)

    return [_to_public_response(report) for report in direct_reports]


def get_all_descendants_service(
    session,
    public_id: UUID,
) -> list[EmployeePublicResponse]:
    manager = get_employee_by_public_id(session=session, public_id=public_id)

    if manager is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if manager.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    descendants = get_all_descendants(
        session=session,
        manager_id=manager.id,
    )

    return [_to_public_response(employee) for employee in descendants]


def _build_detailed_employee_response_from_record(
    employee: Employee,
    department,
    office,
    skills: list[dict],
) -> EmployeePublicResponse:
    response = _to_public_response(employee)
    response.department = (
        DepartmentResponse(
            id=department.id,
            name=department.name,
            description=department.description,
            is_active=department.is_active,
            created_at=department.created_at,
            updated_at=department.updated_at,
        )
        if department is not None
        else None
    )
    response.office = (
        OfficeResponse(
            id=office.id,
            name=office.name,
            street_address=office.street_address,
            city=office.city,
            state=office.state,
            zip_code=office.zip_code,
            country=office.country,
            is_active=office.is_active,
            created_at=office.created_at,
            updated_at=office.updated_at,
        )
        if office is not None
        else None
    )
    response.skills = [
        EmployeeSkillResponse(
            skill_id=skill["skill_id"],
            skill_name=skill["skill_name"],
            description=skill["description"],
            proficiency=skill["proficiency"],
        )
        for skill in skills
    ]
    return response


def get_full_hierarchy_service(session: Session) -> list[EmployeeHierarchyNode]:
    employee_records = get_all_employees_for_hierarchy_with_details(session)
    employees_by_id: dict[int, dict] = {}

    for employee_record in employee_records:
        employee = employee_record["employee"]
        if employee.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Employee record is invalid",
            )
        employees_by_id[employee.id] = employee_record

    children_by_manager_id: dict[int, list[int]] = {}
    root_ids: list[int] = []

    for employee_id, employee_record in employees_by_id.items():
        employee = employee_record["employee"]
        manager_id = employee.manager_id

        if (
            manager_id is None
            or manager_id not in employees_by_id
            or manager_id == employee_id
        ):
            root_ids.append(employee_id)
            continue

        children_by_manager_id.setdefault(manager_id, []).append(employee_id)

    visited: set[int] = set()

    def build_node(
        employee_id: int,
        ancestor_ids: set[int],
    ) -> EmployeeHierarchyNode | None:
        if employee_id in visited or employee_id in ancestor_ids:
            return None

        visited.add(employee_id)
        next_ancestor_ids = ancestor_ids | {employee_id}
        direct_reports: list[EmployeeHierarchyNode] = []

        for child_id in children_by_manager_id.get(employee_id, []):
            child_node = build_node(child_id, next_ancestor_ids)
            if child_node is not None:
                direct_reports.append(child_node)

        employee_record = employees_by_id[employee_id]
        return EmployeeHierarchyNode(
            employee=_build_detailed_employee_response_from_record(
                employee=employee_record["employee"],
                department=employee_record["department"],
                office=employee_record["office"],
                skills=employee_record["skills"],
            ),
            direct_reports=direct_reports,
        )

    hierarchy: list[EmployeeHierarchyNode] = []

    for root_id in root_ids:
        root_node = build_node(root_id, set())
        if root_node is not None:
            hierarchy.append(root_node)

    for employee_id in employees_by_id:
        if employee_id not in visited:
            remaining_node = build_node(employee_id, set())
            if remaining_node is not None:
                hierarchy.append(remaining_node)

    return hierarchy


def _get_valid_manager_for_assignment(
    session: Session,
    employee: Employee,
    manager_public_id: UUID,
) -> Employee:
    manager = get_employee_by_public_id(
        session=session,
        public_id=manager_public_id,
    )
    if manager is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found",
        )

    if employee.id is None or manager.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    if employee.id == manager.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee cannot be assigned as their own manager",
        )

    manager_role = (
        manager.role.value
        if hasattr(manager.role, "value")
        else manager.role
    )
    if manager_role != EmployeeRole.MANAGER.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected employee does not have the manager role",
        )

    if not manager.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected manager is not active",
        )

    if employee.manager_id != manager.id:
        manager_chain_ids = get_manager_chain_ids(
            session=session,
            employee_id=manager.id,
        )
        if employee.id in manager_chain_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manager assignment would create a reporting cycle",
            )

    return manager


def assign_employee_manager_service(
    session: Session,
    employee_public_id: UUID,
    manager_data: EmployeeManagerAssignmentRequest,
) -> EmployeePublicResponse:
    employee = get_employee_by_public_id(
        session=session,
        public_id=employee_public_id,
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    manager = _get_valid_manager_for_assignment(
        session=session,
        employee=employee,
        manager_public_id=manager_data.manager_public_id,
    )
    if employee.manager_id == manager.id:
        return _to_public_response(employee)

    employee.manager_id = manager.id
    employee.updated_at = datetime.utcnow()
    updated_employee = update_employee_manager(
        session=session,
        employee=employee,
    )
    return _to_public_response(updated_employee)


def _prepare_profile_updates(
    employee_data: EmployeeSelfUpdateRequest,
) -> dict[str, Any]:
    updates = employee_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one profile field must be provided",
        )

    nullable_text_fields = {
        "phone",
        "street_address",
        "city",
        "state",
        "zip_code",
        "country",
    }
    for field_name in nullable_text_fields & updates.keys():
        value = updates[field_name]
        if value is not None:
            updates[field_name] = value.strip() or None

    required_fields = {"collaboration_status", "work_mode"}
    if any(updates.get(field_name) is None for field_name in required_fields & updates.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collaboration status and work mode cannot be null",
        )

    return updates


def _update_employee_profile(
    session: Session,
    employee: Employee,
    updates: dict[str, Any],
    actor_employee_id: int | None = None,
) -> EmployeePublicResponse:
    safe_profile_fields = {
        "phone",
        "street_address",
        "city",
        "state",
        "zip_code",
        "country",
        "collaboration_status",
        "work_mode",
    }
    old_values, new_values = build_changed_profile_audit_values(
        original_employee=employee,
        updated_values=updates,
        safe_fields=safe_profile_fields,
    )

    changed = False
    for field_name, value in updates.items():
        if getattr(employee, field_name) != value:
            setattr(employee, field_name, value)
            changed = True

    if not changed:
        return _to_public_response(employee)

    employee.updated_at = datetime.utcnow()
    updated_employee = update_employee(
        session=session,
        employee=employee,
    )

    if actor_employee_id is not None and (old_values or new_values):
        record_audit_log(
            session=session,
            actor_employee_id=actor_employee_id,
            target_type="employee",
            target_id=updated_employee.id,
            action="update_profile",
            old_values=old_values or None,
            new_values=new_values or None,
        )
        session.commit()

    return _to_public_response(updated_employee)


def update_own_profile_service(
    session: Session,
    current_employee: Employee,
    employee_data: EmployeeSelfUpdateRequest,
) -> EmployeePublicResponse:
    if current_employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    updates = _prepare_profile_updates(employee_data)
    return _update_employee_profile(
        session=session,
        employee=current_employee,
        updates=updates,
        actor_employee_id=current_employee.id,
    )


def update_subordinate_profile_service(
    session: Session,
    current_employee: Employee,
    employee_public_id: UUID,
    employee_data: EmployeeManagerUpdateRequest,
) -> EmployeePublicResponse:
    current_role = (
        current_employee.role.value
        if hasattr(current_employee.role, "value")
        else current_employee.role
    )
    if current_role != EmployeeRole.MANAGER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )

    if current_employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    target_employee = get_employee_by_public_id(
        session=session,
        public_id=employee_public_id,
    )
    if target_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if target_employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    if not is_employee_descendant(
        session=session,
        manager_id=current_employee.id,
        employee_id=target_employee.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee is not in manager's reporting hierarchy",
        )

    updates = _prepare_profile_updates(employee_data)
    return _update_employee_profile(
        session=session,
        employee=target_employee,
        updates=updates,
        actor_employee_id=current_employee.id,
    )


def update_employee_as_admin_service(
    session: Session,
    employee_public_id: UUID,
    employee_data: EmployeeAdminUpdateRequest,
    actor_employee: Employee,
) -> EmployeePublicResponse:
    employee = get_employee_by_public_id(
        session=session,
        public_id=employee_public_id,
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    updates = _prepare_profile_updates(employee_data)

    required_fields = {"first_name", "last_name", "email", "role"}
    if any(updates.get(field_name) is None for field_name in required_fields & updates.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="First name, last name, email, and role cannot be null",
        )

    for field_name in {"first_name", "last_name"} & updates.keys():
        normalized_value = updates[field_name].strip()
        if not normalized_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee name fields cannot be empty",
            )
        updates[field_name] = normalized_value

    if "email" in updates:
        normalized_email = str(updates["email"]).strip().lower()
        existing_employee = get_employee_by_email(
            session=session,
            email=normalized_email,
        )
        if existing_employee is not None and existing_employee.id != employee.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee email already exists",
            )
        updates["email"] = normalized_email

    if "department_id" in updates and updates["department_id"] is not None:
        if get_department_by_id(session, updates["department_id"]) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

    if "office_id" in updates and updates["office_id"] is not None:
        if get_office_by_id(session, updates["office_id"]) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Office not found",
            )

    original_role = (
        employee.role.value
        if hasattr(employee.role, "value")
        else employee.role
    )
    role_change_values = None
    manager_change_values = None
    if "role" in updates:
        role_value = (
            updates["role"].value
            if hasattr(updates["role"], "value")
            else updates["role"]
        )
        current_role = (
            employee.role.value
            if hasattr(employee.role, "value")
            else employee.role
        )
        if (
            role_value != current_role
            and role_value != EmployeeRole.MANAGER.value
            and has_direct_reports(
                session=session,
                employee_id=employee.id,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee with direct reports must have the manager role",
            )

        if role_value != current_role:
            role_change_values = {
                "old_values": {"role": current_role},
                "new_values": {"role": role_value},
            }

    if "manager_public_id" in updates:
        existing_manager_id = employee.manager_id
        manager_public_id = updates.pop("manager_public_id")
        if manager_public_id is None:
            new_manager_id = None
            updates["manager_id"] = None
        else:
            manager = _get_valid_manager_for_assignment(
                session=session,
                employee=employee,
                manager_public_id=manager_public_id,
            )
            new_manager_id = manager.id
            updates["manager_id"] = manager.id

        if existing_manager_id != new_manager_id:
            manager_change_values = {
                "old_values": {"manager_id": existing_manager_id},
                "new_values": {"manager_id": new_manager_id},
            }

    updated_employee = _update_employee_profile(
        session=session,
        employee=employee,
        updates=updates,
        actor_employee_id=actor_employee.id,
    )

    if role_change_values is not None:
        record_audit_log(
            session=session,
            actor_employee_id=actor_employee.id,
            target_type="employee",
            target_id=employee.id,
            action="update_role",
            old_values=role_change_values["old_values"],
            new_values=role_change_values["new_values"],
        )

    if manager_change_values is not None:
        record_audit_log(
            session=session,
            actor_employee_id=actor_employee.id,
            target_type="employee",
            target_id=employee.id,
            action="update_manager",
            old_values=manager_change_values["old_values"],
            new_values=manager_change_values["new_values"],
        )

    if role_change_values is not None or manager_change_values is not None:
        session.commit()

    return updated_employee


def activate_employee_service(
    session: Session,
    employee_public_id: UUID,
) -> EmployeePublicResponse:
    employee = get_employee_by_public_id(
        session=session,
        public_id=employee_public_id,
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    if employee.is_active:
        return _to_public_response(employee)

    employee.is_active = True
    employee.updated_at = datetime.utcnow()
    activated_employee = update_employee_active_status(
        session=session,
        employee=employee,
    )
    return _to_public_response(activated_employee)


def deactivate_employee_service(
    session: Session,
    employee_public_id: UUID,
) -> EmployeePublicResponse:
    employee = get_employee_by_public_id(
        session=session,
        public_id=employee_public_id,
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    if not employee.is_active:
        return _to_public_response(employee)

    updated_at = datetime.utcnow()
    employee.is_active = False
    employee.updated_at = updated_at

    employee_role = (
        employee.role.value
        if hasattr(employee.role, "value")
        else employee.role
    )
    if employee_role == EmployeeRole.MANAGER.value:
        deactivated_employee = deactivate_employee_and_reassign_direct_reports(
            session=session,
            employee=employee,
            replacement_manager_id=employee.manager_id,
            updated_at=updated_at,
        )
    else:
        deactivated_employee = update_employee_active_status(
            session=session,
            employee=employee,
        )

    return _to_public_response(deactivated_employee)


def _validate_manager_id_for_creation(
    session: Session,
    manager_id: int,
) -> Employee:
    manager = get_employee_by_id(session=session, employee_id=manager_id)
    if manager is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager not found",
        )

    manager_role = (
        manager.role.value
        if hasattr(manager.role, "value")
        else manager.role
    )
    if manager_role != EmployeeRole.MANAGER.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected employee does not have the manager role",
        )

    if not manager.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected manager is not active",
        )

    return manager


def create_employee_service(
    session: Session,
    employee_data: EmployeeCreateRequest,
    actor_employee: Employee,
) -> EmployeePublicResponse:
    if actor_employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    normalized_email = employee_data.email.strip().lower()

    if get_employee_by_email(session=session, email=normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee email already exists",
        )

    if employee_data.manager_id is not None:
        # Self-assignment is structurally impossible here: manager_id must reference an
        # existing employee, and the new employee gets a fresh, distinct auto-increment id.
        _validate_manager_id_for_creation(
            session=session,
            manager_id=employee_data.manager_id,
        )

    employee = Employee(
        first_name=employee_data.first_name.strip(),
        last_name=employee_data.last_name.strip(),
        email=normalized_email,
        password_hash=hash_password(employee_data.password),
        role=employee_data.role,
        phone=employee_data.phone,
        street_address=employee_data.street_address,
        city=employee_data.city,
        state=employee_data.state,
        zip_code=employee_data.zip_code,
        country=employee_data.country,
        collaboration_status=employee_data.collaboration_status,
        work_mode=employee_data.work_mode,
        department_id=employee_data.department_id,
        manager_id=employee_data.manager_id,
        office_id=employee_data.office_id,
        is_active=employee_data.is_active,
    )

    created_employee = create_employee(session=session, employee=employee)
    if created_employee.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Employee record is invalid",
        )

    role = (
        created_employee.role.value
        if hasattr(created_employee.role, "value")
        else created_employee.role
    )
    collaboration_status = (
        created_employee.collaboration_status.value
        if hasattr(created_employee.collaboration_status, "value")
        else created_employee.collaboration_status
    )
    work_mode = (
        created_employee.work_mode.value
        if hasattr(created_employee.work_mode, "value")
        else created_employee.work_mode
    )
    record_audit_log(
        session=session,
        actor_employee_id=actor_employee.id,
        target_type="employee",
        target_id=created_employee.id,
        action="create",
        new_values={
            "public_id": str(created_employee.public_id),
            "first_name": created_employee.first_name,
            "last_name": created_employee.last_name,
            "email": created_employee.email,
            "role": role,
            "phone": created_employee.phone,
            "street_address": created_employee.street_address,
            "city": created_employee.city,
            "state": created_employee.state,
            "zip_code": created_employee.zip_code,
            "country": created_employee.country,
            "collaboration_status": collaboration_status,
            "work_mode": work_mode,
            "department_id": created_employee.department_id,
            "manager_id": created_employee.manager_id,
            "office_id": created_employee.office_id,
            "is_active": created_employee.is_active,
        },
    )
    session.commit()
    session.refresh(created_employee)
    return _to_public_response(created_employee)
