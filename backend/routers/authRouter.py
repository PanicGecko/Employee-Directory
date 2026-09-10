from fastapi import APIRouter
from dto.authDto import LoginRequest, RefreshTokenRequest
from database import SessionDep
from dto.ResponseDTO import ResponseDTO
from services.authService import login_employee, logout_employee, refresh_employee_tokens


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)



@router.post("/login")
def login(login_request: LoginRequest, session: SessionDep):
    data = login_employee(
        session=session,
        email=login_request.email,
        password=login_request.password,
    )

    return ResponseDTO(
        status_code=200,
        msg="Login successful",
        data=data,
    ).to_response()


@router.post("/refresh")
def refresh_tokens(refresh_request: RefreshTokenRequest, session: SessionDep):
    data = refresh_employee_tokens(
        session=session,
        refresh_token=refresh_request.refresh_token,
    )

    return ResponseDTO(
        status_code=200,
        msg="Tokens refreshed successfully",
        data=data,
    ).to_response()


@router.post("/logout")
def logout(logout_request: RefreshTokenRequest, session: SessionDep):
    logout_employee(
        session=session,
        refresh_token=logout_request.refresh_token,
    )

    return ResponseDTO(
        status_code=200,
        msg="Logged out successfully",
        data=None,
    ).to_response()
