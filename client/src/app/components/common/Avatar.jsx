import { useState } from 'react'

/**
 * Avatar Component
 * Hiển thị ảnh nếu có, nếu không thì hiển thị chữ cái đầu
 */
function Avatar({ photoURL, displayName, email, size = 40, className = '' }) {
  const [imageError, setImageError] = useState(false)

  // Lấy chữ cái đầu từ displayName hoặc email
  const getInitials = () => {
    if (displayName) {
      // Lấy chữ cái đầu của từ đầu tiên
      return displayName.charAt(0).toUpperCase()
    }
    if (email) {
      // Lấy chữ cái đầu của email
      return email.charAt(0).toUpperCase()
    }
    return 'U' // Default
  }

  const initials = getInitials()

  // Nếu có photoURL và chưa có lỗi, hiển thị ảnh
  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={displayName || email || 'User'}
        className={`rounded-full object-cover ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        onError={() => setImageError(true)}
      />
    )
  }

  // Hiển thị chữ cái đầu
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        fontSize: `${size * 0.4}px` 
      }}
    >
      {initials}
    </div>
  )
}

export default Avatar

