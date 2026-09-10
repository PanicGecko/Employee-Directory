from datetime import datetime
from uuid import UUID

from sqlalchemy import func, update
from sqlmodel import Session, select

from models.department import Department
from models.employee import CollaborationStatus, Employee, WorkMode
from models.office import Office
from models.skill import EmployeeSkill, ProficiencyLevel, Skill


def _build_descendant_ids(manager_id: int):
    descendant_ids = (
        select(Employee.id)
        .where(Employee.manager_id == manager_id)
        .cte(name="employee_descendants", recursive=True)
    )
    return descendant_ids.union(
        select(Employee.id).join(
            descendant_ids,
            Employee.manager_id == descendant_ids.c.id,
        )
    )


def get_employee_by_email(session: Session, email: str) -> Employee | None:
    return session.exec(
        select(Employee).where(Employee.email == email)
    ).first()


def get_employee_by_id(session: Session, employee_id: int) -> Employee | None:
    return session.exec(
        select(Employee).where(Employee.id == employee_id)
    ).first()


def get_employee_by_public_id(session: Session, public_id: UUID) -> Employee | None:
    return session.exec(
        select(Employee).where(Employee.public_id == public_id)
    ).first()


def get_direct_reports(session: Session, manager_id: int) -> list[Employee]:
    return session.exec(
        select(Employee).where(Employee.manager_id == manager_id)
    ).all()


def list_employees_paginated(
    session: Session,
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
) -> tuple[list[Employee], int]:
    def _apply_filters(statement):
        if search:
            pattern = f"%{search}%"
            statement = statement.where(
                Employee.first_name.ilike(pattern)
                | Employee.last_name.ilike(pattern)
                | Employee.email.ilike(pattern)
            )
        if department_id is not None:
            statement = statement.where(Employee.department_id == department_id)
        if office_id is not None:
            statement = statement.where(Employee.office_id == office_id)
        if work_mode is not None:
            statement = statement.where(Employee.work_mode == work_mode)
        if collaboration_status is not None:
            statement = statement.where(Employee.collaboration_status == collaboration_status)
        if is_active is not None:
            statement = statement.where(Employee.is_active == is_active)
        if skill_id is not None or proficiency is not None:
            skill_filter = []
            if skill_id is not None:
                skill_filter.append(EmployeeSkill.skill_id == skill_id)
            if proficiency is not None:
                skill_filter.append(EmployeeSkill.proficiency == proficiency)
            statement = statement.join(
                EmployeeSkill, EmployeeSkill.employee_id == Employee.id
            ).where(*skill_filter)
        return statement

    base_statement = _apply_filters(select(Employee))
    # proficiency alone can match multiple skills per employee, so dedupe
    if skill_id is not None or proficiency is not None:
        base_statement = base_statement.distinct()
        count_statement = _apply_filters(
            select(func.count(func.distinct(Employee.id))).select_from(Employee)
        )
    else:
        count_statement = _apply_filters(select(func.count()).select_from(Employee))

    total = session.exec(count_statement).one()

    employees = session.exec(
        base_statement
        .order_by(Employee.last_name, Employee.first_name, Employee.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(employees), total


def has_direct_reports(session: Session, employee_id: int) -> bool:
    statement = (
        select(Employee.id)
        .where(Employee.manager_id == employee_id)
        .limit(1)
    )
    return session.exec(statement).first() is not None


def has_employees_in_department(session: Session, department_id: int) -> bool:
    statement = (
        select(Employee.id)
        .where(Employee.department_id == department_id)
        .limit(1)
    )
    return session.exec(statement).first() is not None


def has_employees_in_office(session: Session, office_id: int) -> bool:
    statement = (
        select(Employee.id)
        .where(Employee.office_id == office_id)
        .limit(1)
    )
    return session.exec(statement).first() is not None


def get_all_descendants(session: Session, manager_id: int) -> list[Employee]:
    descendant_ids = _build_descendant_ids(manager_id)

    statement = (
        select(Employee)
        .join(descendant_ids, Employee.id == descendant_ids.c.id)
        .where(Employee.id != manager_id)
        .order_by(Employee.last_name, Employee.first_name, Employee.id)
    )
    return list(session.exec(statement).all())


def is_employee_descendant(
    session: Session,
    manager_id: int,
    employee_id: int,
) -> bool:
    descendant_ids = _build_descendant_ids(manager_id)
    statement = (
        select(descendant_ids.c.id)
        .where(
            descendant_ids.c.id == employee_id,
            descendant_ids.c.id != manager_id,
        )
        .limit(1)
    )
    return session.exec(statement).first() is not None


def get_manager_chain_ids(session: Session, employee_id: int) -> list[int]:
    manager_chain = (
        select(Employee.id, Employee.manager_id)
        .where(Employee.id == employee_id)
        .cte(name="employee_manager_chain", recursive=True)
    )
    manager_chain = manager_chain.union(
        select(Employee.id, Employee.manager_id).join(
            manager_chain,
            Employee.id == manager_chain.c.manager_id,
        )
    )

    statement = select(manager_chain.c.id)
    return list(session.exec(statement).all())


def get_all_employees_for_hierarchy(session: Session) -> list[Employee]:
    statement = select(Employee).order_by(
        Employee.last_name,
        Employee.first_name,
        Employee.id,
    )
    return list(session.exec(statement).all())


def get_all_employees_for_hierarchy_with_details(session: Session) -> list[dict]:
    statement = (
        select(
            Employee,
            Department,
            Office,
            EmployeeSkill,
            Skill,
        )
        .outerjoin(Department, Employee.department_id == Department.id)
        .outerjoin(Office, Employee.office_id == Office.id)
        .outerjoin(EmployeeSkill, EmployeeSkill.employee_id == Employee.id)
        .outerjoin(Skill, Skill.id == EmployeeSkill.skill_id)
        .order_by(
            Employee.last_name,
            Employee.first_name,
            Employee.id,
        )
    )

    rows = session.exec(statement).all()
    employees_by_id: dict[int, dict] = {}

    for employee, department, office, employee_skill, skill in rows:
        employee_record = employees_by_id.setdefault(
            employee.id,
            {
                "employee": employee,
                "department": department,
                "office": office,
                "skills": [],
            },
        )

        if employee_skill is not None and skill is not None:
            employee_record["skills"].append(
                {
                    "employee_id": employee_skill.employee_id,
                    "skill_id": skill.id,
                    "skill_name": skill.name,
                    "description": skill.description,
                    "proficiency": employee_skill.proficiency,
                }
            )

    return list(employees_by_id.values())


def create_employee(session: Session, employee: Employee) -> Employee:
    session.add(employee)
    session.flush()
    return employee


def update_employee_manager(session: Session, employee: Employee) -> Employee:
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


def update_employee(session: Session, employee: Employee) -> Employee:
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


def update_employee_active_status(
    session: Session,
    employee: Employee,
) -> Employee:
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee


def deactivate_employee_and_reassign_direct_reports(
    session: Session,
    employee: Employee,
    replacement_manager_id: int | None,
    updated_at: datetime,
) -> Employee:
    session.execute(
        update(Employee)
        .where(Employee.manager_id == employee.id)
        .values(
            manager_id=replacement_manager_id,
            updated_at=updated_at,
        )
    )
    session.add(employee)
    session.commit()
    session.refresh(employee)
    return employee
