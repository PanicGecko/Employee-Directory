from unittest.mock import Mock


EMPLOYEE_ID = "11111111-1111-1111-1111-111111111111"
MANAGER_ID = "22222222-2222-2222-2222-222222222222"


class Dumpable:
    def __init__(self, data):
        self.data = data

    def model_dump(self, mode="json"):
        return self.data


def assert_wrapped_response(response, status_code, msg, data):
    assert response.status_code == status_code
    assert response.json() == {
        "status_code": status_code,
        "msg": msg,
        "data": data,
    }


def test_login_returns_tokens(client, monkeypatch):
    from routers import authRouter

    service = Mock(return_value={"access_token": "access", "refresh_token": "refresh"})
    monkeypatch.setattr(authRouter, "login_employee", service)

    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "secret"},
    )

    assert_wrapped_response(
        response,
        200,
        "Login successful",
        {"access_token": "access", "refresh_token": "refresh"},
    )
    service.assert_called_once()


def test_refresh_returns_tokens(client, monkeypatch):
    from routers import authRouter

    service = Mock(return_value={"access_token": "new-access", "refresh_token": "new-refresh"})
    monkeypatch.setattr(authRouter, "refresh_employee_tokens", service)

    response = client.post("/auth/refresh", json={"refresh_token": "refresh"})

    assert_wrapped_response(
        response,
        200,
        "Tokens refreshed successfully",
        {"access_token": "new-access", "refresh_token": "new-refresh"},
    )
    service.assert_called_once()


def test_logout_returns_success(client, monkeypatch):
    from routers import authRouter

    service = Mock(return_value=None)
    monkeypatch.setattr(authRouter, "logout_employee", service)

    response = client.post("/auth/logout", json={"refresh_token": "refresh"})

    assert_wrapped_response(response, 200, "Logged out successfully", None)
    service.assert_called_once()


def test_admin_create_employee_returns_created_employee(client, monkeypatch):
    from routers import adminRouter

    employee = {"public_id": EMPLOYEE_ID, "first_name": "Ada", "email": "ada@example.com"}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(adminRouter, "create_employee_service", service)

    response = client.post(
        "/admin/employees",
        json={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "password": "secret",
            "role": "employee",
            "collaboration_status": "open",
            "work_mode": "remote",
        },
    )

    assert_wrapped_response(response, 201, "Employee created successfully", employee)
    service.assert_called_once()


def test_list_departments_returns_departments(client, monkeypatch):
    from routers import departmentRouter

    departments = [{"id": 1, "name": "Engineering", "is_active": True}]
    service = Mock(return_value=[Dumpable(departments[0])])
    monkeypatch.setattr(departmentRouter, "list_departments_service", service)

    response = client.get("/departments")

    assert_wrapped_response(response, 200, "Departments retrieved successfully", departments)
    service.assert_called_once()


def test_list_active_departments_returns_active_departments(client, monkeypatch):
    from routers import departmentRouter

    departments = [{"id": 1, "name": "Engineering", "is_active": True}]
    service = Mock(return_value=[Dumpable(departments[0])])
    monkeypatch.setattr(departmentRouter, "list_active_departments_service", service)

    response = client.get("/departments/active")

    assert_wrapped_response(response, 200, "Active departments retrieved successfully", departments)
    service.assert_called_once()


def test_create_department_returns_created_department(client, monkeypatch):
    from routers import departmentRouter

    department = {"id": 1, "name": "Engineering", "is_active": True}
    service = Mock(return_value=Dumpable(department))
    monkeypatch.setattr(departmentRouter, "create_department_service", service)

    response = client.post("/departments", json={"name": "Engineering", "description": "Product"})

    assert_wrapped_response(response, 201, "Department created successfully", department)
    service.assert_called_once()


def test_update_department_returns_updated_department(client, monkeypatch):
    from routers import departmentRouter

    department = {"id": 1, "name": "People", "is_active": True}
    service = Mock(return_value=Dumpable(department))
    monkeypatch.setattr(departmentRouter, "update_department_service", service)

    response = client.patch("/departments/1", json={"name": "People"})

    assert_wrapped_response(response, 200, "Department updated successfully", department)
    service.assert_called_once()


def test_delete_department_returns_deleted_department(client, monkeypatch):
    from routers import departmentRouter

    department = {"id": 1, "name": "Engineering", "is_active": False}
    service = Mock(return_value=Dumpable(department))
    monkeypatch.setattr(departmentRouter, "delete_department_service", service)

    response = client.delete("/departments/1")

    assert_wrapped_response(response, 200, "Department deleted successfully", department)
    service.assert_called_once()


def test_reactivate_department_returns_reactivated_department(client, monkeypatch):
    from routers import departmentRouter

    department = {"id": 1, "name": "Engineering", "is_active": True}
    service = Mock(return_value=Dumpable(department))
    monkeypatch.setattr(departmentRouter, "reactivate_department_service", service)

    response = client.patch("/departments/1/activate")

    assert_wrapped_response(response, 200, "Department reactivated successfully", department)
    service.assert_called_once()


def test_list_offices_returns_offices(client, monkeypatch):
    from routers import officeRouter

    offices = [{"id": 1, "name": "New York", "is_active": True}]
    service = Mock(return_value=[Dumpable(offices[0])])
    monkeypatch.setattr(officeRouter, "list_offices_service", service)

    response = client.get("/offices")

    assert_wrapped_response(response, 200, "Offices retrieved successfully", offices)
    service.assert_called_once()


def test_list_active_offices_returns_active_offices(client, monkeypatch):
    from routers import officeRouter

    offices = [{"id": 1, "name": "New York", "is_active": True}]
    service = Mock(return_value=[Dumpable(offices[0])])
    monkeypatch.setattr(officeRouter, "list_active_offices_service", service)

    response = client.get("/offices/active")

    assert_wrapped_response(response, 200, "Active offices retrieved successfully", offices)
    service.assert_called_once()


def test_create_office_returns_created_office(client, monkeypatch):
    from routers import officeRouter

    office = {"id": 1, "name": "New York", "is_active": True}
    service = Mock(return_value=Dumpable(office))
    monkeypatch.setattr(officeRouter, "create_office_service", service)

    response = client.post(
        "/offices",
        json={
            "name": "New York",
            "street_address": "1 Main St",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "country": "US",
        },
    )

    assert_wrapped_response(response, 201, "Office created successfully", office)
    service.assert_called_once()


def test_update_office_returns_updated_office(client, monkeypatch):
    from routers import officeRouter

    office = {"id": 1, "name": "Boston", "is_active": True}
    service = Mock(return_value=Dumpable(office))
    monkeypatch.setattr(officeRouter, "update_office_service", service)

    response = client.patch("/offices/1", json={"name": "Boston"})

    assert_wrapped_response(response, 200, "Office updated successfully", office)
    service.assert_called_once()


def test_delete_office_returns_deleted_office(client, monkeypatch):
    from routers import officeRouter

    office = {"id": 1, "name": "New York", "is_active": False}
    service = Mock(return_value=Dumpable(office))
    monkeypatch.setattr(officeRouter, "delete_office_service", service)

    response = client.delete("/offices/1")

    assert_wrapped_response(response, 200, "Office deleted successfully", office)
    service.assert_called_once()


def test_reactivate_office_returns_reactivated_office(client, monkeypatch):
    from routers import officeRouter

    office = {"id": 1, "name": "New York", "is_active": True}
    service = Mock(return_value=Dumpable(office))
    monkeypatch.setattr(officeRouter, "reactivate_office_service", service)

    response = client.patch("/offices/1/activate")

    assert_wrapped_response(response, 200, "Office reactivated successfully", office)
    service.assert_called_once()


def test_list_skills_returns_skills(client, monkeypatch):
    from routers import skillRouter

    skills = [{"id": 1, "name": "Python"}]
    service = Mock(return_value=[Dumpable(skills[0])])
    monkeypatch.setattr(skillRouter, "list_skills_service", service)

    response = client.get("/skills")

    assert_wrapped_response(response, 200, "Skills retrieved successfully", skills)
    service.assert_called_once()


def test_search_skills_returns_matching_skills(client, monkeypatch):
    from routers import skillRouter

    skills = [{"id": 1, "name": "Python"}]
    service = Mock(return_value=[Dumpable(skills[0])])
    monkeypatch.setattr(skillRouter, "search_skills_service", service)

    response = client.get("/skills/search", params={"name": "py"})

    assert_wrapped_response(response, 200, "Skills retrieved successfully", skills)
    service.assert_called_once()


def test_get_employee_skills_returns_employee_skills(client, monkeypatch):
    from routers import skillRouter

    employee_skills = [{"skill_id": 1, "skill_name": "Python", "proficiency": "advanced"}]
    service = Mock(return_value=[Dumpable(employee_skills[0])])
    monkeypatch.setattr(skillRouter, "get_employee_skills_service", service)

    response = client.get(f"/skills/employee/{EMPLOYEE_ID}")

    assert_wrapped_response(
        response,
        200,
        "Employee skills retrieved successfully",
        employee_skills,
    )
    service.assert_called_once()


def test_create_skill_returns_created_skill(client, monkeypatch):
    from routers import skillRouter

    skill = {"id": 1, "name": "Python"}
    service = Mock(return_value=Dumpable(skill))
    monkeypatch.setattr(skillRouter, "create_skill_service", service)

    response = client.post("/skills", json={"name": "Python", "description": "Language"})

    assert_wrapped_response(response, 201, "Skill created successfully", skill)
    service.assert_called_once()


def test_update_skill_returns_updated_skill(client, monkeypatch):
    from routers import skillRouter

    skill = {"id": 1, "name": "TypeScript"}
    service = Mock(return_value=Dumpable(skill))
    monkeypatch.setattr(skillRouter, "update_skill_service", service)

    response = client.put("/skills/1", json={"name": "TypeScript"})

    assert_wrapped_response(response, 200, "Skill updated successfully", skill)
    service.assert_called_once()


def test_delete_skill_returns_success(client, monkeypatch):
    from routers import skillRouter

    service = Mock(return_value=None)
    monkeypatch.setattr(skillRouter, "delete_skill_service", service)

    response = client.delete("/skills/1")

    assert_wrapped_response(response, 200, "Skill deleted successfully", None)
    service.assert_called_once()


def test_assign_skill_returns_assignment_result(client, monkeypatch):
    from routers import skillRouter

    result = {"employee_public_id": EMPLOYEE_ID, "skill_id": 1, "proficiency": "advanced"}
    service = Mock(return_value=result)
    monkeypatch.setattr(skillRouter, "assign_skill_service", service)

    response = client.post(
        "/skills/assign",
        json={"employee_public_id": EMPLOYEE_ID, "skill_id": 1, "proficiency": "advanced"},
    )

    assert_wrapped_response(response, 201, "Skill assigned to employee successfully", result)
    service.assert_called_once()


def test_update_skill_proficiency_returns_updated_result(client, monkeypatch):
    from routers import skillRouter

    result = {"employee_public_id": EMPLOYEE_ID, "skill_id": 1, "proficiency": "expert"}
    service = Mock(return_value=result)
    monkeypatch.setattr(skillRouter, "update_skill_proficiency_service", service)

    response = client.put(
        f"/skills/{EMPLOYEE_ID}/proficiency/1",
        json={"proficiency": "expert"},
    )

    assert_wrapped_response(response, 200, "Skill proficiency updated successfully", result)
    service.assert_called_once()


def test_remove_skill_from_employee_returns_no_content_status(client, monkeypatch):
    from routers import skillRouter

    service = Mock(return_value=None)
    monkeypatch.setattr(skillRouter, "remove_skill_from_employee_service", service)

    response = client.delete(f"/skills/{EMPLOYEE_ID}/proficiency/1")

    assert response.status_code == 204
    service.assert_called_once()


def test_list_employees_returns_paginated_employees(client, monkeypatch):
    from routers import employeeRouter

    result = {"items": [{"public_id": EMPLOYEE_ID, "first_name": "Ada"}], "total": 1, "page": 1, "page_size": 20}
    service = Mock(return_value=Dumpable(result))
    monkeypatch.setattr(employeeRouter, "list_employees_service", service)

    response = client.get("/employees")

    assert_wrapped_response(response, 200, "Employees retrieved successfully", result)
    service.assert_called_once()


def test_get_employee_hierarchy_returns_hierarchy(client, monkeypatch):
    from routers import employeeRouter

    hierarchy = [{"employee": {"public_id": EMPLOYEE_ID}, "direct_reports": []}]
    service = Mock(return_value=[Dumpable(hierarchy[0])])
    monkeypatch.setattr(employeeRouter, "get_full_hierarchy_service", service)

    response = client.get("/employees/hierarchy")

    assert_wrapped_response(response, 200, "Employee hierarchy retrieved successfully", hierarchy)
    service.assert_called_once()


def test_update_own_profile_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "phone": "555-0100"}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "update_own_profile_service", service)

    response = client.patch("/employees/me", json={"phone": "555-0100"})

    assert_wrapped_response(response, 200, "Employee profile updated successfully", employee)
    service.assert_called_once()


def test_update_subordinate_profile_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "city": "New York"}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "update_subordinate_profile_service", service)

    response = client.patch(f"/employees/{EMPLOYEE_ID}/profile", json={"city": "New York"})

    assert_wrapped_response(response, 200, "Employee profile updated successfully", employee)
    service.assert_called_once()


def test_activate_employee_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "is_active": True}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "activate_employee_service", service)

    response = client.patch(f"/employees/{EMPLOYEE_ID}/activate")

    assert_wrapped_response(response, 200, "Employee activated successfully", employee)
    service.assert_called_once()


def test_deactivate_employee_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "is_active": False}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "deactivate_employee_service", service)

    response = client.patch(f"/employees/{EMPLOYEE_ID}/deactivate")

    assert_wrapped_response(response, 200, "Employee deactivated successfully", employee)
    service.assert_called_once()


def test_update_employee_as_admin_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "first_name": "Grace"}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "update_employee_as_admin_service", service)

    response = client.patch(f"/employees/{EMPLOYEE_ID}", json={"first_name": "Grace"})

    assert_wrapped_response(response, 200, "Employee updated successfully", employee)
    service.assert_called_once()


def test_get_employee_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "first_name": "Ada"}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "get_employee_by_public_id_service", service)

    response = client.get(f"/employees/{EMPLOYEE_ID}")

    assert_wrapped_response(response, 200, "Employee retrieved successfully", employee)
    service.assert_called_once()


def test_get_employee_manager_returns_manager(client, monkeypatch):
    from routers import employeeRouter

    manager = {"public_id": MANAGER_ID, "first_name": "Grace"}
    service = Mock(return_value=Dumpable(manager))
    monkeypatch.setattr(employeeRouter, "get_employee_manager_service", service)

    response = client.get(f"/employees/{EMPLOYEE_ID}/manager")

    assert_wrapped_response(response, 200, "Employee manager retrieved successfully", manager)
    service.assert_called_once()


def test_assign_employee_manager_returns_employee(client, monkeypatch):
    from routers import employeeRouter

    employee = {"public_id": EMPLOYEE_ID, "manager_public_id": MANAGER_ID}
    service = Mock(return_value=Dumpable(employee))
    monkeypatch.setattr(employeeRouter, "assign_employee_manager_service", service)

    response = client.patch(
        f"/employees/{EMPLOYEE_ID}/manager",
        json={"manager_public_id": MANAGER_ID},
    )

    assert_wrapped_response(response, 200, "Employee manager assigned successfully", employee)
    service.assert_called_once()


def test_get_employee_direct_reports_returns_reports(client, monkeypatch):
    from routers import employeeRouter

    reports = [{"public_id": MANAGER_ID, "first_name": "Grace"}]
    service = Mock(return_value=[Dumpable(reports[0])])
    monkeypatch.setattr(employeeRouter, "get_direct_reports_service", service)

    response = client.get(f"/employees/{EMPLOYEE_ID}/direct-reports")

    assert_wrapped_response(response, 200, "Direct reports retrieved successfully", reports)
    service.assert_called_once()


def test_get_employee_descendants_returns_descendants(client, monkeypatch):
    from routers import employeeRouter

    descendants = [{"public_id": MANAGER_ID, "first_name": "Grace"}]
    service = Mock(return_value=[Dumpable(descendants[0])])
    monkeypatch.setattr(employeeRouter, "get_all_descendants_service", service)

    response = client.get(f"/employees/{EMPLOYEE_ID}/descendants")

    assert_wrapped_response(response, 200, "Employee descendants retrieved successfully", descendants)
    service.assert_called_once()


def test_list_audit_logs_returns_paginated_audit_logs(client, monkeypatch):
    from routers import auditRouter

    result = {"items": [{"id": 1, "action": "create"}], "total": 1, "page": 1, "page_size": 20}
    service = Mock(return_value=Dumpable(result))
    monkeypatch.setattr(auditRouter, "list_audit_logs_service", service)

    response = client.get("/audit-logs")

    assert_wrapped_response(response, 200, "Audit logs retrieved successfully", result)
    service.assert_called_once()


def assert_validation_error(response):
    body = response.json()
    assert response.status_code == 422
    assert body["status_code"] == 422
    assert body["msg"] == "Validation failed"
    assert isinstance(body["data"], list)
    assert body["data"]


def test_list_departments_requires_authentication(unauthenticated_client, monkeypatch):
    from routers import departmentRouter

    service = Mock()
    monkeypatch.setattr(departmentRouter, "list_departments_service", service)

    response = unauthenticated_client.get("/departments")

    assert_wrapped_response(response, 401, "Authentication required", None)
    service.assert_not_called()


def test_create_department_forbids_regular_employee(employee_client, monkeypatch):
    from routers import departmentRouter

    service = Mock()
    monkeypatch.setattr(departmentRouter, "create_department_service", service)

    response = employee_client.post("/departments", json={"name": "Engineering"})

    assert_wrapped_response(response, 403, "HR Admin access required", None)
    service.assert_not_called()


def test_audit_logs_forbid_regular_employee(employee_client, monkeypatch):
    from routers import auditRouter

    service = Mock()
    monkeypatch.setattr(auditRouter, "list_audit_logs_service", service)

    response = employee_client.get("/audit-logs")

    assert_wrapped_response(response, 403, "HR Admin access required", None)
    service.assert_not_called()


def test_assign_skill_forbids_regular_employee(employee_client, monkeypatch):
    from routers import skillRouter

    service = Mock()
    monkeypatch.setattr(skillRouter, "assign_skill_service", service)

    response = employee_client.post(
        "/skills/assign",
        json={"employee_public_id": EMPLOYEE_ID, "skill_id": 1, "proficiency": "advanced"},
    )

    assert_wrapped_response(response, 403, "Manager or Admin access required", None)
    service.assert_not_called()


def test_search_skills_requires_name_query(client, monkeypatch):
    from routers import skillRouter

    service = Mock()
    monkeypatch.setattr(skillRouter, "search_skills_service", service)

    response = client.get("/skills/search")

    assert_validation_error(response)
    service.assert_not_called()


def test_search_skills_rejects_empty_name(client, monkeypatch):
    from routers import skillRouter

    service = Mock()
    monkeypatch.setattr(skillRouter, "search_skills_service", service)

    response = client.get("/skills/search", params={"name": ""})

    assert_validation_error(response)
    service.assert_not_called()


def test_create_office_requires_required_fields(client, monkeypatch):
    from routers import officeRouter

    service = Mock()
    monkeypatch.setattr(officeRouter, "create_office_service", service)

    response = client.post("/offices", json={"name": "New York"})

    assert_validation_error(response)
    service.assert_not_called()


def test_admin_create_employee_rejects_invalid_email(client, monkeypatch):
    from routers import adminRouter

    service = Mock()
    monkeypatch.setattr(adminRouter, "create_employee_service", service)

    response = client.post(
        "/admin/employees",
        json={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "not-an-email",
            "password": "secret",
        },
    )

    assert_validation_error(response)
    service.assert_not_called()


def test_list_employees_rejects_page_zero(client, monkeypatch):
    from routers import employeeRouter

    service = Mock()
    monkeypatch.setattr(employeeRouter, "list_employees_service", service)

    response = client.get("/employees", params={"page": 0})

    assert_validation_error(response)
    service.assert_not_called()


def test_list_employees_rejects_page_size_over_limit(client, monkeypatch):
    from routers import employeeRouter

    service = Mock()
    monkeypatch.setattr(employeeRouter, "list_employees_service", service)

    response = client.get("/employees", params={"page_size": 101})

    assert_validation_error(response)
    service.assert_not_called()


def test_list_employees_rejects_invalid_work_mode(client, monkeypatch):
    from routers import employeeRouter

    service = Mock()
    monkeypatch.setattr(employeeRouter, "list_employees_service", service)

    response = client.get("/employees", params={"work_mode": "spaceship"})

    assert_validation_error(response)
    service.assert_not_called()


def test_get_employee_rejects_invalid_uuid(client, monkeypatch):
    from routers import employeeRouter

    service = Mock()
    monkeypatch.setattr(employeeRouter, "get_employee_by_public_id_service", service)

    response = client.get("/employees/not-a-uuid")

    assert_validation_error(response)
    service.assert_not_called()


def test_assign_employee_manager_rejects_invalid_manager_uuid(client, monkeypatch):
    from routers import employeeRouter

    service = Mock()
    monkeypatch.setattr(employeeRouter, "assign_employee_manager_service", service)

    response = client.patch(
        f"/employees/{EMPLOYEE_ID}/manager",
        json={"manager_public_id": "not-a-uuid"},
    )

    assert_validation_error(response)
    service.assert_not_called()


def test_update_skill_proficiency_rejects_invalid_proficiency(client, monkeypatch):
    from routers import skillRouter

    service = Mock()
    monkeypatch.setattr(skillRouter, "update_skill_proficiency_service", service)

    response = client.put(
        f"/skills/{EMPLOYEE_ID}/proficiency/1",
        json={"proficiency": "legendary"},
    )

    assert_validation_error(response)
    service.assert_not_called()


def test_create_skill_requires_name(client, monkeypatch):
    from routers import skillRouter

    service = Mock()
    monkeypatch.setattr(skillRouter, "create_skill_service", service)

    response = client.post("/skills", json={"description": "Language"})

    assert_validation_error(response)
    service.assert_not_called()
