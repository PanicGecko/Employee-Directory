from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from dto.skillDto import (
    AssignSkillRequest,
    EmployeeSkillResponse,
    SkillCreateRequest,
    SkillResponse,
    SkillUpdateRequest,
    UpdateSkillProficiencyRequest,
)
from models.employee import Employee
from models.skill import EmployeeSkill, Skill
from repos.employeeSkillRepo import (
    create_employee_skill,
    delete_employee_skill,
    get_employee_skill,
    get_employee_skills_with_details,
    has_employees_with_skill,
    update_employee_skill,
)
from repos.employeeRepo import get_employee_by_public_id
from repos.skillRepo import (
    create_skill,
    delete_skill,
    get_skill_by_id,
    get_skill_by_name,
    list_skills,
    search_skills_by_name,
    update_skill,
)
from services.auditService import record_audit_log


def list_skills_service(session) -> list[SkillResponse]:
    skills = list_skills(session=session)

    return [
        SkillResponse(
            id=skill.id,
            name=skill.name,
            description=skill.description,
            created_at=skill.created_at,
            updated_at=skill.updated_at,
        )
        for skill in skills
    ]


def search_skills_service(session, query: str) -> list[SkillResponse]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    skills = search_skills_by_name(session=session, query=normalized_query, limit=5)

    return [
        SkillResponse(
            id=skill.id,
            name=skill.name,
            description=skill.description,
            created_at=skill.created_at,
            updated_at=skill.updated_at,
        )
        for skill in skills
    ]


def get_employee_skills_service(session, public_id: UUID) -> list[EmployeeSkillResponse]:
    employee = get_employee_by_public_id(session=session, public_id=public_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    employee_skills = get_employee_skills_with_details(session=session, employee_id=employee.id)

    return [
        EmployeeSkillResponse(
            skill_id=skill.id,
            skill_name=skill.name,
            description=skill.description,
            proficiency=employee_skill.proficiency,
        )
        for employee_skill, skill in employee_skills
    ]


def create_skill_service(session, skill_data: SkillCreateRequest) -> SkillResponse:
    normalized_name = skill_data.name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skill name is required",
        )

    skill = Skill(
        name=normalized_name,
        description=skill_data.description.strip() if skill_data.description else None,
    )

    created_skill = create_skill(session=session, skill=skill)

    return SkillResponse(
        id=created_skill.id,
        name=created_skill.name,
        description=created_skill.description,
        created_at=created_skill.created_at,
        updated_at=created_skill.updated_at,
    )


def update_skill_service(
    session,
    skill_id: int,
    skill_data: SkillUpdateRequest,
) -> SkillResponse:
    if skill_data.name is None and skill_data.description is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    skill = get_skill_by_id(session=session, skill_id=skill_id)
    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    if skill_data.name is not None:
        new_name = skill_data.name.strip()
        if not new_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skill name is required",
            )

        skill.name = new_name

    if skill_data.description is not None:
        skill.description = skill_data.description.strip() or None

    skill.updated_at = datetime.utcnow()

    updated_skill = update_skill(session=session, skill=skill)

    return SkillResponse(
        id=updated_skill.id,
        name=updated_skill.name,
        description=updated_skill.description,
        created_at=updated_skill.created_at,
        updated_at=updated_skill.updated_at,
    )


def delete_skill_service(session, skill_id: int) -> None:
    skill = get_skill_by_id(session=session, skill_id=skill_id)
    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    if has_employees_with_skill(session=session, skill_id=skill_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill is assigned to employees and cannot be deleted",
        )

    delete_skill(session=session, skill=skill)


def assign_skill_service(session, current_employee: Employee, assign_data: AssignSkillRequest) -> dict:
    target_employee = get_employee_by_public_id(session=session, public_id=assign_data.employee_public_id)
    if target_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    is_admin = current_employee.role == "hr_admin" or getattr(current_employee.role, "value", None) == "hr_admin"
    is_manager_of_target = current_employee.id == target_employee.manager_id

    if not (is_admin or is_manager_of_target):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the employee's manager or HR Admin can assign skills",
        )

    if assign_data.skill_id is not None and assign_data.skill_name is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either skill_id or skill_name, not both",
        )

    if assign_data.skill_id is not None:
        skill = get_skill_by_id(session=session, skill_id=assign_data.skill_id)
    elif assign_data.skill_name is not None:
        normalized_skill_name = assign_data.skill_name.strip()
        if not normalized_skill_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skill name is required when skill_name is provided",
            )
        skill = get_skill_by_name(session=session, name=normalized_skill_name)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either skill_id or skill_name must be provided",
        )

    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    employee_skill = EmployeeSkill(
        employee_id=target_employee.id,
        skill_id=skill.id,
        proficiency=assign_data.proficiency,
    )

    created_assignment = create_employee_skill(session=session, employee_skill=employee_skill)
    record_audit_log(
        session=session,
        actor_employee_id=current_employee.id,
        target_type="employee_skill",
        target_id=target_employee.id,
        action="assign_skill",
        new_values={
            "employee_id": created_assignment.employee_id,
            "skill_id": created_assignment.skill_id,
            "proficiency": created_assignment.proficiency.value,
        },
    )
    session.commit()

    return {
        "employee_id": created_assignment.employee_id,
        "skill_id": created_assignment.skill_id,
        "proficiency": created_assignment.proficiency.value,
    }


def update_skill_proficiency_service(
    session,
    current_employee: Employee,
    employee_public_id: UUID,
    skill_id: int,
    update_data: UpdateSkillProficiencyRequest,
) -> dict:
    target_employee = get_employee_by_public_id(session=session, public_id=employee_public_id)
    if target_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    is_admin = current_employee.role == "hr_admin" or getattr(current_employee.role, "value", None) == "hr_admin"
    is_manager_of_target = current_employee.id == target_employee.manager_id

    if not (is_admin or is_manager_of_target):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the employee's manager or HR Admin can update skill proficiency",
        )

    employee_skill = get_employee_skill(
        session=session,
        employee_id=target_employee.id,
        skill_id=skill_id,
    )
    if employee_skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee does not have this skill assigned",
        )

    previous_proficiency = employee_skill.proficiency.value
    employee_skill.proficiency = update_data.proficiency
    updated_assignment = update_employee_skill(session=session, employee_skill=employee_skill)
    record_audit_log(
        session=session,
        actor_employee_id=current_employee.id,
        target_type="employee_skill",
        target_id=target_employee.id,
        action="update_skill_proficiency",
        old_values={
            "employee_id": updated_assignment.employee_id,
            "skill_id": updated_assignment.skill_id,
            "proficiency": previous_proficiency,
        },
        new_values={
            "employee_id": updated_assignment.employee_id,
            "skill_id": updated_assignment.skill_id,
            "proficiency": updated_assignment.proficiency.value,
        },
    )
    session.commit()

    return {
        "employee_id": updated_assignment.employee_id,
        "skill_id": updated_assignment.skill_id,
        "proficiency": updated_assignment.proficiency.value,
    }


def remove_skill_from_employee_service(
    session,
    current_employee: Employee,
    employee_public_id: UUID,
    skill_id: int,
) -> None:
    target_employee = get_employee_by_public_id(session=session, public_id=employee_public_id)
    if target_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    is_admin = current_employee.role == "hr_admin" or getattr(current_employee.role, "value", None) == "hr_admin"
    is_manager_of_target = current_employee.id == target_employee.manager_id

    if not (is_admin or is_manager_of_target):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the employee's manager or HR Admin can remove skills",
        )

    employee_skill = get_employee_skill(
        session=session,
        employee_id=target_employee.id,
        skill_id=skill_id,
    )
    if employee_skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee does not have this skill assigned",
        )

    record_audit_log(
        session=session,
        actor_employee_id=current_employee.id,
        target_type="employee_skill",
        target_id=target_employee.id,
        action="remove_skill",
        old_values={
            "employee_id": employee_skill.employee_id,
            "skill_id": employee_skill.skill_id,
            "proficiency": employee_skill.proficiency.value,
        },
    )
    delete_employee_skill(session=session, employee_skill=employee_skill)
    session.commit()
