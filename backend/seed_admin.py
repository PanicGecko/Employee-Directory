import os
from datetime import datetime

from sqlmodel import Session, select

from database import engine
from models.employee import CollaborationStatus, Employee, EmployeeRole, WorkMode
from security import hash_password


def seed_admin_user() -> None:
    admin_email = os.getenv("ADMIN_EMAIL", "admin1@email.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "11111111")

    with Session(engine) as session:
        existing_admin = session.exec(
            select(Employee).where(Employee.email == admin_email)
        ).first()

        if existing_admin is not None:
            print(f"Admin user already exists: {admin_email}")
            return

        admin = Employee(
            first_name="admin1",
            last_name="admin1",
            email=admin_email,
            password_hash=hash_password(admin_password),
            role=EmployeeRole.HR_ADMIN,
            collaboration_status=CollaborationStatus.OPEN,
            work_mode=WorkMode.HYBRID,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        session.add(admin)
        session.commit()

        print(f"Created admin user: {admin_email}")