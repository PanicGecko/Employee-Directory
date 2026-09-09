from sqlmodel import Session, select

from models.skill import Skill


def get_skill_by_id(session: Session, skill_id: int) -> Skill | None:
    return session.exec(
        select(Skill).where(Skill.id == skill_id)
    ).first()


def get_skill_by_name(session: Session, name: str) -> Skill | None:
    return session.exec(
        select(Skill).where(Skill.name == name)
    ).first()


def create_skill(session: Session, skill: Skill) -> Skill:
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill


def update_skill(session: Session, skill: Skill) -> Skill:
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill
