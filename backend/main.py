from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dto.ResponseDTO import ResponseDTO
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi.responses import JSONResponse
from database import create_db_and_tables
from routers.adminRouter import router as admin_router
from routers.auditRouter import router as audit_router
from routers.authRouter import router as auth_router
from routers.departmentRouter import router as department_router
from routers.employeeRouter import router as employee_router
from routers.officeRouter import router as office_router
from routers.skillRouter import router as skill_router
from seed_admin import seed_admin_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_admin_user()

    yield


app = FastAPI(
    title="Employee Directory API",
    lifespan=lifespan
)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):
    return ResponseDTO(
        status_code=exc.status_code,
        msg=str(exc.detail),
        data=None
    ).to_response()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return ResponseDTO(
        status_code=422,
        msg="Validation failed",
        data=exc.errors()
    ).to_response()


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(
    request: Request,
    exc: IntegrityError
):
    return ResponseDTO(
        status_code=409,
        msg="Database constraint violation",
        data=None
    ).to_response()


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    request: Request,
    exc: SQLAlchemyError
):
    print("Database error:", exc)

    return ResponseDTO(
        status_code=500,
        msg="Database error",
        data=None
    ).to_response()


@app.exception_handler(Exception)
async def unexpected_exception_handler(
    request: Request,
    exc: Exception
):
    print("Unexpected server error:", exc)

    return ResponseDTO(
        status_code=500,
        msg="Unexpected server error",
        data=None
    ).to_response()

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(admin_router)
app.include_router(department_router)
app.include_router(office_router)
app.include_router(skill_router)
app.include_router(audit_router)
