# Backend Memory

This file records project context for future backend implementation work. It is not application code.

## Project

- The active backend directory in this workspace is lowercase `backend`.
- The pasted instructions refer to `Backend`, but the existing project path is `backend`.
- The backend is for an Employee Directory application.
- The intended stack is Python, FastAPI, SQLModel, and PostgreSQL.
- The intended architecture is layered: router -> service -> repository -> PostgreSQL.
- HTTP concerns should stay in routers.
- Business rules should stay in services.
- Database query logic should stay in repositories.
- Authorization rules should be centralized instead of scattered through routers.

## Authoritative Schema

- Use `backend/scheme.md` as the authoritative schema reference.
- Major tables expected by the planning prompt are `employees`, `departments`, `offices`, `skills`, `employee_skills`, `audit_logs`, and `refresh_tokens`.
- `backend/scheme.md` currently documents `refresh_tokens` and `audit_logs`.
- The top table list in `backend/scheme.md` should be checked during future schema cleanup because it may not list every documented table.
- Do not add `teams`.
- Do not add separate `managers`.
- Do not add separate `admins`.
- Managers and HR Admins are employees distinguished by `employees.role`.

## Employee IDs

- `employees.id` is the internal integer or BigInteger primary key.
- `employees.public_id` is the UUID for externally exposed employee identity.
- Database relationships should use `employees.id`.
- API-facing employee identifiers should usually use `employees.public_id`.
- `employee_skills.employee_id` should reference `employees.id`.
- `refresh_tokens.employee_id` should reference `employees.id`.
- `audit_logs.actor_employee_id` should reference `employees.id`.

## Role And Permission Rules

- Valid roles are `employee`, `manager`, and `hr_admin`.
- Employees can authenticate, view/search the directory, view profiles, update permitted self-profile fields, and possibly manage their own permitted skills.
- Employees cannot create accounts, edit unrelated employees, assign managers, change roles, or perform HR Admin-only organization changes.
- Managers can do employee actions and edit permitted fields for direct and indirect reports beneath them.
- Managers cannot create accounts, assign managers, change roles, or perform HR Admin-only organization changes.
- HR Admins can create accounts, edit any employee, change roles, assign managers, activate/deactivate accounts, manage departments/offices/skills, perform organization updates, and view audit history.
- Only HR Admins can create employee accounts.
- There is no public registration flow.

## Hierarchy Rules

- The organization hierarchy is stored through `employees.manager_id -> employees.id`.
- An employee can have zero or one manager.
- A manager can have many direct reports.
- Managers can report to other managers.
- Recursive hierarchy operations are required.
- The backend must support manager lookup, direct reports, descendants, full hierarchy, descendant checks, self-manager prevention, and cycle prevention.

## Skills Rules

- Skills are standardized rows in `skills`.
- Employee-specific skill level belongs on `employee_skills.proficiency`.
- Do not put proficiency on `skills`.
- Do not store skills as comma-separated strings on employees.
- `employee_skills` should use `(employee_id, skill_id)` as the composite primary key.
- Do not add a separate `id` to `employee_skills` unless requirements change.
- Valid proficiency values are `beginner`, `intermediate`, `advanced`, and `expert`.

## Authentication Rules

- Plan for password hashing, login, JWT access tokens, refresh tokens, refresh-token rotation, current-authenticated-employee dependency, inactive-account checks, and logout/session invalidation.
- Never store plaintext passwords.
- Never return `password_hash` in API responses.
- The `refresh_tokens` table stores only hashed refresh tokens.
- Never store raw refresh tokens.
- Refresh-token rotation should validate the old token, delete the old refresh-token record, create a new token, and store the new token hash.
- Expired refresh tokens must not be accepted.

## Auditing Rules

- Meaningful business changes must create audit records.
- Audit employee creation, profile updates, activation/deactivation, role changes, manager changes, department changes, office changes, collaboration-status changes, employee skill assignment/removal/proficiency changes, standardized skill changes, and password changes.
- Do not audit sensitive values such as passwords, password hashes, raw JWTs, raw refresh tokens, or refresh-token hashes unless a future security requirement explicitly needs non-sensitive metadata.
- Business changes and audit records should happen in the same database transaction whenever possible.
- Audit logs should be treated as append-only.

## Current Backend Observations

- Existing files include `backend/main.py`, `backend/database.py`, `backend/jwtToken.py`, `backend/dto/ResponseDTO.py`, model files, and empty router files.
- No README, requirements file, `pyproject.toml`, existing `plan.md`, or existing `memory.md` was found during this planning task.
- `backend/models/employee.py` defines employee enums and an `Employee` table model.
- `backend/models/department.py` defines `Department`.
- `backend/models/office.py` defines `Office`.
- `backend/models/skill.py` defines `Skill`, `ProficiencyLevel`, and `EmployeeSkill`.
- `backend/models/audit_log.py` defines `AuditLog`.
- A refresh-token table model was not present when this memory file was created.
- `backend/routers/authRouter.py` and `backend/routers/employeeRouter.py` existed but were empty when inspected.
- `backend/repos` and `backend/services` directories existed but no repository or service files were found when inspected.
- `backend/main.py` currently contains stale router imports for accounts, users, transactions, and login, plus an incomplete `app.include_router()` call.
- `backend/database.py` currently contains stale table alteration logic referencing `transaction`.
- `backend/jwtToken.py` currently contains MongoDB-style remnants such as `bson.ObjectId`, `repos.userRepo`, and `get_db`; those do not match the SQLModel Employee Directory design.

## Implementation Cautions

- Do not implement backend functionality while working on planning-only tasks.
- When implementation begins, align stale copied code with Employee Directory concepts before building new features on top of it.
- Prefer internal IDs for joins and foreign keys.
- Prefer public UUIDs for API-facing employee identity.
- Keep manager and admin behavior on the `employees` table through `role`.
- Keep hierarchy logic in employee services/repositories instead of creating a manager-specific repository.
- Keep audit creation close to service-level business transactions.
- Keep authentication secrets in configuration, not source code.
