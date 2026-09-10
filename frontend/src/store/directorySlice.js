import { createSlice } from '@reduxjs/toolkit'

const initialCollectionState = {
  error: '',
  items: [],
  status: 'idle',
}

const initialState = {
  departments: initialCollectionState,
  employees: {
    ...initialCollectionState,
    page: 1,
    pageSize: 20,
    total: 0,
  },
  offices: initialCollectionState,
  skills: initialCollectionState,
}

function requestStarted(state, key) {
  state[key].status = 'loading'
  state[key].error = ''
}

function requestFailed(state, key, message) {
  state[key].status = 'failed'
  state[key].error = message
}

const directorySlice = createSlice({
  name: 'directory',
  initialState,
  reducers: {
    departmentsFailed(state, action) {
      requestFailed(state, 'departments', action.payload)
    },
    departmentsStarted(state) {
      requestStarted(state, 'departments')
    },
    departmentsSucceeded(state, action) {
      state.departments.status = 'succeeded'
      state.departments.items = action.payload
      state.departments.error = ''
    },
    employeesFailed(state, action) {
      requestFailed(state, 'employees', action.payload)
    },
    employeesStarted(state) {
      requestStarted(state, 'employees')
    },
    employeesSucceeded(state, action) {
      state.employees.status = 'succeeded'
      state.employees.items = action.payload.items || []
      state.employees.total = action.payload.total || 0
      state.employees.page = action.payload.page || 1
      state.employees.pageSize = action.payload.page_size || 20
      state.employees.error = ''
    },
    officesFailed(state, action) {
      requestFailed(state, 'offices', action.payload)
    },
    officesStarted(state) {
      requestStarted(state, 'offices')
    },
    officesSucceeded(state, action) {
      state.offices.status = 'succeeded'
      state.offices.items = action.payload
      state.offices.error = ''
    },
    skillsFailed(state, action) {
      requestFailed(state, 'skills', action.payload)
    },
    skillsStarted(state) {
      requestStarted(state, 'skills')
    },
    skillsSucceeded(state, action) {
      state.skills.status = 'succeeded'
      state.skills.items = action.payload
      state.skills.error = ''
    },
  },
})

export const {
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
} = directorySlice.actions

export default directorySlice.reducer
