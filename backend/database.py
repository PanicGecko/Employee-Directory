import os #os is used to access our environement variables, in this case we are using it to access the DATABASE_URL variable that we set in our .env file
from typing import Annotated #this is used to create a type hint for our session dependency, which is used in our routers to access the database session. Basically a shortcut to avoid having to write the same code over and over again in our routers

from fastapi import Depends #this is going to tell fastapi that we want to use the results from another function before we run the function we are currently in. We will be using it to get our database session before running our routers
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import text
from models.employee import Employee
from models.department import Department
from models.office import Office
from models.refresh_token import RefreshToken
from models.audit_log import AuditLog
from models.skill import Skill, EmployeeSkill
#assigns our database url to DATABASE_URL using os to grab it from the environmant variables in the terminal, raises an error if not set
# DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_URL = "postgresql://root:root@localhost/directory"

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL must be set before starting the application"
    )
#an engine is just a connection manager. It will know what database to connect to, which driver to use, how to open the connections for the databse, and how to manage and reuse those connections.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

#only used if the tables dont currently exist in the database
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

#a session is a temp connection to the database, used to query records, add records, update, etc
def get_session():
    with Session(engine) as session: #creates the engine
        yield session #yield is used to return this session to the endpoint that called this function. After endpoint finishes with it the session is closes automatically by the with statement.

#assigns the session created from the get_session function to SessionDep. a shortcut to avoid a lot of code repetition
SessionDep = Annotated[Session, Depends(get_session)]
