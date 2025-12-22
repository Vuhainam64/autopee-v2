const ShopeeCookie = require('../models/ShopeeCookie')

/**
 * Lấy cookie từ database, ưu tiên cookie có usageCount thấp nhất
 * @param {string} userId - User ID (có thể là "guest")
 * @returns {Promise<Object|null>} Cookie object hoặc null nếu không tìm thấy
 */
async function getAvailableCookie(userId = 'guest') {
  try {
    // Tìm cookie active có usageCount thấp nhất
    const cookie = await ShopeeCookie.findOne({
      userId: userId,
      isActive: true,
    })
      .sort({ usageCount: 1, lastUsedAt: 1 }) // Ưu tiên usageCount thấp nhất, sau đó lastUsedAt cũ nhất
      .lean()

    return cookie
  } catch (error) {
    console.error('Error getting available cookie:', error)
    return null
  }
}

/**
 * Tăng usageCount và cập nhật lastUsedAt khi cookie được sử dụng
 * @param {string} cookieId - Cookie ID
 * @returns {Promise<void>}
 */
async function incrementCookieUsage(cookieId) {
  try {
    await ShopeeCookie.findByIdAndUpdate(cookieId, {
      $inc: { usageCount: 1 },
      $set: { lastUsedAt: new Date() },
    })
  } catch (error) {
    console.error('Error incrementing cookie usage:', error)
  }
}

/**
 * Lưu cookie vào database (nếu chưa tồn tại) hoặc cập nhật nếu đã tồn tại
 * @param {string} userId - User ID
 * @param {string} cookieString - Cookie string
 * @param {string} name - Cookie name
 * @returns {Promise<Object>} Cookie object
 */
async function saveCookie(userId, cookieString, name = 'Default Cookie') {
  try {
    const cookie = await ShopeeCookie.findOneAndUpdate(
      {
        userId: userId,
        cookie: cookieString.trim(),
      },
      {
        userId: userId,
        cookie: cookieString.trim(),
        name: name,
        isActive: true,
        lastUsedAt: new Date(),
        // Không reset usageCount khi update, chỉ tăng khi sử dụng
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true, // Đảm bảo usageCount = 0 khi tạo mới
      }
    )

    return cookie
  } catch (error) {
    console.error('Error saving cookie:', error)
    throw error
  }
}

/**
 * Xóa cookie khỏi database
 * @param {string} cookieId - Cookie ID hoặc cookie string
 * @param {string} userId - User ID (optional, để đảm bảo chỉ xóa cookie của user đó)
 * @returns {Promise<boolean>} True nếu xóa thành công
 */
async function deleteCookie(cookieId, userId = null) {
  try {
    const query = userId 
      ? { _id: cookieId, userId: userId }
      : { _id: cookieId }
    
    const result = await ShopeeCookie.deleteOne(query)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting cookie:', error)
    return false
  }
}

/**
 * Xóa cookie theo cookie string
 * @param {string} cookieString - Cookie string
 * @param {string} userId - User ID (optional)
 * @returns {Promise<boolean>} True nếu xóa thành công
 */
async function deleteCookieByString(cookieString, userId = null) {
  try {
    const query = userId
      ? { cookie: cookieString.trim(), userId: userId }
      : { cookie: cookieString.trim() }
    
    const result = await ShopeeCookie.deleteOne(query)
    return result.deletedCount > 0
  } catch (error) {
    console.error('Error deleting cookie by string:', error)
    return false
  }
}

module.exports = {
  getAvailableCookie,
  incrementCookieUsage,
  saveCookie,
  deleteCookie,
  deleteCookieByString,
}

