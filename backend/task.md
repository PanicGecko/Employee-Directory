# Employee Directory Backend Tasks

Use this file as a slow implementation queue. Each task should produce one small, reviewable functionality. Finish the verification step before starting the next task.

Rules:

- Implement one task at a time.
- Keep each task as a vertical slice when possible: router -> service -> repository -> database.
- Do not mix unrelated features in the same task.
- Do not redesign the schema while implementing a task.
- Use `backend/scheme.md` as the schema reference.
- Use `backend/memory.md` for project rules.
- Return API responses using `ResponseDTO`.
- Raise `HTTPException` for expected API errors and let global handlers format the response.
- Do not create `manager`, `admin`, or `team` tables.
- Use internal integer IDs for database relationships.
- Use `employees.public_id` for API-facing employee identifiers.

## Task 001 - Clean Application Startup

Status: completed

Goal: Make the FastAPI app import cleanly with only existing Employee Directory routers.

Files:

- `backend/main.py`
- `backend/routers/authRouter.py`

Implement:

- Remove stale imports for routers that do not exist.
- Keep the existing global exception handlers.
- Register only routers that exist.
- Do not add new business routes in this task.

Verify:

- Run `python -m py_compile backend/main.py`.
- Import `app` from `backend/main.py`.
- Confirm OpenAPI can be generated.

## Task 002 - Clean Database Startup

Status: pending

Goal: Make database setup match the Employee Directory project.

Files:

- `backend/database.py`

Implement:

- Remove stale database alteration code for unrelated tables.
- Keep one SQLModel engine.
- Keep one session dependency.
- Keep `DATABASE_URL` as the required database setting.
- Do not add migrations in this task.

Verify:

- Run `python -m py_compile backend/database.py`.
- Import `SessionDep`.
- Import `create_db_and_tables`.

## Task 003 - Register SQLModel Metadata

Status: pending

Goal: Ensure SQLModel metadata can see every table model.

Files:

- `backend/database.py`
- `backend/models/*.py`

Implement:

- Import model modules where needed before `SQLModel.metadata.create_all`.
- Include `employees`, `departments`, `offices`, `skills`, `employee_skills`, `refresh_tokens`, and `audit_logs`.
- Do not change model fields unless metadata registration requires it.

Verify:

- Print sorted metadata table names in a local import check.
- Confirm every table from `scheme.md` appears.

## Task 004 - Verify Employee Model

Status: pending

Goal: Make the employee table model match `scheme.md`.

Files:

- `backend/models/employee.py`

Implement:

- Verify fields, enum values, nullable fields, unique fields, indexes, and foreign keys.
- Add manager/direct-report relationships only if needed for later hierarchy functionality.
- Do not add routes or services.

Verify:

- Run `python -m py_compile backend/models/employee.py`.
- Compare the model fields against the `employees` section in `scheme.md`.

## Task 005 - Verify Department Model

Status: pending

Goal: Make the department table model match `scheme.md`.

Files:

- `backend/models/department.py`

Implement:

- Verify `id`, `name`, `description`, `created_at`, and `updated_at`.
- Ensure `name` is unique and non-null.
- Do not add department endpoints.

Verify:

- Run `python -m py_compile backend/models/department.py`.
- Compare the model fields against the `departments` section in `scheme.md`.

## Task 006 - Verify Office Model

Status: pending

Goal: Make the office table model match `scheme.md`.

Files:

- `backend/models/office.py`

Implement:

- Verify address fields and nullable rules.
- Ensure `name` is unique and non-null.
- Do not add office endpoints.

Verify:

- Run `python -m py_compile backend/models/office.py`.
- Compare the model fields against the `offices` section in `scheme.md`.

## Task 007 - Verify Skill And EmployeeSkill Models

Status: pending

Goal: Make skill and employee-skill table models match `scheme.md`.

Files:

- `backend/models/skill.py`

Implement:

- Verify `Skill` fields.
- Verify `EmployeeSkill.employee_id` references `employees.id`.
- Verify `EmployeeSkill.skill_id` references `skills.id`.
- Verify `EmployeeSkill.proficiency` exists.
- Keep `(employee_id, skill_id)` as the primary key.
- Do not add an `id` field to `employee_skills`.

Verify:

- Run `python -m py_compile backend/models/skill.py`.
- Compare both models against `scheme.md`.

## Task 008 - Verify RefreshToken Model

Status: pending

Goal: Make the refresh-token table model match `scheme.md`.

Files:

- `backend/models/refresh_token.py`

Implement:

- Verify `id`.
- Verify `employee_id -> employees.id`.
- Verify unique non-null `token_hash`.
- Verify non-null `expires_at`.
- Do not store raw refresh tokens.

Verify:

- Run `python -m py_compile backend/models/refresh_token.py`.
- Compare the model against the `refresh_tokens` section in `scheme.md`.

## Task 009 - Verify AuditLog Model

Status: pending

Goal: Make the audit-log table model match `scheme.md`.

Files:

- `backend/models/audit_log.py`

Implement:

- Verify `actor_employee_id -> employees.id`.
- Verify `target_type`, `target_id`, `action`, `old_values`, `new_values`, and `created_at`.
- Keep `target_id` as an internal ID value, not a direct foreign key.
- Do not add audit routes.

Verify:

- Run `python -m py_compile backend/models/audit_log.py`.
- Compare the model against the `audit_logs` section in `scheme.md`.

## Task 010 - Create Shared Auth Schemas

Status: completed

Goal: Move auth request/response shapes out of the router.

Files:

- `backend/dto/authDTO.py`
- `backend/routers/authRouter.py`

Implement:

- Create `LoginRequest`.
- Create a token response data schema if useful.
- Keep plaintext password only in request input.
- Do not include password hashes.
- Do not include refresh-token hashes.

Verify:

- Run `python -m py_compile backend/dto/authDTO.py backend/routers/authRouter.py`.
- Confirm `/auth/login` request body still appears in OpenAPI.

## Task 011 - Login With Access And Refresh Tokens

Status: implemented, verify before extending

Goal: Authenticate an employee and create one saved refresh-token record.

Files:

- `backend/routers/authRouter.py`
- `backend/services/authService.py`
- `backend/repos/authRepo.py`
- `backend/security.py`
- `backend/jwtToken.py`
- `backend/models/refresh_token.py`
- `backend/main.py`

Implement:

- Router accepts email and password.
- Router calls service.
- Router returns success using `ResponseDTO`.
- Service looks up employee by email through repository.
- Service verifies password through `security.py`.
- Service rejects invalid credentials with `HTTPException(401)`.
- Service rejects inactive employees with `HTTPException(403)`.
- Service creates an access token using existing JWT helper.
- Service creates a refresh token using existing JWT helper.
- Service hashes the refresh token through `security.py`.
- Repository saves the refresh-token hash.
- Raw refresh token is returned to the client once.
- Raw refresh token is not stored.

Verify:

- Run `python -m py_compile` on changed files.
- Confirm `POST /auth/login` appears in OpenAPI.
- Create a test employee with a hashed password.
- Call login with the correct password.
- Confirm response uses `ResponseDTO`.
- Confirm database has one `refresh_tokens` row.
- Confirm saved `token_hash` is not equal to the raw refresh token.

## Task 012 - Refresh Access Token

Status: completed

Goal: Exchange a valid refresh token for a new access token and rotated refresh token.

Files:

- `backend/routers/authRouter.py`
- `backend/services/authService.py`
- `backend/repos/authRepo.py`
- `backend/security.py`
- `backend/jwtToken.py`

Implement:

- Router accepts a refresh token.
- Service decodes the refresh token.
- Service verifies token type is `refresh`.
- Service hashes submitted refresh token.
- Repository looks up matching stored token hash.
- Service rejects missing token record with `HTTPException(401)`.
- Service rejects expired token record with `HTTPException(401)`.
- Service deletes the old refresh-token record.
- Service creates a new access token.
- Service creates a new refresh token.
- Service stores only the new refresh-token hash.
- Router returns the new tokens with `ResponseDTO`.

Verify:

- Login once.
- Call refresh with the returned refresh token.
- Confirm a new access token is returned.
- Confirm a new refresh token is returned.
- Confirm the old refresh-token hash was deleted.
- Confirm reusing the old refresh token fails.

## Task 013 - Logout Current Session

Status: pending

Goal: Invalidate one refresh token.

Files:

- `backend/routers/authRouter.py`
- `backend/services/authService.py`
- `backend/repos/authRepo.py`
- `backend/security.py`

Implement:

- Router accepts a refresh token.
- Service hashes the submitted refresh token.
- Repository deletes matching refresh-token row.
- Return success through `ResponseDTO`.
- Do not reveal whether a specific token existed.

Verify:

- Login once.
- Confirm one refresh-token row exists.
- Logout with that refresh token.
- Confirm the row is removed.
- Confirm calling refresh with that token fails.

## Task 014 - Current Authenticated Employee Dependency

Status: completed

Goal: Load the current employee from an access token.

Files:

- `backend/jwtToken.py`
- `backend/repos/authRepo.py`
- `backend/services/authService.py` or `backend/dependencies.py`

Implement:

- Decode bearer access token.
- Reject non-access tokens.
- Read subject from token.
- Load employee by `public_id` or another documented subject convention.
- Reject missing employee.
- Reject inactive employee.
- Return the authenticated employee.

Verify:

- Use a valid access token and confirm the employee loads.
- Use a refresh token and confirm it is rejected.
- Use an expired token and confirm it is rejected.
- Use an inactive employee and confirm it is rejected.

## Task 015 - HR Admin Dependency

Status: completed

Goal: Create one reusable guard for HR Admin-only endpoints.

Files:

- `backend/dependencies.py` or existing dependency module
- `backend/models/employee.py`

Implement:

- Reuse current authenticated employee dependency.
- Check `role == hr_admin`.
- Raise `HTTPException(403)` for non-admin users.
- Do not duplicate this check in every router.

Verify:

- HR Admin passes.
- Manager fails.
- Employee fails.

## Task 016 - Employee Detail By Public ID

Status: pending

Goal: Return one employee profile by public UUID.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`
- employee response DTO module

Implement:

- Router accepts `public_id`.
- Router requires authentication.
- Service calls repository.
- Repository queries `Employee.public_id`.
- Service raises `HTTPException(404)` if missing.
- Response excludes `password_hash`.
- Response uses `ResponseDTO`.

Verify:

- Request existing employee by `public_id`.
- Confirm employee is returned.
- Request missing `public_id`.
- Confirm 404 response uses global handler format.
- Confirm `password_hash` is absent.

## Task 017 - List Employees With Pagination

Status: pending

Goal: Return a paginated employee directory list.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router accepts `page` and `page_size`.
- Router requires authentication.
- Repository applies limit and offset.
- Repository returns total count.
- Response uses public IDs.
- Response excludes password hashes.

Verify:

- Seed more employees than one page.
- Confirm page 1 returns expected count.
- Confirm page 2 returns different rows.
- Confirm total count is included.

## Task 018 - Employee Text Search

Status: pending

Goal: Search employees by name or email.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add optional text query parameter.
- Match first name.
- Match last name.
- Match email.
- Combine with existing pagination.
- Do not add department/office filters in this task.

Verify:

- Search by first name.
- Search by last name.
- Search by email.
- Search with no matches.
- Confirm pagination still works.

## Task 019 - Employee Department Filter

Status: pending

Goal: Filter employees by department.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add optional department filter.
- Use internal `department_id` in the repository.
- Keep API input as either documented department ID or future department public identifier.
- Combine with pagination.

Verify:

- Seed employees in two departments.
- Filter by one department.
- Confirm only matching employees return.
- Confirm pagination still works.

## Task 020 - Employee Office Filter

Status: pending

Goal: Filter employees by office.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add optional office filter.
- Use internal `office_id` in repository joins/filters.
- Support employees with `office_id = null` separately later if needed.
- Combine with pagination.

Verify:

- Seed employees in two offices.
- Filter by one office.
- Confirm only matching employees return.

## Task 021 - Employee Work Mode Filter

Status: pending

Goal: Filter employees by work mode.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add optional `work_mode` filter.
- Validate against enum values.
- Combine with pagination.

Verify:

- Filter remote employees.
- Filter hybrid employees.
- Filter in-office employees.
- Confirm invalid enum value returns validation error.

## Task 022 - Employee Collaboration Status Filter

Status: pending

Goal: Filter employees by collaboration status.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add optional `collaboration_status` filter.
- Validate against enum values.
- Combine with pagination.

Verify:

- Filter open employees.
- Filter busy employees.
- Filter unavailable employees.
- Confirm invalid enum value returns validation error.

## Task 023 - Employee Skill Filter

Status: pending

Goal: Find employees with a specific skill.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`
- `backend/repos/employeeSkillRepo.py`

Implement:

- Join through `employee_skills`.
- Filter by skill.
- Keep proficiency out of this task.
- Combine with pagination.

Verify:

- Seed employees with different skills.
- Search for Python.
- Confirm only Python employees return.
- Confirm employees without Python are excluded.

## Task 024 - Employee Skill And Proficiency Filter

Status: pending

Goal: Find employees with a skill at a required proficiency.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`
- `backend/repos/employeeSkillRepo.py`

Implement:

- Add proficiency filter.
- Keep proficiency on `employee_skills`.
- Support exact proficiency first.
- Add minimum proficiency only after exact proficiency works.

Verify:

- Search Python expert.
- Confirm Python beginner is excluded.
- Search AWS advanced.
- Confirm non-AWS experts are excluded.

## Task 025 - Get Employee Manager

Status: done

Goal: Return one employee's manager.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router accepts employee `public_id`.
- Service loads employee.
- Repository loads manager by `manager_id`.
- Return `null` or safe empty data if no manager.
- Response excludes password hash.

Verify:

- Employee with manager returns manager.
- Employee with no manager returns no manager cleanly.
- Missing employee returns 404.

## Task 026 - Get Direct Reports

Status: done

Goal: Return direct reports for one manager.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router accepts manager `public_id`.
- Service loads manager employee.
- Repository queries employees where `manager_id == manager.id`.
- Response excludes password hashes.

Verify:

- Manager with reports returns only direct reports.
- Indirect reports are not included.
- Manager with no reports returns an empty list.

## Task 027 - Get All Descendants

Status: completed

Goal: Return direct and indirect reports for one manager.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Reuse direct-report query.
- Traverse recursively.
- Avoid infinite loops.
- Return flattened descendant list first.
- Do not build full org chart in this task.

Verify:

- Seed three-level hierarchy.
- Confirm top manager returns all levels.
- Confirm middle manager returns only lower levels.
- Confirm unrelated employees are excluded.

## Task 028 - Prevent Self Manager Assignment

Status: completed

Goal: Reject assigning an employee as their own manager.

Files:

- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add manager-assignment service validation.
- Compare employee internal ID with proposed manager internal ID.
- Raise `HTTPException(400)` when they match.
- Do not add cycle detection in this task.

Verify:

- Try assigning employee as their own manager.
- Confirm 400 response.
- Confirm database value does not change.

## Task 029 - Prevent Manager Cycle

Status: completed

Goal: Reject manager assignments that create hierarchy cycles.

Files:

- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Walk proposed manager's manager chain.
- Reject if the employee appears in that chain.
- Raise `HTTPException(400)`.
- Keep self-manager validation separate.

Verify:

- Seed A -> B -> C.
- Try setting A's manager to C.
- Confirm request fails.
- Confirm existing hierarchy remains unchanged.

## Task 030 - HR Admin Creates Employee

Status: completed

Goal: Allow only HR Admins to create employee accounts.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`
- `backend/security.py`

Implement:

- Router requires HR Admin dependency.
- Request accepts employee profile fields and plaintext password.
- Service hashes password.
- Repository saves employee with password hash.
- Response returns public employee data only.
- Do not return password or password hash.

Verify:

- HR Admin can create employee.
- Manager cannot create employee.
- Employee cannot create employee.
- Duplicate email returns safe error.
- Stored password is hashed.

## Task 031 - Employee Updates Own Profile

Status: completed

Goal: Allow an employee to edit permitted self-profile fields.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router uses current employee dependency.
- Service allows only permitted self-edit fields.
- Reject role changes.
- Reject manager changes.
- Reject active-status changes.
- Repository updates allowed fields.

Verify:

- Employee changes phone.
- Employee changes address.
- Employee cannot change role.
- Employee cannot change manager.
- Employee cannot edit another employee through this route.

## Task 032 - Manager Updates Subordinate Profile

Status: completed

Goal: Allow managers to edit permitted fields for direct and indirect reports.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router uses current employee dependency.
- Service checks manager role.
- Service checks target is descendant.
- Service allows only manager-permitted fields.
- Reject role changes.
- Reject manager changes.

Verify:

- Manager edits direct report.
- Manager edits indirect report.
- Manager cannot edit unrelated employee.
- Manager cannot change role.
- Manager cannot assign manager.

## Task 033 - HR Admin Updates Employee

Status: completed

Goal: Allow HR Admins to update any employee.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router requires HR Admin dependency.
- Service allows HR Admin fields.
- Support role change.
- Support manager assignment.
- Support department and office changes.
- Reuse self-manager and cycle validation.

Verify:

- HR Admin updates ordinary employee.
- HR Admin changes role.
- HR Admin changes manager.
- HR Admin update rejects invalid manager cycle.

## Task 034 - Activate And Deactivate Employee

Status: completed

Goal: Allow HR Admins to toggle employee active status.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`

Implement:

- Add activate endpoint.
- Add deactivate endpoint.
- Require HR Admin.
- Repository updates `is_active`.
- Do not delete employees.

Verify:

- HR Admin deactivates employee.
- Deactivated employee cannot login.
- HR Admin reactivates employee.
- Reactivated employee can login.

## Task 035 - List Departments

Status: pending

Goal: Return all departments.

Files:

- `backend/routers/departmentRouter.py`
- `backend/services/departmentService.py`
- `backend/repos/departmentRepo.py`

Implement:

- Router requires authentication.
- Service calls repository.
- Repository lists departments.
- Response uses `ResponseDTO`.

Verify:

- Seed departments.
- Confirm list endpoint returns them.
- Confirm unauthenticated request fails.

## Task 036 - Create Department

Status: done

Goal: Allow HR Admins to create a department.

Files:

- `backend/routers/departmentRouter.py`
- `backend/services/departmentService.py`
- `backend/repos/departmentRepo.py`

Implement:

- Router requires HR Admin.
- Service validates unique name.
- Repository saves department.
- Response uses `ResponseDTO`.

Verify:

- HR Admin creates department.
- Manager cannot create department.
- Duplicate name returns safe error.

## Task 037 - Update Department

Status: done

Goal: Allow HR Admins to update a department.

Files:

- `backend/routers/departmentRouter.py`
- `backend/services/departmentService.py`
- `backend/repos/departmentRepo.py`

Implement:

- Router requires HR Admin.
- Service loads department.
- Service validates duplicate name if name changes.
- Repository updates department.

Verify:

- HR Admin updates department.
- Missing department returns 404.
- Duplicate name returns safe error.

## Task 038 - Delete Department

Status: pending

Goal: Allow safe department deletion.

Files:

- `backend/routers/departmentRouter.py`
- `backend/services/departmentService.py`
- `backend/repos/departmentRepo.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router requires HR Admin.
- Service checks department exists.
- Service checks whether employees reference department.
- Block deletion when department is in use.
- Repository deletes unused department.

Verify:

- Delete unused department succeeds.
- Delete department with employees fails.
- Missing department returns 404.

## Task 039 - List Offices

Status: pending

Goal: Return all offices.

Files:

- `backend/routers/officeRouter.py`
- `backend/services/officeService.py`
- `backend/repos/officeRepo.py`

Implement:

- Router requires authentication.
- Service calls repository.
- Repository lists offices.
- Response uses `ResponseDTO`.

Verify:

- Seed offices.
- Confirm list endpoint returns them.
- Confirm unauthenticated request fails.

## Task 040 - Create Office

Status: done

Goal: Allow HR Admins to create an office.

Files:

- `backend/routers/officeRouter.py`
- `backend/services/officeService.py`
- `backend/repos/officeRepo.py`

Implement:

- Router requires HR Admin.
- Service validates unique name.
- Repository saves office.
- Response uses `ResponseDTO`.

Verify:

- HR Admin creates office.
- Manager cannot create office.
- Duplicate name returns safe error.

## Task 041 - Update Office

Status: done

Goal: Allow HR Admins to update an office.

Files:

- `backend/routers/officeRouter.py`
- `backend/services/officeService.py`
- `backend/repos/officeRepo.py`

Implement:

- Router requires HR Admin.
- Service loads office.
- Service validates duplicate name if name changes.
- Repository updates office.

Verify:

- HR Admin updates office.
- Missing office returns 404.
- Duplicate name returns safe error.

## Task 042 - Delete Office

Status: pending

Goal: Allow safe office deletion.

Files:

- `backend/routers/officeRouter.py`
- `backend/services/officeService.py`
- `backend/repos/officeRepo.py`
- `backend/repos/employeeRepo.py`

Implement:

- Router requires HR Admin.
- Service checks office exists.
- Service checks whether employees reference office.
- Block deletion when office is in use.
- Repository deletes unused office.

Verify:

- Delete unused office succeeds.
- Delete office with employees fails.
- Missing office returns 404.

## Task 043 - List Skills

Status: pending

Goal: Return standardized skills.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/skillRepo.py`

Implement:

- Router requires authentication.
- Service calls repository.
- Repository lists skills.
- Response uses `ResponseDTO`.

Verify:

- Seed skills.
- Confirm list endpoint returns them.
- Confirm unauthenticated request fails.

## Task 044 - Create Skill

Status: done

Goal: Allow HR Admins to create a standardized skill.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/skillRepo.py`

Implement:

- Router requires HR Admin.
- Service validates unique name.
- Repository saves skill.
- Do not include proficiency on `skills`.

Verify:

- HR Admin creates skill.
- Manager cannot create skill.
- Duplicate name returns safe error.
- Created skill has no proficiency field.

## Task 045 - Update Skill

Status: done

Goal: Allow HR Admins to update a standardized skill.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/skillRepo.py`

Implement:

- Router requires HR Admin.
- Service loads skill.
- Service validates duplicate name if name changes.
- Repository updates skill.

Verify:

- HR Admin updates skill.
- Missing skill returns 404.
- Duplicate name returns safe error.

## Task 046 - Delete Skill

Status: pending

Goal: Allow safe skill deletion.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/skillRepo.py`
- `backend/repos/employeeSkillRepo.py`

Implement:

- Router requires HR Admin.
- Service checks skill exists.
- Service checks whether employees reference skill.
- Block deletion when skill is in use.
- Repository deletes unused skill.

Verify:

- Delete unused skill succeeds.
- Delete skill assigned to employee fails.
- Missing skill returns 404.

## Task 047 - Get Employee Skills

Status: pending

Goal: Return skills and proficiency for one employee.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/employeeSkillRepo.py`

Implement:

- Router accepts employee `public_id`.
- Service loads employee.
- Repository joins `employee_skills` and `skills`.
- Response includes skill data and proficiency.

Verify:

- Employee with skills returns all skills.
- Employee with no skills returns empty list.
- Missing employee returns 404.

## Task 048 - Assign Skill To Employee

Status: done

Goal: Assign one standardized skill to one employee with proficiency.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/employeeSkillRepo.py`
- `backend/repos/employeeRepo.py`
- `backend/repos/skillRepo.py`
- `backend/dependencies.py`

Implement:

- Router accepts employee `public_id`, skill ID/name, and proficiency.
- Service validates employee exists.
- Service validates skill exists.
- Service validates proficiency enum.
- Service checks authorization: only HR Admin or the employee's manager can assign.
- Repository inserts `EmployeeSkill`.
- Block duplicate assignment.

Verify:

- Assign Python beginner to employee.
- Confirm row exists in `employee_skills`.
- Confirm duplicate assignment fails.
- Manager can assign skill to their direct report.
- Employee cannot assign skill to others.
- Confirm invalid proficiency fails.

## Task 049 - Update Employee Skill Proficiency

Status: done

Goal: Change proficiency for one employee-skill row.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/employeeSkillRepo.py`
- `backend/dto/skillDto.py`

Implement:

- Router accepts new proficiency.
- Service validates employee-skill row exists.
- Service validates authorization: only admin or employee's manager.
- Repository updates only proficiency.

Verify:

- Change Python beginner to advanced.
- Confirm proficiency changed.
- Missing assignment returns 404.
- Unauthorized employee fails.

## Task 050 - Remove Skill From Employee

Status: done

Goal: Remove one skill assignment from one employee.

Files:

- `backend/routers/skillRouter.py`
- `backend/services/skillService.py`
- `backend/repos/employeeSkillRepo.py`

Implement:

- Router accepts employee and skill.
- Service validates assignment exists.
- Service validates authorization: only admin or employee's manager.
- Repository deletes employee-skill row.

Verify:

- Remove assigned skill.
- Confirm row is gone.
- Removing missing assignment returns 404.

## Task 051 - Audit Employee Creation

Status: pending

Goal: Write an audit log when an employee is created.

Files:

- `backend/services/employeeService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Create audit repository if missing.
- Create audit service if missing.
- Record actor employee ID.
- Record target type `employee`.
- Record target ID as internal employee ID.
- Exclude password and password hash.
- Commit audit in the same transaction as employee creation where possible.

Verify:

- Create employee.
- Confirm one audit log exists.
- Confirm audit values omit password data.

## Task 052 - Audit Employee Profile Update

Status: pending

Goal: Write an audit log when safe employee profile fields change.

Files:

- `backend/services/employeeService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Capture old safe values.
- Capture new safe values.
- Store only changed fields.
- Exclude sensitive values.

Verify:

- Update phone.
- Confirm audit log records old and new phone.
- Confirm unchanged fields are not recorded.

## Task 053 - Audit Role Change

Status: pending

Goal: Write an audit log when HR Admin changes employee role.

Files:

- `backend/services/employeeService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Record old role.
- Record new role.
- Use target type `employee`.
- Use internal target ID.

Verify:

- HR Admin changes role.
- Confirm audit record exists.
- Confirm actor is HR Admin internal ID.

## Task 054 - Audit Manager Change

Status: pending

Goal: Write an audit log when HR Admin changes an employee's manager.

Files:

- `backend/services/employeeService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Record old manager internal ID.
- Record new manager internal ID.
- Do not use public UUID as audit FK.

Verify:

- Change manager.
- Confirm audit record exists.
- Confirm old and new values are internal IDs.

## Task 055 - Audit Employee Skill Change

Status: pending

Goal: Write audit logs for employee skill assignment, removal, and proficiency update.

Files:

- `backend/services/skillService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Audit assignment.
- Audit removal.
- Audit proficiency update.
- Use target type `employee_skill`.
- Include employee ID, skill ID, and proficiency where safe.

Verify:

- Assign skill and confirm audit.
- Update proficiency and confirm audit.
- Remove skill and confirm audit.

## Task 056 - Audit Department Changes

Status: pending

Goal: Write audit logs for department create, update, and delete.

Files:

- `backend/services/departmentService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Audit create.
- Audit update.
- Audit delete.
- Use target type `department`.

Verify:

- Create department and confirm audit.
- Update department and confirm audit.
- Delete department and confirm audit.

## Task 057 - Audit Office Changes

Status: pending

Goal: Write audit logs for office create, update, and delete.

Files:

- `backend/services/officeService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Audit create.
- Audit update.
- Audit delete.
- Use target type `office`.

Verify:

- Create office and confirm audit.
- Update office and confirm audit.
- Delete office and confirm audit.

## Task 058 - Audit Skill Changes

Status: pending

Goal: Write audit logs for standardized skill create, update, and delete.

Files:

- `backend/services/skillService.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Audit create.
- Audit update.
- Audit delete.
- Use target type `skill`.
- Do not audit proficiency here.

Verify:

- Create skill and confirm audit.
- Update skill and confirm audit.
- Delete skill and confirm audit.

## Task 059 - List Audit Logs

Status: pending

Goal: Allow HR Admins to view audit history.

Files:

- `backend/routers/auditRouter.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Router requires HR Admin.
- Repository lists audit logs.
- Add pagination.
- Response uses `ResponseDTO`.

Verify:

- HR Admin can list audit logs.
- Manager cannot list audit logs.
- Employee cannot list audit logs.
- Pagination works.

## Task 060 - Filter Audit Logs

Status: pending

Goal: Filter audit history by common audit fields.

Files:

- `backend/routers/auditRouter.py`
- `backend/services/auditService.py`
- `backend/repos/auditRepo.py`

Implement:

- Add actor filter.
- Add target type filter.
- Add target ID filter.
- Add action filter.
- Add date range filter.
- Keep pagination.

Verify:

- Filter by actor.
- Filter by target type.
- Filter by action.
- Filter by date range.

## Task 061 - Consistent Not Found Errors

Status: pending

Goal: Make missing records return consistent safe errors.

Files:

- service modules

Implement:

- Raise `HTTPException(404)` when requested records do not exist.
- Use safe detail messages.
- Do not leak database internals.

Verify:

- Missing employee returns 404.
- Missing department returns 404.
- Missing office returns 404.
- Missing skill returns 404.

## Task 062 - Consistent Duplicate Resource Errors

Status: pending

Goal: Make duplicate unique values return consistent safe errors.

Files:

- service modules
- repository modules as needed

Implement:

- Check duplicate employee email.
- Check duplicate department name.
- Check duplicate office name.
- Check duplicate skill name.
- Raise `HTTPException(409)`.

Verify:

- Duplicate email returns 409.
- Duplicate department returns 409.
- Duplicate office returns 409.
- Duplicate skill returns 409.

## Task 063 - Register All Routers

Status: pending

Goal: Mount all completed routers in the FastAPI app.

Files:

- `backend/main.py`

Implement:

- Register auth router.
- Register employee router if implemented.
- Register department router if implemented.
- Register office router if implemented.
- Register skill router if implemented.
- Register audit router if implemented.
- Do not import routers that do not exist.

Verify:

- Import the app.
- Generate OpenAPI.
- Confirm every completed route appears.

## Task 064 - Final Auth Smoke Test

Status: pending

Goal: Verify the auth flow end to end.

Files:

- no new files unless fixing auth defects

Implement:

- Only fix defects found during this smoke test.
- Do not add unrelated auth features.

Verify:

- Create employee with hashed password.
- Login succeeds.
- Access token is returned.
- Refresh token is returned.
- Refresh token hash is stored.
- Refresh token rotation succeeds if Task 012 is complete.
- Logout succeeds if Task 013 is complete.

## Task 065 - Final Employee Directory Smoke Test

Status: pending

Goal: Verify core directory reads end to end.

Files:

- no new files unless fixing directory defects

Implement:

- Only fix defects found during this smoke test.
- Do not add new features.

Verify:

- List employees.
- Get employee detail.
- Search employees by text.
- Filter employees by department.
- Filter employees by office.
- Filter employees by skill.
- Confirm responses exclude password hashes.

## Task 066 - Final Permission Smoke Test

Status: pending

Goal: Verify role boundaries.

Files:

- no new files unless fixing authorization defects

Implement:

- Only fix authorization defects found during this smoke test.
- Do not add unrelated features.

Verify:

- Employee cannot edit another employee.
- Manager can edit direct report.
- Manager can edit indirect report.
- Manager cannot edit unrelated employee.
- Manager cannot assign manager.
- HR Admin can assign manager.
- HR Admin can create employee.
- Only HR Admin can manage departments, offices, and standardized skills.

## Task 067 - Final Security Smoke Test

Status: pending

Goal: Verify sensitive data handling.

Files:

- no new files unless fixing security defects

Implement:

- Only fix security defects found during this smoke test.
- Do not add unrelated features.

Verify:

- Passwords are never stored as plaintext.
- Password hashes are not returned by APIs.
- Raw refresh tokens are not stored.
- Refresh-token hashes are not returned by APIs.
- Raw JWTs are not stored.
- Sensitive values are not audited.
- Inactive employees cannot authenticate.

## Task 068 - Final Audit Smoke Test

Status: pending

Goal: Verify required audit events.

Files:

- no new files unless fixing audit defects

Implement:

- Only fix audit defects found during this smoke test.
- Do not add unrelated features.

Verify:

- Employee creation is audited.
- Employee update is audited.
- Role change is audited.
- Manager change is audited.
- Department change is audited.
- Office change is audited.
- Skill change is audited.
- Employee skill change is audited.
- Audit values exclude sensitive fields.

## Task 069 - Get Full Organizational Hierarchy

Status: completed

Goal: Return the complete employee reporting hierarchy as a nested forest.

Files:

- `backend/routers/employeeRouter.py`
- `backend/services/employeeService.py`
- `backend/repos/employeeRepo.py`
- `backend/dto/employeeDto.py`

Implement:

- Protect the route with the current employee dependency.
- Load employees in one repository query.
- Build nested direct-report nodes in the service.
- Return multiple roots when the organization has multiple top-level employees.
- Avoid infinite recursion when invalid cycle data exists.
- Return data using `ResponseDTO`.

Verify:

- Seed a hierarchy with multiple levels.
- Confirm every employee appears once.
- Confirm direct reports are nested under the correct manager.
- Confirm multiple root employees are returned.
- Confirm invalid cycle data does not recurse forever.
