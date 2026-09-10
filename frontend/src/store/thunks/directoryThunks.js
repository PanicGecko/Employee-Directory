import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  reactivateDepartment,
  updateDepartment,
} from '../../apis/departmentsApi'
import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  listEmployees,
  updateEmployee,
  updateOwnProfile,
  updateSubordinateProfile,
} from '../../apis/employeesApi'
import {
  createOffice,
  deleteOffice,
  listOffices,
  reactivateOffice,
  updateOffice,
} from '../../apis/officesApi'
import {
  assignSkill,
  createSkill,
  deleteSkill,
  listSkills,
  updateSkill,
  updateSkillProficiency,
} from '../../apis/skillsApi'
import {
  departmentsFailed,
  departmentsStarted,
  departmentsSucceeded,
  employeesFailed,
  employeesStarted,
  employeesSucceeded,
  officesFailed,
  officesStarted,
  officesSucceeded,
  skillsFailed,
  skillsStarted,
  skillsSucceeded,
} from '../directorySlice'
import { getApiErrorMessage } from '../../utils/apiError'

export function loadEmployees(params = {}) {
  return async (dispatch) => {
    dispatch(employeesStarted())

    try {
      const data = await listEmployees(params)
      dispatch(employeesSucceeded(data))

      return { ok: true, data }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to load employees.')
      dispatch(employeesFailed(message))

      return { ok: false, error: message }
    }
  }
}

export function saveEmployee(publicId, profile, params = {}) {
  return async (dispatch) => {
    try {
      const data = await updateEmployee(publicId, profile)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update employee.'),
      }
    }
  }
}

export function saveSubordinateProfile(publicId, profile, params = {}) {
  return async (dispatch) => {
    try {
      const data = await updateSubordinateProfile(publicId, profile)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update employee profile.'),
      }
    }
  }
}

export function saveOwnProfile(profile) {
  return async () => {
    try {
      const data = await updateOwnProfile(profile)

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update your profile.'),
      }
    }
  }
}

export function addEmployee(employee, params = {}) {
  return async (dispatch) => {
    try {
      const data = await createEmployee(employee)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to create employee.'),
      }
    }
  }
}

export function setEmployeeActive(publicId, isActive, params = {}) {
  return async (dispatch) => {
    try {
      const data = isActive
        ? await activateEmployee(publicId)
        : await deactivateEmployee(publicId)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update employee status.'),
      }
    }
  }
}

export function loadDepartments() {
  return async (dispatch) => {
    dispatch(departmentsStarted())

    try {
      const data = await listDepartments()
      dispatch(departmentsSucceeded(data))

      return { ok: true, data }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to load departments.')
      dispatch(departmentsFailed(message))

      return { ok: false, error: message }
    }
  }
}

export function saveDepartment(department, departmentId = null) {
  return async (dispatch) => {
    try {
      const data = departmentId
        ? await updateDepartment(departmentId, department)
        : await createDepartment(department)
      await dispatch(loadDepartments())

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to save department.'),
      }
    }
  }
}

export function removeDepartment(departmentId) {
  return async (dispatch) => {
    try {
      const data = await deleteDepartment(departmentId)
      await dispatch(loadDepartments())

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to delete department.'),
      }
    }
  }
}

export function setDepartmentActive(departmentId, isActive) {
  return async (dispatch) => {
    try {
      const data = isActive
        ? await reactivateDepartment(departmentId)
        : await deleteDepartment(departmentId)
      await dispatch(loadDepartments())

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update department status.'),
      }
    }
  }
}

export function loadOffices() {
  return async (dispatch) => {
    dispatch(officesStarted())

    try {
      const data = await listOffices()
      dispatch(officesSucceeded(data))

      return { ok: true, data }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to load offices.')
      dispatch(officesFailed(message))

      return { ok: false, error: message }
    }
  }
}

export function saveOffice(office, officeId = null) {
  return async (dispatch) => {
    try {
      const data = officeId
        ? await updateOffice(officeId, office)
        : await createOffice(office)
      await dispatch(loadOffices())

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error, 'Unable to save office.') }
    }
  }
}

export function removeOffice(officeId) {
  return async (dispatch) => {
    try {
      const data = await deleteOffice(officeId)
      await dispatch(loadOffices())

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error, 'Unable to delete office.') }
    }
  }
}

export function setOfficeActive(officeId, isActive) {
  return async (dispatch) => {
    try {
      const data = isActive
        ? await reactivateOffice(officeId)
        : await deleteOffice(officeId)
      await dispatch(loadOffices())

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update office status.'),
      }
    }
  }
}

export function loadSkills() {
  return async (dispatch) => {
    dispatch(skillsStarted())

    try {
      const data = await listSkills()
      dispatch(skillsSucceeded(data))

      return { ok: true, data }
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to load skills.')
      dispatch(skillsFailed(message))

      return { ok: false, error: message }
    }
  }
}

export function saveSkill(skill, skillId = null) {
  return async (dispatch) => {
    try {
      const data = skillId ? await updateSkill(skillId, skill) : await createSkill(skill)
      await dispatch(loadSkills())

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error, 'Unable to save skill.') }
    }
  }
}

export function removeSkill(skillId) {
  return async (dispatch) => {
    try {
      const data = await deleteSkill(skillId)
      await dispatch(loadSkills())

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error, 'Unable to delete skill.') }
    }
  }
}

export function assignEmployeeSkill(assignRequest, params = {}) {
  return async (dispatch) => {
    try {
      const data = await assignSkill(assignRequest)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: getApiErrorMessage(error, 'Unable to assign skill.') }
    }
  }
}

export function saveEmployeeSkillProficiency(employeePublicId, skillId, proficiency, params = {}) {
  return async (dispatch) => {
    try {
      const data = await updateSkillProficiency(employeePublicId, skillId, proficiency)
      await dispatch(loadEmployees(params))

      return { ok: true, data }
    } catch (error) {
      return {
        ok: false,
        error: getApiErrorMessage(error, 'Unable to update skill proficiency.'),
      }
    }
  }
}
