import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: null,
  userProfile: null,
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload
      state.error = null
    },
    setUserProfile: (state, action) => {
      state.userProfile = action.payload
      state.error = null
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearUser: (state) => {
      state.currentUser = null
      state.userProfile = null
      state.error = null
      state.isLoading = false
    },
  },
})

export const { setUser, setUserProfile, setLoading, setError, clearUser } =
  userSlice.actions

export default userSlice.reducer

