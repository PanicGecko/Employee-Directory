import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  error: '',
  nodes: [],
  status: 'idle',
}

const hierarchySlice = createSlice({
  name: 'hierarchy',
  initialState,
  reducers: {
    hierarchyFailed(state, action) {
      state.status = 'failed'
      state.error = action.payload || 'Unable to load organization hierarchy.'
    },
    hierarchyStarted(state) {
      state.status = 'loading'
      state.error = ''
    },
    hierarchySucceeded(state, action) {
      state.status = 'succeeded'
      state.nodes = action.payload
      state.error = ''
    },
  },
})

export const { hierarchyFailed, hierarchyStarted, hierarchySucceeded } =
  hierarchySlice.actions

export default hierarchySlice.reducer
