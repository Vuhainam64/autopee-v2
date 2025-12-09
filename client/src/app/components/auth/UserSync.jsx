import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAppDispatch } from '../../store/hooks.js'
import { setUser, clearUser } from '../../store/slices/userSlice.js'
import {
  useGetUserQuery,
  useCreateOrUpdateUserMutation,
} from '../../store/api/userApi.js'

/**
 * Component để đồng bộ Firebase Auth với Redux Store
 * Tự động lưu user data vào Redux khi đăng nhập
 */
function UserSync() {
  const { currentUser } = useAuth()
  const dispatch = useAppDispatch()

  // Lấy user data từ Firestore nếu đã đăng nhập
  const {
    data: userProfile,
    isLoading,
    refetch,
  } = useGetUserQuery(currentUser?.uid, {
    skip: !currentUser?.uid,
  })

  const [createOrUpdateUser] = useCreateOrUpdateUserMutation()

  useEffect(() => {
    if (currentUser) {
      // Tạo hoặc cập nhật user trong Firestore
      if (currentUser.uid) {
        createOrUpdateUser({
          userId: currentUser.uid,
          userData: {
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
            photoURL: currentUser.photoURL,
            emailVerified: currentUser.emailVerified,
            lastLoginAt: new Date().toISOString(),
          },
        }).catch((error) => {
          console.error('Error creating/updating user:', error)
        })
      }
    } else {
      // Xóa user khỏi Redux khi đăng xuất
      dispatch(clearUser())
    }
  }, [currentUser, dispatch, createOrUpdateUser])

  // Lưu user profile vào Redux khi có data từ Firestore
  useEffect(() => {
    if (userProfile && !isLoading) {
      // Merge Firebase auth data với Firestore profile data
      dispatch(
        setUser({
          ...userProfile,
          uid: currentUser?.uid,
          email: currentUser?.email || userProfile.email,
          displayName: currentUser?.displayName || userProfile.displayName,
          photoURL: currentUser?.photoURL || userProfile.photoURL,
          emailVerified: currentUser?.emailVerified || userProfile.emailVerified,
        }),
      )
    } else if (currentUser && !isLoading && !userProfile) {
      // Nếu chưa có profile trong Firestore, dùng Firebase auth data
      dispatch(
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
        }),
      )
    }
  }, [userProfile, isLoading, currentUser, dispatch])

  return null // Component này không render gì
}

export default UserSync

