from sqlmodel import Session, select

from models.skill import EmployeeSkill, Skill


def get_employee_skill(session: Session, employee_id: int, skill_id: int) -> EmployeeSkill | None:
    return session.exec(
        select(EmployeeSkill).where(
            (EmployeeSkill.employee_id == employee_id)
            & (EmployeeSkill.skill_id == skill_id)
        )
    ).first()


def get_employee_skills_with_details(
    session: Session,
    employee_id: int,
) -> list[tuple[EmployeeSkill, Skill]]:
    statement = (
        select(EmployeeSkill, Skill)
        .join(Skill, EmployeeSkill.skill_id == Skill.id)
        .where(EmployeeSkill.employee_id == employee_id)
    )
    return list(session.exec(statement).all())


def has_employees_with_skill(session: Session, skill_id: int) -> bool:
    statement = (
        select(EmployeeSkill.employee_id)
        .where(EmployeeSkill.skill_id == skill_id)
        .limit(1)
    )
    return session.exec(statement).first() is not None


def create_employee_skill(session: Session, employee_skill: EmployeeSkill) -> EmployeeSkill:
    session.add(employee_skill)
    session.commit()
    session.refresh(employee_skill)
    return employee_skill


def update_employee_skill(session: Session, employee_skill: EmployeeSkill) -> EmployeeSkill:
    session.add(employee_skill)
    session.commit()
    session.refresh(employee_skill)
    return employee_skill


def delete_employee_skill(session: Session, employee_skill: EmployeeSkill) -> None:
    session.delete(employee_skill)
    session.commit()
