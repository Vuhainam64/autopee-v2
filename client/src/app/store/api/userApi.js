import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { db } from '../../config/firebase.js'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

// RTK Query API slice cho user data với Firestore
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Lấy thông tin user từ Firestore
    getUser: builder.query({
      async queryFn(userId) {
        try {
          if (!userId) {
            return { data: null }
          }

          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            return { data: { id: userSnap.id, ...userSnap.data() } }
          } else {
            return { data: null }
          }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    // Tạo hoặc cập nhật user trong Firestore
    createOrUpdateUser: builder.mutation({
      async queryFn({ userId, userData }) {
        try {
          if (!userId) {
            throw new Error('User ID is required')
          }

          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            // Cập nhật user hiện có
            await updateDoc(userRef, {
              ...userData,
              updatedAt: serverTimestamp(),
            })
            return { data: { id: userId, ...userData } }
          } else {
            // Tạo user mới
            await setDoc(userRef, {
              ...userData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            return { data: { id: userId, ...userData } }
          }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
      ],
    }),

    // Cập nhật profile user
    updateUserProfile: builder.mutation({
      async queryFn({ userId, profileData }) {
        try {
          if (!userId) {
            throw new Error('User ID is required')
          }

          const userRef = doc(db, 'users', userId)
          await updateDoc(userRef, {
            ...profileData,
            updatedAt: serverTimestamp(),
          })

          const updatedSnap = await getDoc(userRef)
          return { data: { id: updatedSnap.id, ...updatedSnap.data() } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
      ],
    }),
  }),
})

export const {
  useGetUserQuery,
  useCreateOrUpdateUserMutation,
  useUpdateUserProfileMutation,
  useLazyGetUserQuery,
} = userApi

