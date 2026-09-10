# Frontend Completion TODO

Planning only. Backend files were inspected for real API contracts; do not modify backend files.

## Backend Facts To Match

- [x] API response wrapper: `{ status_code, msg, data }`
- [x] Auth roles: `employee`, `manager`, `hr_admin`
- [x] Work modes: `remote`, `in_office`, `hybrid`
- [x] Collaboration statuses: `open`, `busy`, `unavailable`
- [x] Skill proficiency values: `beginner`, `intermediate`, `advanced`, `expert`
- [x] Access token expiry: `expires_in` is `3600` seconds
- [x] Refresh token expiry: `refresh_token_expires_at`, backend default is 7 days
- [x] Refresh tokens are rotated: old refresh token is deleted and a new pair is returned
- [x] Backend logout endpoint exists: `POST /auth/logout` with `{ refresh_token }`, deletes matching stored refresh token
- [x] No dedicated `GET /me` endpoint exists; use login payload plus `GET /employees/{public_id}` for full current-user details

## Existing Frontend Snapshot

- [x] Vite + React app exists: `frontend/package.json`
- [x] Tailwind v4 setup exists: `frontend/src/index.css`, `frontend/vite.config.js`
- [x] Axios client exists: `frontend/src/apis/apiClient.js`
- [x] Axios attaches access token and has refresh-token response interceptor: `frontend/src/apis/apiClient.js`
- [x] Redux store and slices exist: `frontend/src/store/*`
- [x] Login page/form exists: `frontend/src/pages/LoginPage.jsx`, `frontend/src/components/LoginForm.jsx`
- [x] Login redirects to `/organization`: `frontend/src/pages/LoginPage.jsx`
- [~] Routing is manual path switching in `frontend/src/App.jsx`; basic auth redirects exist, but no full router/dynamic routes yet
- [~] App shell exists: `frontend/src/components/AppShell.jsx`; needs mobile nav and role-aware navigation
- [x] Organization hierarchy exists as `HomePage` at `/organization`: `frontend/src/pages/HomePage.jsx`
- [~] Directory exists at `/directory`; real pagination and detail route navigation exist, manager-aware write actions still need refinement
- [x] Directory maps loaded department/office catalogs onto `GET /employees` rows for display
- [x] Employee detail page `/employees/:id` exists: `frontend/src/pages/EmployeeProfilePage.jsx`
- [x] My profile exists as `SettingsPage` at `/profile`
- [x] Departments/offices/skills pages exist with permission cleanup, confirmations, and exact backend behavior
- [x] Audit log admin view exists: `frontend/src/pages/AuditLogsPage.jsx`
- [x] 403 page/state exists: `frontend/src/pages/ForbiddenPage.jsx`
- [x] 404 page exists: `frontend/src/pages/NotFoundPage.jsx`
- [~] `AnalyticsPage` and `HelpPage` exist, but are not required for a complete API-backed app

## API Inventory

### Auth

- [~] `POST /auth/login`
  - Purpose: authenticate employee.
  - Used by: `/login`.
  - Auth: no.
  - Roles: any active employee account.
  - Request: `{ email: string, password: string }`.
  - Response data: `access_token`, `refresh_token`, `token_type`, `expires_in`, `refresh_token_expires_at`, `employee.public_id`, `employee.email`, `employee.role`.
  - Existing: `src/apis/authApi.js`, `src/store/thunks/authThunks.js`.

- [x] `POST /auth/refresh`
  - Purpose: rotate refresh token and get a new access token.
  - Used by: centralized Axios interceptor/session restoration.
  - Auth: no bearer token; send refresh token in body.
  - Roles: any active employee with valid stored refresh token.
  - Request: `{ refresh_token: string }`.
  - Response data: same as login.
  - Notes: failure can be `401` invalid/expired token or `403` inactive account.
  - Existing: `frontend/src/apis/authApi.js`, `frontend/src/apis/apiClient.js`.

### Employees And Organization

- [~] `GET /employees`
  - Purpose: paginated directory listing.
  - Used by: `/directory`, admin employee management, manager selection controls.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Query: `page`, `page_size`, `search`, `department_id`, `office_id`, `work_mode`, `collaboration_status`, `is_active`, `skill_id`, `proficiency`.
  - Response data: `{ items, total, page, page_size }`.
  - Item fields: `public_id`, `first_name`, `last_name`, `email`, `role`, `phone`, address fields, `collaboration_status`, `work_mode`, `department_id`, `manager_id`, `office_id`, `is_active`, timestamps, usually no nested `department`, `office`, `skills` from list service.
  - Existing: `src/apis/employeesApi.js`; current UI hardcodes `page_size: 100` and lacks real pagination.

- [~] `GET /employees/hierarchy`
  - Purpose: full organization tree.
  - Used by: `/organization`.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Request: none.
  - Response data: array of `{ employee, direct_reports }`; employee includes nested `department`, `office`, `skills`.
  - Existing: `src/apis/hierarchyApi.js`, `src/pages/HomePage.jsx`.

- [ ] `GET /employees/{public_id}`
  - Purpose: employee profile details.
  - Used by: `/employees/:id`, `/profile` hydration after login/session restore.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Request: `public_id` path UUID.
  - Response data: `EmployeePublicResponse` with nested `department`, `office`, `skills`.
  - Existing API helper exists, but no detail page.

- [x] `GET /employees/{public_id}/manager`
  - Purpose: show profile's manager.
  - Used by: `/employees/:id`.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Request: `public_id` path UUID.
  - Response data: employee summary or `null`.
  - Existing: `frontend/src/apis/employeesApi.js`, `frontend/src/pages/EmployeeProfilePage.jsx`.

- [x] `GET /employees/{public_id}/direct-reports`
  - Purpose: show direct reports.
  - Used by: `/employees/:id`, manager experience.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `EmployeePublicResponse`.
  - Existing: `frontend/src/apis/employeesApi.js`, `frontend/src/pages/EmployeeProfilePage.jsx`.

- [x] `GET /employees/{public_id}/descendants`
  - Purpose: show all reporting descendants.
  - Used by: manager branch view or `/employees/:id` for managers.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `EmployeePublicResponse`.
  - Existing: `frontend/src/apis/employeesApi.js`, `frontend/src/pages/EmployeeProfilePage.jsx`.

- [~] `PATCH /employees/me`
  - Purpose: update logged-in employee's own profile-safe fields.
  - Used by: `/profile`.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Request: any of `phone`, `street_address`, `city`, `state`, `zip_code`, `country`, `collaboration_status`, `work_mode`.
  - Response data: updated `EmployeePublicResponse`.
  - Existing: used by `SettingsPage`; route/name needs change.

- [ ] `PATCH /employees/{public_id}/profile`
  - Purpose: manager updates profile-safe fields for a reporting descendant.
  - Used by: manager controls on `/employees/:id` or `/directory`.
  - Auth: bearer required.
  - Roles: route accepts any authenticated employee, but service only permits `manager`; target must be in manager's reporting hierarchy.
  - Request: same fields as self update.
  - Response data: updated `EmployeePublicResponse`.
  - Existing API thunk exists, but UI does not use it.

- [~] `PATCH /employees/{public_id}`
  - Purpose: HR admin updates employee identity, role, manager, department, office, and profile-safe fields.
  - Used by: admin employee management.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: any of self-update fields plus `first_name`, `last_name`, `email`, `role`, `manager_public_id`, `department_id`, `office_id`.
  - Response data: updated `EmployeePublicResponse`.
  - Existing: `DirectoryPage` uses this but does not include `manager_public_id` control.

- [~] `POST /admin/employees`
  - Purpose: HR admin creates employees.
  - Used by: admin employee management.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `first_name`, `last_name`, `email`, `password`, `role`, optional contact/address fields, `collaboration_status`, `work_mode`, `department_id`, `manager_id`, `office_id`, `is_active`.
  - Response data: created `EmployeePublicResponse`.
  - Existing: used by `DirectoryPage`, but manager selection is missing and request uses numeric `manager_id`.

- [~] `PATCH /employees/{public_id}/activate`
  - Purpose: activate employee.
  - Used by: admin employee management.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: path UUID only.
  - Response data: updated `EmployeePublicResponse`.
  - Existing: UI has activate/deactivate button.

- [~] `PATCH /employees/{public_id}/deactivate`
  - Purpose: deactivate employee; if target is manager, direct reports are reassigned to target's manager.
  - Used by: admin employee management.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: path UUID only.
  - Response data: updated `EmployeePublicResponse`.
  - Existing: UI has activate/deactivate button; needs confirmation.

- [ ] `PATCH /employees/{public_id}/manager`
  - Purpose: assign an employee's manager.
  - Used by: admin employee management.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ manager_public_id: UUID }`.
  - Response data: updated `EmployeePublicResponse`.
  - Notes: manager must be active, have role `manager`, not be self, and not create a cycle.

### Departments

- [x] `GET /departments`
  - Purpose: list all departments including inactive.
  - Used by: `/departments` management.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `{ id, name, description, is_active, created_at, updated_at }`.
  - Existing: `src/apis/departmentsApi.js`.

- [x] `GET /departments/active`
  - Purpose: active department options.
  - Used by: directory filters and employee forms.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of department responses.

- [x] `POST /departments`
  - Purpose: create department.
  - Used by: HR admin controls on `/departments`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ name: string, description?: string | null }`.
  - Response data: created department.

- [x] `PATCH /departments/{department_id}`
  - Purpose: update department name/description.
  - Used by: HR admin controls on `/departments`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ name?: string | null, description?: string | null }`; at least one field.
  - Response data: updated department.

- [x] `DELETE /departments/{department_id}`
  - Purpose: soft-delete/deactivate department if no employees are assigned.
  - Used by: HR admin controls on `/departments`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Response data: deactivated department.
  - Notes: `409` if assigned to employees.

### Offices

- [x] `GET /offices`
  - Purpose: list all offices including inactive.
  - Used by: `/offices` management.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `{ id, name, street_address, city, state, zip_code, country, is_active, created_at, updated_at }`.

- [x] `GET /offices/active`
  - Purpose: active office options.
  - Used by: directory filters and employee forms.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of office responses.

- [x] `POST /offices`
  - Purpose: create office.
  - Used by: HR admin controls on `/offices`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ name, street_address, city, state?, zip_code?, country }`.
  - Response data: created office.

- [x] `PATCH /offices/{office_id}`
  - Purpose: update office fields.
  - Used by: HR admin controls on `/offices`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: any office fields; at least one field.
  - Response data: updated office.

- [x] `DELETE /offices/{office_id}`
  - Purpose: soft-delete/deactivate office if no employees are assigned.
  - Used by: HR admin controls on `/offices`.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Response data: deactivated office.
  - Notes: `409` if assigned to employees.

### Skills

- [x] `GET /skills`
  - Purpose: list skill catalog.
  - Used by: directory filters, profile skills, admin skill catalog.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `{ id, name, description, created_at, updated_at }`.

- [x] `GET /skills/search?name=...`
  - Purpose: skill autocomplete.
  - Used by: assign skill form if using typed search.
  - Auth: not currently enforced by route; frontend should still call through authenticated client for consistency.
  - Roles: route permits unauthenticated, but UI should expose only inside protected app.
  - Query: `name` min length 1.
  - Response data: up to 5 skill responses.

- [x] `GET /skills/employee/{employee_public_id}`
  - Purpose: fetch employee skills separately when needed.
  - Used by: `/employees/:id` if profile response skills are stale/missing.
  - Auth: bearer required.
  - Roles: `employee`, `manager`, `hr_admin`.
  - Response data: array of `{ skill_id, skill_name, description, proficiency }`.

- [x] `POST /skills`
  - Purpose: create skill.
  - Used by: HR admin skill catalog.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ name: string, description?: string | null }`.
  - Response data: created skill.

- [x] `PUT /skills/{skill_id}`
  - Purpose: update skill.
  - Used by: HR admin skill catalog.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Request: `{ name?: string | null, description?: string | null }`; at least one field.
  - Response data: updated skill.

- [x] `DELETE /skills/{skill_id}`
  - Purpose: delete skill if unassigned.
  - Used by: HR admin skill catalog.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Response data: `null`.
  - Notes: `409` if assigned to employees.

- [x] `POST /skills/assign`
  - Purpose: assign skill to employee.
  - Used by: manager/admin controls on employee detail.
  - Auth: bearer required.
  - Roles: dependency permits `manager` or `hr_admin`; service permits only HR admin or the employee's direct manager.
  - Request: `{ employee_public_id, skill_id?: int, skill_name?: string, proficiency }`; provide exactly one of `skill_id` or `skill_name`.
  - Response data: `{ employee_id, skill_id, proficiency }`.
  - Existing: used by `DirectoryPage`.

- [x] `PUT /skills/{employee_public_id}/proficiency/{skill_id}`
  - Purpose: update assigned skill proficiency.
  - Used by: manager/admin controls on employee detail.
  - Auth: bearer required.
  - Roles: HR admin or employee's direct manager.
  - Request: `{ proficiency }`.
  - Response data: `{ employee_id, skill_id, proficiency }`.

- [x] `DELETE /skills/{employee_public_id}/proficiency/{skill_id}`
  - Purpose: remove assigned skill.
  - Used by: manager/admin controls on employee detail.
  - Auth: bearer required.
  - Roles: HR admin or employee's direct manager.
  - Response data: `null`, status `204` wrapper.

### Audit Logs

- [x] `GET /audit-logs`
  - Purpose: HR admin audit trail for create/update/delete/profile/skill changes.
  - Used by: `/admin/audit-logs` or compact admin panel.
  - Auth: bearer required.
  - Roles: `hr_admin`.
  - Query: `page`, `page_size`.
  - Response data: `{ items, total, page, page_size }`; items include `id`, `actor_employee_id`, `target_type`, `target_id`, `action`, `old_values`, `new_values`, `created_at`.

## Routes And Pages

- [x] Login
  - Route: `/login`
  - Purpose: authenticate user.
  - Access: public only; authenticated users redirect to `/organization`.
  - APIs: `POST /auth/login`.
  - Components: `LoginPage`, `LoginForm`, `BrandLogo`.
  - States: local validation, submitting, invalid credentials, inactive account, network error.

- [x] Organization
  - Route: `/organization`
  - Purpose: default protected landing page and full org hierarchy.
  - Access: `employee`, `manager`, `hr_admin`.
  - APIs: `GET /employees/hierarchy`, optionally `GET /departments/active`, `GET /offices/active`, `GET /skills`.
  - Components: app shell, hierarchy graph/tree, employee cards, selected employee preview.
  - Actions: select employee, clear filters, open `/employees/:id`.
  - States: loading, empty hierarchy, error, unauthorized/session expired.
  - Existing: `HomePage` at `/home`; rename/remap.

- [x] Directory
  - Route: `/directory`
  - Purpose: search/filter paginated employee directory.
  - Access: `employee`, `manager`, `hr_admin`.
  - APIs: `GET /employees`, active departments/offices, `GET /skills`.
  - Components: filters, result list/table/cards, pagination, employee summary.
  - Actions: search, filter, clear filters, change page/page size, open `/employees/:id`.
  - States: loading, empty result, error, forbidden.
  - Existing: page exists but needs pagination and detail navigation.

- [x] Employee Detail
  - Route: `/employees/:id`
  - Purpose: complete profile, contact info, organization relationships, skills.
  - Access: `employee`, `manager`, `hr_admin`.
  - APIs: `GET /employees/{public_id}`, `GET /employees/{public_id}/manager`, `GET /employees/{public_id}/direct-reports`, optionally descendants/skills.
  - Components: profile header, contact panel, role/status badges, skill list, manager/direct report links.
  - Actions: navigate relationships; manager/admin edit permitted fields; admin activate/deactivate/assign manager; manager/admin manage skills where backend permits.
  - States: loading, not found, forbidden action, API error.

- [x] My Profile
  - Route: `/profile`
  - Purpose: view and edit logged-in employee's profile-safe fields.
  - Access: `employee`, `manager`, `hr_admin`.
  - APIs: `GET /employees/{current.public_id}` for full profile, `PATCH /employees/me`.
  - Components: view mode, edit form, save/cancel buttons.
  - Editable fields: `phone`, `street_address`, `city`, `state`, `zip_code`, `country`, `collaboration_status`, `work_mode`.
  - States: loading profile, validation, submitting, success, backend error.
  - Existing: `SettingsPage` at `/settings`; rename/remap.

- [x] Departments
  - Route: `/departments`
  - Purpose: view department catalog; HR admin create/edit/deactivate.
  - Access: read for all roles; write for `hr_admin`.
  - APIs: `GET /departments`, `POST /departments`, `PATCH /departments/{id}`, `DELETE /departments/{id}`.
  - Components: list/cards/table, inline form or modal, confirmation dialog.
  - States: loading, empty, error, `409` cannot delete assigned department.

- [x] Offices
  - Route: `/offices`
  - Purpose: view office catalog; HR admin create/edit/deactivate.
  - Access: read for all roles; write for `hr_admin`.
  - APIs: `GET /offices`, `POST /offices`, `PATCH /offices/{id}`, `DELETE /offices/{id}`.
  - Components: list/cards/table, form/modal, confirmation dialog.
  - States: loading, empty, error, `409` cannot delete assigned office.

- [x] Skills Catalog
  - Route: `/skills` or `/admin/skills`
  - Purpose: view skills; HR admin create/edit/delete catalog.
  - Access: read for all roles if kept as `/skills`; write for `hr_admin`.
  - APIs: `GET /skills`, `GET /skills/search`, `POST /skills`, `PUT /skills/{id}`, `DELETE /skills/{id}`.
  - Components: skill list, form/modal, delete confirmation.
  - States: loading, empty, error, `409` cannot delete assigned skill.

- [x] Admin Audit Logs
  - Route: `/admin/audit-logs`
  - Purpose: inspect backend audit trail.
  - Access: `hr_admin`.
  - APIs: `GET /audit-logs`.
  - Components: paginated table, JSON change summary renderer.
  - States: loading, empty, error, forbidden.

- [x] Forbidden
  - Route: can be reusable state or `/403`.
  - Purpose: friendly permission message.
  - Access: shown when backend returns `403` or user visits HR admin route without role.
  - APIs: none.

- [x] Not Found
  - Route: fallback `*`.
  - Purpose: simple 404 with link to `/organization`.
  - Access: all.
  - APIs: none.

## Authentication Flow

- [x] User visits app.
- [x] If no stored `accessToken` and no usable `refreshToken`, redirect to `/login`.
- [x] If stored tokens exist, restore auth state from localStorage.
- [x] Fetch full current user with `GET /employees/{employee.public_id}` after restore/login so app has name, department, office, and profile fields.
- [x] User submits `/login` with `{ email, password }`.
- [x] Call `POST /auth/login`.
- [x] Store `access_token`, `refresh_token`, `token_type`, `expires_in`, `refresh_token_expires_at`, and `employee`.
- [x] Redirect successful login to `/organization`.
- [x] If authenticated user opens `/login`, redirect to `/organization`.
- [x] On logout, call `POST /auth/logout` with the stored refresh token, then clear tokens and current user and redirect to `/login`.
- [x] If logout API fails or token is missing, still clear local auth so the user exits the session.

## Refresh Token Flow

- [x] Add `refreshEmployeeTokens({ refresh_token })` to `authApi`.
- [x] Add an Axios response interceptor in `apiClient`.
- [x] Request interceptor attaches `Authorization: Bearer ${accessToken}` for protected requests.
- [x] If protected request succeeds, return normally.
- [x] On `401` from non-refresh request, attempt `POST /auth/refresh`.
- [x] Refresh request must not trigger refresh again.
- [x] Original request must retry at most once, using a private `_retry` flag.
- [x] If refresh succeeds, save new `access_token`, new rotated `refresh_token`, `token_type`, `expires_in`, `refresh_token_expires_at`, and `employee`.
- [x] Retry original request once and return response.
- [x] If refresh fails with `401` or `403`, clear auth state and redirect to `/login`.
- [x] If multiple requests fail together, use one shared `refreshPromise`; queue/replay requests after it resolves.
- [x] Avoid refresh loops for login, refresh, and already-retried requests.
- [x] Treat inactive employee `403` during refresh/authenticated calls as forced logout.

## Protected Routes

- [x] Add routing support. Prefer installing `react-router-dom` only if approved/acceptable; otherwise keep a small custom router but implement history-safe navigation.
- [x] Protect `/organization`, `/directory`, `/profile`, `/departments`, `/offices`, `/skills`, dynamic `/employees/:id`, and `/admin/*`.
- [x] Redirect unauthenticated protected access to `/login`.
- [x] Redirect authenticated `/login` access to `/organization`.
- [x] Gate `/admin/audit-logs` and HR admin write controls to `hr_admin`.
- [x] Hide manager/admin action controls when the current user cannot perform them.
- [x] Remember: frontend role checks are UX only; backend is the security boundary.

## Role Permissions Matrix

| Feature | employee | manager | hr_admin |
| --- | --- | --- | --- |
| Login when active | [x] Yes | [x] Yes | [x] Yes |
| View employee directory | [x] Yes | [x] Yes | [x] Yes |
| View organization hierarchy | [x] Yes | [x] Yes | [x] Yes |
| View employee profile by public id | [x] Yes | [x] Yes | [x] Yes |
| View manager/direct reports/descendants endpoints | [x] Yes | [x] Yes | [x] Yes |
| Update own safe profile fields | [x] Yes | [x] Yes | [x] Yes |
| Update descendant safe profile fields | [ ] No | [x] Yes, descendants only | [ ] No via manager endpoint |
| Create employee | [ ] No | [ ] No | [x] Yes |
| Update employee admin fields | [ ] No | [ ] No | [x] Yes |
| Activate/deactivate employee | [ ] No | [ ] No | [x] Yes |
| Assign employee manager | [ ] No | [ ] No | [x] Yes |
| View departments | [x] Yes | [x] Yes | [x] Yes |
| Create/update/deactivate departments | [ ] No | [ ] No | [x] Yes |
| View offices | [x] Yes | [x] Yes | [x] Yes |
| Create/update/deactivate offices | [ ] No | [ ] No | [x] Yes |
| View skills | [x] Yes | [x] Yes | [x] Yes |
| Create/update/delete skill catalog | [ ] No | [ ] No | [x] Yes |
| Assign/update/remove employee skills | [ ] No | [x] Direct reports only | [x] Yes |
| View audit logs | [ ] No | [ ] No | [x] Yes |

## Global Layout TODO

- [x] Reuse `AppShell`, but align nav to final routes.
- [x] Navigation items: Organization, Directory, Departments, Offices, Skills, My Profile.
- [x] Show Admin/Audit only for `hr_admin`.
- [x] Mobile: collapse sidebar into top/menu drawer.
- [x] Top bar: current employee name, role, logout.
- [x] Use links/navigation instead of raw `window.location` where router supports it.
  - Current router is custom path switching, so layout navigation uses normal anchors.
- [x] Remove or hide `Analytics` and `Help` unless intentionally kept after core flows are complete.

## Global API Error Handling

- [x] Centralize `getApiError` logic around backend wrapper `msg` and validation `data`.
- [x] `400`: show concise form/page error from `msg`.
- [x] `401`: refresh when appropriate; if refresh fails, logout and redirect.
- [x] `403`: show permission-denied state; logout only for inactive account/session invalid cases.
- [x] `404`: show not-found page or entity-specific empty state.
- [x] `409`: show conflict near destructive/admin action, e.g. assigned department/office/skill cannot be deleted.
- [x] `422`: map Pydantic validation `data` errors to fields where possible.
- [x] `500+` and network errors: show clean retry message.
- [x] Do not use `alert()`.
- [x] Do not show raw backend objects or stack traces.

## Business Requirements Coverage

- [x] Employee can authenticate.
  - Backend: `POST /auth/login`
  - Frontend: `/login`
  - Role: all active accounts
  - Implementation needed: none.

- [x] Employee session can refresh without disruption.
  - Backend: `POST /auth/refresh`
  - Frontend: Axios/auth state
  - Role: all active accounts
  - Implementation needed: none.

- [x] Employee can view organization hierarchy.
  - Backend: `GET /employees/hierarchy`
  - Frontend: `/organization`
  - Role: all
  - Implementation needed: none for core employee/organization flow.

- [x] Employee can search/filter directory.
  - Backend: `GET /employees`
  - Frontend: `/directory`
  - Role: all
  - Implementation needed: none.

- [x] Employee can view detailed profile and relationships.
  - Backend: `GET /employees/{id}`, `/manager`, `/direct-reports`, `/descendants`
  - Frontend: `/employees/:id`
  - Role: all
  - Implementation needed: none for read-only profile/relationship flow.

- [x] Employee can update own safe profile fields.
  - Backend: `PATCH /employees/me`
  - Frontend: `/profile`
  - Role: all
  - Implementation needed: none.

- [x] Manager can update safe fields for reporting descendants.
  - Backend: `PATCH /employees/{id}/profile`
  - Frontend: `/employees/:id`
  - Role: `manager`
  - Implementation needed: none.

- [x] HR admin can create/update employees.
  - Backend: `POST /admin/employees`, `PATCH /employees/{id}`
  - Frontend: admin controls in `/directory` or `/employees/:id`
  - Role: `hr_admin`
  - Implementation needed: none.

- [x] HR admin can activate/deactivate employees.
  - Backend: `PATCH /employees/{id}/activate`, `/deactivate`
  - Frontend: admin employee controls
  - Role: `hr_admin`
  - Implementation needed: none.

- [x] HR admin can assign managers.
  - Backend: `PATCH /employees/{id}/manager`
  - Frontend: admin employee form
  - Role: `hr_admin`
  - Implementation needed: none.

- [x] Employees can view departments/offices/skills.
  - Backend: `GET /departments`, `GET /offices`, `GET /skills`
  - Frontend: catalog pages and filters
  - Role: all
  - Implementation needed: none.

- [x] HR admin can manage departments/offices/skills.
  - Backend: department/office/skill create/update/delete endpoints
  - Frontend: `/departments`, `/offices`, `/skills`
  - Role: `hr_admin`
  - Implementation needed: none for catalog management.

- [x] Manager or HR admin can assign employee skills.
  - Backend: `POST /skills/assign`
  - Frontend: employee detail or directory side panel
  - Role: `manager` direct manager only, `hr_admin`
  - Implementation needed: hide for managers unless selected employee is direct report; show `403` gracefully.

- [x] Manager or HR admin can update/remove employee skills.
  - Backend: `PUT /skills/{employee_public_id}/proficiency/{skill_id}`, `DELETE /skills/{employee_public_id}/proficiency/{skill_id}`
  - Frontend: employee skill controls
  - Role: `manager` direct manager only, `hr_admin`
  - Implementation needed: controls and confirmation.

- [x] HR admin can view audit logs.
  - Backend: `GET /audit-logs`
  - Frontend: `/admin/audit-logs`
  - Role: `hr_admin`
  - Implementation needed: none.

## Implementation Order

### Phase 1 - Foundation

- [ ] Choose final route strategy.
- [ ] Add protected/public route handling.
- [x] Rename `/home` flow to `/organization`.
- [x] Rename `/settings` flow to `/profile`.
- [x] Add fallback 404 route/page.
- [ ] Update app shell navigation and mobile navigation.
- [ ] Centralize route constants and role helpers.

### Phase 2 - Authentication

- [x] Add `POST /auth/refresh` helper.
- [x] Implement Axios response interceptor.
- [x] Implement single-flight refresh queue.
- [x] Store rotated tokens after refresh.
- [ ] Restore session on app load.
- [ ] Fetch full current employee after login/restore.
- [ ] Redirect authenticated `/login` to `/organization`.
- [ ] Logout clears local auth and current-user state.

### Phase 3 - Core Employee Experience

- [x] Finish `/organization` hierarchy page.
- [x] Make employee cards link to `/employees/:id`.
- [x] Finish `/directory` with backend pagination.
- [x] Add clear filters and page-size controls.
- [x] Build `/employees/:id` detail page.
- [ ] Build `/profile` view/edit flow.

### Phase 4 - Organization Data

- [ ] Use active departments/offices in filters/forms where inactive choices should not be assignable.
- [x] Finish `/departments` read/admin management.
- [x] Finish `/offices` read/admin management.
- [x] Finish skills catalog route or admin area.
- [x] Integrate skill display and skill management into employee profiles.

### Phase 5 - Role Functionality

- [ ] HR admin employee create/edit/activate/deactivate.
- [ ] HR admin manager assignment.
- [ ] Manager descendant profile editing.
- [x] Manager/direct-manager skill assignment/update/remove.
- [x] HR admin audit logs.
- [ ] Hide/disable controls based on role and relationship.

### Phase 6 - Application Reliability

- [ ] Loading states on every API page.
- [ ] Empty states on every list.
- [ ] Error states on every page/form.
- [x] 403 permission state.
- [x] 404 entity/page state.
- [ ] Refresh failure/session-expired path.
- [ ] Network/server unavailable handling.
- [ ] Responsive desktop/tablet/mobile QA.

### Phase 7 - Final Verification

- [ ] Employee role: login, organization, directory, employee profile, own profile edit, logout.
- [ ] Manager role: employee flow plus descendant profile edit and direct-report skill changes.
- [ ] HR admin role: employee CRUD, activate/deactivate, manager assignment, departments, offices, skills, audit logs.
- [ ] Login -> app -> authenticated API -> logout.
- [ ] Expired access token refresh test.
- [ ] Expired/invalid refresh token logout test.
- [ ] Inactive employee login/refresh/access test.
- [ ] Unauthorized protected route redirects to `/login`.
- [x] Forbidden admin route shows 403.
- [x] Unknown route shows 404.
- [ ] Mobile navigation and forms remain usable.
- [ ] `npm run build`.
- [ ] `npm run lint`.
