# Employee Directory Database Schema

This file is the authoritative database schema reference for the Employee Directory backend.

The backend uses:

- FastAPI
- SQLModel
- PostgreSQL

This document is intentionally limited to database schema, field definitions, constraints, and relationships. It does not define application code, routes, services, repositories, migrations, authentication, authorization, frontend behavior, SQLModel classes, or SQL.

The database contains exactly these core tables:

- `employees`
- `departments`
- `offices`
- `skills`
- `employee_skills`
- `refresh_tokens`

Do not add a `teams` table.

Do not add a separate `managers` table.

Do not add a separate `admins` table.

Managers and HR Admins are employees and are differentiated using the `role` field in the `employees` table.

---

## 1. employees

Table name:

`employees`

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key, internal database identifier |
| `public_id` | UUID | Unique, non-null, externally exposed employee identifier |
| `first_name` | VARCHAR(100) | Non-null |
| `last_name` | VARCHAR(100) | Non-null |
| `email` | VARCHAR(255) | Unique, non-null |
| `password_hash` | VARCHAR(255) | Non-null, stores hashed password only |
| `role` | ENUM | Non-null, allowed values: `employee`, `manager`, `hr_admin` |
| `phone` | VARCHAR(30) | Nullable |
| `street_address` | VARCHAR(255) | Nullable |
| `city` | VARCHAR(100) | Nullable |
| `state` | VARCHAR(100) | Nullable |
| `zip_code` | VARCHAR(20) | Nullable |
| `country` | VARCHAR(100) | Nullable |
| `collaboration_status` | ENUM | Non-null, allowed values: `open`, `busy`, `unavailable` |
| `work_mode` | ENUM | Non-null, allowed values: `remote`, `in_office`, `hybrid` |
| `department_id` | Integer / BigInteger | Foreign key to `departments.id`, nullable if no department assigned |
| `manager_id` | Integer / BigInteger | Self-referencing foreign key to `employees.id`, nullable |
| `office_id` | Integer / BigInteger | Foreign key to `offices.id`, nullable |
| `is_active` | BOOLEAN | Non-null, default `true` |
| `created_at` | TIMESTAMP | Non-null |
| `updated_at` | TIMESTAMP | Non-null |

Important rules:

- Never store plaintext passwords.
- Only store a password hash in `password_hash`.
- `email` must be unique.
- `public_id` must be unique.
- `manager_id` references another employee in the same `employees` table.
- An employee can have at most one manager.
- An employee can have no manager, so `manager_id` must be nullable.
- A manager can manage many employees.
- A manager may also have another manager.
- An employee cannot be their own manager.
- `role` and `manager_id` represent different concepts.

Example:

```text
Michael
role = manager
manager_id = null

Sarah
role = manager
manager_id = Michael

Adam
role = employee
manager_id = Sarah
```

This creates:

```text
Michael
|-- Sarah
    |-- Adam
```

The three valid roles are:

```text
employee
manager
hr_admin
```

Do not create separate tables based on role.

---

## 2. departments

Table name:

`departments`

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key |
| `name` | VARCHAR(150) | Unique, non-null |
| `description` | TEXT | Nullable |
| `created_at` | TIMESTAMP | Non-null |
| `updated_at` | TIMESTAMP | Non-null |

Relationship:

```text
departments.id
      ^
      |
employees.department_id
```

One department can contain many employees.

One employee can belong to zero or one department.

There is intentionally no `teams` table.

---

## 3. offices

Table name:

`offices`

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key |
| `name` | VARCHAR(150) | Unique, non-null |
| `street_address` | VARCHAR(255) | Non-null |
| `city` | VARCHAR(100) | Non-null |
| `state` | VARCHAR(100) | Nullable |
| `zip_code` | VARCHAR(20) | Nullable |
| `country` | VARCHAR(100) | Non-null |
| `created_at` | TIMESTAMP | Non-null |
| `updated_at` | TIMESTAMP | Non-null |

Relationship:

```text
offices.id
    ^
    |
employees.office_id
```

One office can contain many employees.

An employee may have no physical office, particularly if they are fully remote.

`work_mode` and `office_id` are different.

Example:

```text
work_mode = hybrid
office_id = Boston Office
```

or:

```text
work_mode = remote
office_id = null
```

---

## 4. skills

Table name:

`skills`

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key |
| `name` | VARCHAR(150) | Unique, non-null |
| `description` | TEXT | Nullable |
| `created_at` | TIMESTAMP | Non-null |
| `updated_at` | TIMESTAMP | Non-null |

Examples of skill records:

```text
Python
React
PostgreSQL
AWS
Project Management
Communication
Machine Learning
```

Skills should not be stored as comma-separated strings inside the `employees` table.

Employees and skills have a many-to-many relationship.

---

## 5. employee_skills

Table name:

`employee_skills`

This is the association table between employees and skills.

It stores both:

- Which skills an employee has.
- The employee's proficiency level for each skill.

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `employee_id` | Integer / BigInteger | Foreign key to `employees.id`, non-null |
| `skill_id` | Integer / BigInteger | Foreign key to `skills.id`, non-null |
| `proficiency` | ENUM | Non-null, represents the employee's level of expertise in the skill |

Allowed proficiency values:

- `beginner`
- `intermediate`
- `advanced`
- `expert`

Primary key:

`(employee_id, skill_id)`

The combination of `employee_id` and `skill_id` must be unique.

This prevents the same skill from being assigned to the same employee more than once.

Example:

```text
employee_id    skill_id       proficiency
------------------------------------------
Adam           Python         expert
Adam           React          advanced
Adam           PostgreSQL     intermediate
Sarah          Python         advanced
Sarah          AWS            expert
```

One employee can have many skills.

One skill can belong to many employees.

The `proficiency` field belongs in `employee_skills`, not `skills`, because proficiency is specific to the relationship between an employee and a skill.

For example:

```text
Python
```

is the same skill for everyone, but:

```text
Adam  -> Python -> expert
Sarah -> Python -> intermediate
```

may have different proficiency levels.

This field should support expertise-related searches such as:

- Find employees with Python skills.
- Find employees who are experts in Python.
- Find advanced or expert AWS employees.
- Find employees with a specific skill and minimum proficiency level.

Updated table:

```text
employee_skills
    employee_id
    skill_id
    proficiency

    PRIMARY KEY (employee_id, skill_id)
```

---

## 6. refresh_tokens

Table name:

`refresh_tokens`

The `refresh_tokens` table stores refresh tokens for authenticated employees.

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key |
| `employee_id` | Integer / BigInteger | Foreign key to `employees.id`, non-null |
| `token_hash` | VARCHAR(255) | Unique, non-null, stores the hashed refresh token |
| `expires_at` | TIMESTAMP | Non-null, time when the refresh token expires |

Relationship:

```text
refresh_tokens.employee_id
    -> employees.id
```

One employee may have multiple refresh tokens, allowing multiple logged-in sessions.

The raw refresh token must never be stored in the database.

Only store:

```text
token_hash
```

When refresh-token rotation occurs, the old refresh-token record should be removed and a new refresh-token record created.

Conceptually:

```text
Old refresh token
        v
validate
        v
delete old refresh token record
        v
create new refresh token
        v
store new token hash
```

Expired refresh tokens must not be accepted.

Final table:

```text
refresh_tokens
    id              Integer / BigInteger PK
    employee_id     Integer / BigInteger FK -> employees.id
    token_hash      VARCHAR(255) UNIQUE
    expires_at      TIMESTAMP
```

---

## 7. audit_logs

Table name:

`audit_logs`

This table stores an immutable history of meaningful changes made throughout the Employee Directory system.

The purpose of this table is to answer:

- Who made the change?
- What record was changed?
- What type of change occurred?
- What values changed?
- When did the change happen?

Fields:

| Field | Type | Constraints / Purpose |
|---|---|---|
| `id` | Integer / BigInteger | Primary key |
| `actor_employee_id` | Integer / BigInteger | Foreign key to `employees.id`, non-null |
| `target_type` | VARCHAR(50) | Non-null, identifies the type of entity changed |
| `target_id` | Integer / BigInteger | Non-null, internal ID of the record that was changed |
| `action` | VARCHAR(100) | Non-null, identifies what operation occurred |
| `old_values` | JSONB | Nullable, stores the previous values of fields that changed |
| `new_values` | JSONB | Nullable, stores the new values of fields that changed |
| `created_at` | TIMESTAMP | Non-null, timestamp when the change occurred |

## Internal ID Rule

The application uses both internal database IDs and public UUIDs for employees.

Example:

```text
employees
    id          -> Integer / BigInteger primary key
    public_id   -> UUID unique public identifier
```

Database relationships must use the internal `id`.

Therefore:

```text
audit_logs.actor_employee_id
    -> employees.id
```

Do not use `employees.public_id` as the foreign key for `actor_employee_id`.

The `public_id` should primarily be used when exposing employee identifiers through the API.

Example:

```text
Database relationship:

actor_employee_id = 42
```

The API may return the actor's public identifier separately if needed:

```text
actor_public_id = employee.public_id
```

---

## actor_employee_id

`actor_employee_id` identifies the employee who performed the action.

It references the internal primary key:

```text
audit_logs.actor_employee_id
    -> employees.id
```

Example:

If employee ID `12` is an HR Admin and changes employee ID `42`:

```text
actor_employee_id = 12
target_id = 42
```

If an employee updates their own profile:

```text
actor_employee_id = employee.id
target_id = employee.id
```

---

## target_type

`target_type` identifies the type of database entity that was changed.

Supported values may include:

```text
employee
department
office
skill
employee_skill
```

Example:

```text
target_type = employee
```

means the audit record represents a change to an employee.

---

## target_id

`target_id` stores the internal database ID of the record that was changed.

It uses the same internal integer ID strategy used by the application's database relationships.

Examples:

```text
target_type =

## Relationship Summary

```text
employees
    1
    |
    | many
    ↓
audit_logs
```

Relationship:

```text
audit_logs.actor_employee_id
    -> employees.id
```

`target_id` is not a direct foreign key because it can represent records from different entity types depending on `target_type`.

---

## Final Table

```text
audit_logs
    id
    actor_employee_id
    target_type
    target_id
    action
    old_values
    new_values
    created_at
```

The `audit_logs` table exists only to preserve an immutable historical record of meaningful system changes.

## Foreign Key Summary

The following foreign-key relationships must be clearly documented:

```text
employees.department_id
    -> departments.id
```

```text
employees.office_id
    -> offices.id
```

```text
employees.manager_id
    -> employees.id
```

```text
employee_skills.employee_id
    -> employees.id
```

```text
employee_skills.skill_id
    -> skills.id
```

```text
refresh_tokens.employee_id
    -> employees.id
```

---

## Relationship Summary

```text
DEPARTMENTS
    1
    |
    | many
    v
EMPLOYEES
```

```text
OFFICES
    1
    |
    | many
    v
EMPLOYEES
```

```text
EMPLOYEE / MANAGER HIERARCHY

employees.manager_id
        |
        |-- references employees.id
```

Example:

```text
Michael
|-- Sarah
|   |-- Adam
|   |-- John
|-- Robert
    |-- Emily
```

```text
EMPLOYEES
    many
      |
      v
EMPLOYEE_SKILLS
      ^
      |
    many
SKILLS
```

```text
EMPLOYEES
    1
    |
    | many
    v
REFRESH_TOKENS
```

---

## Final Schema

The authoritative database structure is:

```text
employees
    id
    public_id
    first_name
    last_name
    email
    password_hash
    role
    phone
    street_address
    city
    state
    zip_code
    country
    collaboration_status
    work_mode
    department_id
    manager_id
    office_id
    is_active
    created_at
    updated_at
```

```text
departments
    id
    name
    description
    created_at
    updated_at
```

```text
offices
    id
    name
    street_address
    city
    state
    zip_code
    country
    created_at
    updated_at
```

```text
skills
    id
    name
    description
    created_at
    updated_at
```

```text
employee_skills
    employee_id
    skill_id
    proficiency

    PRIMARY KEY (employee_id, skill_id)
```

```text
refresh_tokens
    id
    employee_id
    token_hash
    expires_at
```

This `scheme.md` file is only the database schema reference.
