from sqlmodel import Session, select

from models.skill import EmployeeSkill


def get_employee_skill(session: Session, employee_id: int, skill_id: int) -> EmployeeSkill | None:
    return session.exec(
        select(EmployeeSkill).where(
            (EmployeeSkill.employee_id == employee_id)
            & (EmployeeSkill.skill_id == skill_id)
        )
    ).first()


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
