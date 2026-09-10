from fastapi import APIRouter, Query
from uuid import UUID

from database import SessionDep
from dependencies import CurrentEmployeeDep, HRAdminEmployeeDep, ManagerOrAdminEmployeeDep
from dto.ResponseDTO import ResponseDTO
from dto.skillDto import (
    AssignSkillRequest,
    SkillCreateRequest,
    SkillUpdateRequest,
    UpdateSkillProficiencyRequest,
)
from services.skillService import (
    assign_skill_service,
    create_skill_service,
    delete_skill_service,
    get_employee_skills_service,
    list_skills_service,
    remove_skill_from_employee_service,
    search_skills_service,
    update_skill_proficiency_service,
    update_skill_service,
)

router = APIRouter(
    prefix="/skills",
    tags=["skills"],
)


@router.get("")
def list_skills(
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    skills = list_skills_service(session=session)

    return ResponseDTO(
        status_code=200,
        msg="Skills retrieved successfully",
        data=[skill.model_dump(mode="json") for skill in skills],
    ).to_response()


@router.get("/search")
def search_skills(
    session: SessionDep,
    name: str = Query(..., min_length=1),
):
    skills = search_skills_service(session=session, query=name)

    return ResponseDTO(
        status_code=200,
        msg="Skills retrieved successfully",
        data=[skill.model_dump(mode="json") for skill in skills],
    ).to_response()


@router.get("/employee/{employee_public_id}")
def get_employee_skills(
    employee_public_id: UUID,
    session: SessionDep,
    current_employee: CurrentEmployeeDep,
):
    del current_employee
    employee_skills = get_employee_skills_service(
        session=session,
        public_id=employee_public_id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Employee skills retrieved successfully",
        data=[employee_skill.model_dump(mode="json") for employee_skill in employee_skills],
    ).to_response()


@router.post("")
def create_skill(
    skill_request: SkillCreateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    skill = create_skill_service(
        session=session,
        skill_data=skill_request,
    )

    return ResponseDTO(
        status_code=201,
        msg="Skill created successfully",
        data=skill.model_dump(mode="json"),
    ).to_response()


@router.put("/{skill_id}")
def update_skill(
    skill_id: int,
    skill_request: SkillUpdateRequest,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    skill = update_skill_service(
        session=session,
        skill_id=skill_id,
        skill_data=skill_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Skill updated successfully",
        data=skill.model_dump(mode="json"),
    ).to_response()


@router.delete("/{skill_id}")
def delete_skill(
    skill_id: int,
    session: SessionDep,
    current_admin: HRAdminEmployeeDep,
):
    del current_admin
    delete_skill_service(
        session=session,
        skill_id=skill_id,
    )

    return ResponseDTO(
        status_code=200,
        msg="Skill deleted successfully",
        data=None,
    ).to_response()


@router.post("/assign")
def assign_skill(
    assign_request: AssignSkillRequest,
    session: SessionDep,
    current_employee: ManagerOrAdminEmployeeDep,
):
    result = assign_skill_service(
        session=session,
        current_employee=current_employee,
        assign_data=assign_request,
    )

    return ResponseDTO(
        status_code=201,
        msg="Skill assigned to employee successfully",
        data=result,
    ).to_response()


@router.put("/{employee_public_id}/proficiency/{skill_id}")
def update_skill_proficiency(
    employee_public_id: UUID,
    skill_id: int,
    update_request: UpdateSkillProficiencyRequest,
    session: SessionDep,
    current_employee: ManagerOrAdminEmployeeDep,
):
    result = update_skill_proficiency_service(
        session=session,
        current_employee=current_employee,
        employee_public_id=employee_public_id,
        skill_id=skill_id,
        update_data=update_request,
    )

    return ResponseDTO(
        status_code=200,
        msg="Skill proficiency updated successfully",
        data=result,
    ).to_response()


@router.delete("/{employee_public_id}/proficiency/{skill_id}")
def remove_skill_from_employee(
    employee_public_id: UUID,
    skill_id: int,
    session: SessionDep,
    current_employee: ManagerOrAdminEmployeeDep,
):
    remove_skill_from_employee_service(
        session=session,
        current_employee=current_employee,
        employee_public_id=employee_public_id,
        skill_id=skill_id,
    )

    return ResponseDTO(
        status_code=204,
        msg="Skill removed from employee successfully",
        data=None,
    ).to_response()
