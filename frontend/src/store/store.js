import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import directoryReducer from './directorySlice'
import hierarchyReducer from './hierarchySlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    directory: directoryReducer,
    hierarchy: hierarchyReducer,
  },
})
