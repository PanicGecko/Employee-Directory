from sqlmodel import Session, select

from models.department import Department


def get_department_by_id(session: Session, department_id: int) -> Department | None:
    return session.exec(
        select(Department).where(Department.id == department_id)
    ).first()


def get_department_by_name(session: Session, name: str) -> Department | None:
    return session.exec(
        select(Department).where(Department.name == name)
    ).first()


def list_departments(session: Session) -> list[Department]:
    return list(session.exec(select(Department)).all())


def list_active_departments(session: Session) -> list[Department]:
    return list(
        session.exec(select(Department).where(Department.is_active == True)).all()  # noqa: E712
    )


def create_department(session: Session, department: Department) -> Department:
    session.add(department)
    session.commit()
    session.refresh(department)
    return department


def update_department(session: Session, department: Department) -> Department:
    session.add(department)
    session.commit()
    session.refresh(department)
    return department
