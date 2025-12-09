/**
 * Input Validation Utilities
 */

const { ValidationError } = require('./errors')

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 * @throws {ValidationError} If invalid
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', 'email')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email')
  }

  return true
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {boolean} True if valid
 * @throws {ValidationError} If invalid
 */
const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return true
}

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {boolean} True if valid
 * @throws {ValidationError} If invalid
 */
const validateLength = (value, min, max, fieldName) => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName)
  }

  if (value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters`,
      fieldName,
    )
  }

  if (value.length > max) {
    throw new ValidationError(
      `${fieldName} must be at most ${max} characters`,
      fieldName,
    )
  }

  return true
}

/**
 * Validate request data against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} Validated data
 * @throws {ValidationError} If validation fails
 */
const validateSchema = (data, schema) => {
  const errors = []

  for (const [field, rules] of Object.entries(schema)) {
    try {
      if (rules.required) {
        validateRequired(data[field], field)
      }

      if (data[field] !== undefined && data[field] !== null) {
        if (rules.type && typeof data[field] !== rules.type) {
          throw new ValidationError(
            `${field} must be of type ${rules.type}`,
            field,
          )
        }

        if (rules.email && data[field]) {
          validateEmail(data[field])
        }

        if (rules.minLength && typeof data[field] === 'string') {
          validateLength(data[field], rules.minLength, rules.maxLength || 1000, field)
        }
      }
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length > 0) {
    throw errors[0] // Throw first error
  }

  return data
}

module.exports = {
  validateEmail,
  validateRequired,
  validateLength,
  validateSchema,
}

