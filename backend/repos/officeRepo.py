from sqlmodel import Session, select

from models.office import Office


def get_office_by_id(session: Session, office_id: int) -> Office | None:
    return session.exec(
        select(Office).where(Office.id == office_id)
    ).first()


def get_office_by_name(session: Session, name: str) -> Office | None:
    return session.exec(
        select(Office).where(Office.name == name)
    ).first()


def create_office(session: Session, office: Office) -> Office:
    session.add(office)
    session.commit()
    session.refresh(office)
    return office


def update_office(session: Session, office: Office) -> Office:
    session.add(office)
    session.commit()
    session.refresh(office)
    return office
