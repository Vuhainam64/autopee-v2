import { configureStore } from '@reduxjs/toolkit'
import { userApi } from './api/userApi.js'
import userSlice from './slices/userSlice.js'

export const store = configureStore({
  reducer: {
    user: userSlice,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['user/setUser'],
      },
    }).concat(userApi.middleware),
})

// Type definitions (for TypeScript/JSDoc)
// RootState = ReturnType<typeof store.getState>
// AppDispatch = typeof store.dispatch

