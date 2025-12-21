import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useAppDispatch } from '../../store/hooks.js'
import { setUserProfile, clearUser } from '../../store/slices/userSlice.js'
import { get } from '../../services/api.js'

/**
 * Component để đồng bộ Firebase Auth với MongoDB và Redux Store
 * Tự động lưu user data vào MongoDB và Redux khi đăng nhập
 */
function UserSync() {
  const { currentUser } = useAuth()
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true)
      // Gọi MongoDB API để lấy hoặc tạo user profile
      // Endpoint /user/me sẽ tự động tạo user nếu chưa có
      get('/user/me')
        .then((response) => {
          if (response?.success && response?.data) {
            // Lưu user profile vào Redux
            dispatch(setUserProfile(response.data))
          }
        })
        .catch((error) => {
          console.error('Error fetching user profile:', error)
          // Fallback: dùng Firebase auth data nếu API lỗi
          if (currentUser) {
            dispatch(
              setUserProfile({
                id: currentUser.uid,
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                photoURL: currentUser.photoURL,
                emailVerified: currentUser.emailVerified,
              }),
            )
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      // Xóa user khỏi Redux khi đăng xuất
      dispatch(clearUser())
    }
  }, [currentUser, dispatch])

  return null // Component này không render gì
}

export default UserSync

