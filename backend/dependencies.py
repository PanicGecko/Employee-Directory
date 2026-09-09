from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import SessionDep
from models.employee import Employee
from services.authService import authenticate_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_employee(
    session: SessionDep,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> Employee:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return authenticate_access_token(
        session=session,
        access_token=credentials.credentials,
    )


CurrentEmployeeDep = Annotated[Employee, Depends(get_current_employee)]


def get_hr_admin_employee(
    employee: CurrentEmployeeDep,
) -> Employee:
    if employee.role != "hr_admin" and getattr(employee.role, "value", None) != "hr_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR Admin access required",
        )

    return employee


HRAdminEmployeeDep = Annotated[Employee, Depends(get_hr_admin_employee)]


def get_manager_or_admin_employee(
    employee: CurrentEmployeeDep,
) -> Employee:
    is_admin = employee.role == "hr_admin" or getattr(employee.role, "value", None) == "hr_admin"
    is_manager = employee.role == "manager" or getattr(employee.role, "value", None) == "manager"
    
    if not (is_admin or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or Admin access required",
        )

    return employee


ManagerOrAdminEmployeeDep = Annotated[Employee, Depends(get_manager_or_admin_employee)]
