from uuid import UUID

from sqlmodel import Session, select

from models.employee import Employee


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


def has_direct_reports(session: Session, employee_id: int) -> bool:
    statement = (
        select(Employee.id)
        .where(Employee.manager_id == employee_id)
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


def create_employee(session: Session, employee: Employee) -> Employee:
    session.add(employee)
    session.commit()
    session.refresh(employee)
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
