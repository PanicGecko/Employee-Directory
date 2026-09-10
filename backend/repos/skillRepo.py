from sqlalchemy import case, func
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


def search_skills_by_name(session: Session, query: str, limit: int = 5) -> list[Skill]:
    pattern = f"%{query}%"
    prefix_pattern = f"{query}%"

    # Rank prefix matches ahead of mid-string matches, then shortest/alphabetical
    relevance = case(
        (Skill.name.ilike(prefix_pattern), 0),
        else_=1,
    )

    statement = (
        select(Skill)
        .where(Skill.name.ilike(pattern))
        .order_by(relevance, func.length(Skill.name), Skill.name)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def list_skills(session: Session) -> list[Skill]:
    return list(session.exec(select(Skill).order_by(Skill.name)).all())


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


def delete_skill(session: Session, skill: Skill) -> None:
    session.delete(skill)
    session.commit()
