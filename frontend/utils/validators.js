import { VALIDATION_PATTERNS, LOCATIONS } from './constants';

// Email Validator
export const isValidEmail = (email) => {
  if (!email) return false;
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

// Phone Validator (Indian Phone Numbers)
export const isValidPhone = (phone) => {
  if (!phone) return false;
  return VALIDATION_PATTERNS.PHONE.test(phone);
};

// URL Validator
export const isValidUrl = (url) => {
  if (!url) return false;
  return VALIDATION_PATTERNS.URL.test(url);
};

// Password Validator
export const isValidPassword = (password) => {
  if (!password) return false;
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

// Username Validator
export const isValidUsername = (username) => {
  if (!username) return false;
  return VALIDATION_PATTERNS.USERNAME.test(username);
};

// Pincode Validator (Indian Pincode)
export const isValidPincode = (pincode) => {
  if (!pincode) return false;
  return VALIDATION_PATTERNS.PINCODE.test(pincode);
};

// Empty Check
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Length Check
export const isValidLength = (value, min, max) => {
  if (!value) return false;
  const length = value.toString().length;
  return length >= min && length <= max;
};

// File Type Validator
export const isValidFileType = (fileType, allowedTypes) => {
  if (!fileType) return false;
  return allowedTypes.includes(fileType);
};

// File Size Validator
export const isValidFileSize = (fileSize, maxSize) => {
  if (!fileSize) return false;
  return fileSize <= maxSize;
};

// Image Validator
export const isValidImage = (file) => {
  if (!file) return false;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return isValidFileType(file.type, allowedTypes) &&
         isValidFileSize(file.size, maxSize);
};

// Video Validator
export const isValidVideo = (file) => {
  if (!file) return false;
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  return isValidFileType(file.type, allowedTypes) &&
         isValidFileSize(file.size, maxSize);
};

// Object ID Validator (MongoDB)
export const isValidObjectId = (id) => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Date Validator
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Future Date Check
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

// Past Date Check
export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) < new Date();
};

// Age Check
export const isValidAge = (birthDate, minAge = 13) => {
  if (!isValidDate(birthDate)) return false;
  const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= minAge;
};

// ---------------------------------------------------------------------------
// Location Validators (backed by LOCATIONS in constants.js)
// ---------------------------------------------------------------------------

// State ID Validator
export const isValidStateId = (stateId) => {
  if (!stateId) return false;
  return LOCATIONS.states.some((state) => state.id === stateId);
};

// District ID Validator — optionally scoped to a state, to confirm the
// district actually belongs to that state and not just to *some* state.
export const isValidDistrictId = (districtId, stateId = null) => {
  if (!districtId) return false;
  if (stateId) {
    const districts = LOCATIONS.districts[stateId];
    if (!districts) return false;
    return districts.some((d) => d.id === districtId);
  }
  return Object.values(LOCATIONS.districts).some((districts) =>
    districts.some((d) => d.id === districtId)
  );
};

// City ID Validator — optionally scoped to a district. Note: LOCATIONS.cities
// only has tracked entries for a subset of (mostly major) districts, so a
// district with no entry there is treated as "unknown", not "invalid" — see
// validateLocation below for how that distinction is used.
export const isValidCityId = (cityId, districtId = null) => {
  if (!cityId) return false;
  if (districtId) {
    const cities = LOCATIONS.cities[districtId];
    if (!cities) return false;
    return cities.some((c) => c.id === cityId);
  }
  return Object.values(LOCATIONS.cities).some((cities) =>
    cities.some((c) => c.id === cityId)
  );
};

// Lookup helpers — return the matching record (or null), handy for
// resolving a stored ID back to a display name.
export const getStateById = (stateId) =>
  LOCATIONS.states.find((state) => state.id === stateId) || null;

export const getDistrictById = (districtId, stateId = null) => {
  if (stateId) {
    const districts = LOCATIONS.districts[stateId] || [];
    return districts.find((d) => d.id === districtId) || null;
  }
  for (const districts of Object.values(LOCATIONS.districts)) {
    const found = districts.find((d) => d.id === districtId);
    if (found) return found;
  }
  return null;
};

export const getCityById = (cityId, districtId = null) => {
  if (districtId) {
    const cities = LOCATIONS.cities[districtId] || [];
    return cities.find((c) => c.id === cityId) || null;
  }
  for (const cities of Object.values(LOCATIONS.cities)) {
    const found = cities.find((c) => c.id === cityId);
    if (found) return found;
  }
  return null;
};

// Returns the list of district options for a given state — useful for
// populating a dependent dropdown in a form.
export const getDistrictsForState = (stateId) => LOCATIONS.districts[stateId] || [];

// Returns the list of tracked city options for a given district (may be empty
// if that district doesn't have a curated city list yet).
export const getCitiesForDistrict = (districtId) => LOCATIONS.cities[districtId] || [];

// ---------------------------------------------------------------------------

// Validate Required Fields
export const validateRequired = (data, requiredFields) => {
  const errors = {};

  requiredFields.forEach(field => {
    if (isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  });

  return errors;
};

// Validate Email Field
export const validateEmailField = (email) => {
  if (!email) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return null;
};

// Validate Phone Field
export const validatePhoneField = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!isValidPhone(phone)) return 'Please enter a valid Indian phone number';
  return null;
};

// Validate Password Field
export const validatePasswordField = (password, minLength = 6) => {
  if (!password) return 'Password is required';
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (!isValidPassword(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

// Validate Confirm Password
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

// Validate Pincode Field
export const validatePincodeField = (pincode) => {
  if (!pincode) return 'Pincode is required';
  if (!isValidPincode(pincode)) return 'Please enter a valid 6-digit pincode';
  return null;
};

// Validate Channel Name
export const validateChannelName = (name) => {
  if (!name) return 'Channel name is required';
  if (!isValidLength(name, 3, 50)) {
    return 'Channel name must be between 3 and 50 characters';
  }
  return null;
};

// Validate Article Title
export const validateArticleTitle = (title) => {
  if (!title) return 'Title is required';
  if (!isValidLength(title, 5, 200)) {
    return 'Title must be between 5 and 200 characters';
  }
  return null;
};

// Validate Article Body
export const validateArticleBody = (body, minLength = 50) => {
  if (!body) return 'Content is required';
  if (body.length < minLength) {
    return `Content must be at least ${minLength} characters`;
  }
  return null;
};

// Validate Location
// `location` is expected to hold IDs, e.g. { state: 'west_bengal', district: 'kolkata', city: 'kolkata_city' }.
// Cross-checks each level against LOCATIONS so a district can't be attached
// to the wrong state, etc. City is optional by default since curated city
// lists don't yet exist for every district — pass { requireCity: true } to
// enforce it where you do have full coverage.
export const validateLocation = (location = {}, options = {}) => {
  const { requireCity = false } = options;
  const errors = {};

  if (!location.state) {
    errors.state = 'State is required';
  } else if (!isValidStateId(location.state)) {
    errors.state = 'Please select a valid state';
  }

  if (!location.district) {
    errors.district = 'District is required';
  } else if (!errors.state && !isValidDistrictId(location.district, location.state)) {
    errors.district = 'Please select a valid district for the chosen state';
  }

  if (location.city) {
    const trackedCities = LOCATIONS.cities[location.district];
    if (!errors.district && trackedCities && !isValidCityId(location.city, location.district)) {
      errors.city = 'Please select a valid city for the chosen district';
    }
  } else if (requireCity) {
    errors.city = 'City is required';
  }

  return errors;
};

// Validate Channel Data
export const validateChannelData = (data) => {
  const errors = {};

  const nameError = validateChannelName(data.channelName);
  if (nameError) errors.channelName = nameError;

  if (!data.description) {
    errors.description = 'Description is required';
  }

  const locationErrors = validateLocation(data.location || {});
  Object.assign(errors, locationErrors);

  return errors;
};

// Validate Article Data
export const validateArticleData = (data) => {
  const errors = {};

  const titleError = validateArticleTitle(data.title);
  if (titleError) errors.title = titleError;

  const bodyError = validateArticleBody(data.body);
  if (bodyError) errors.body = bodyError;

  if (!data.summary) {
    errors.summary = 'Summary is required';
  }

  return errors;
};

// Validate User Registration
export const validateRegistration = (data) => {
  const errors = {};

  if (!data.name) {
    errors.name = 'Name is required';
  }

  const emailError = validateEmailField(data.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhoneField(data.phone);
  if (phoneError) errors.phone = phoneError;

  const passwordError = validatePasswordField(data.password);
  if (passwordError) errors.password = passwordError;

  if (data.confirmPassword) {
    const confirmError = validateConfirmPassword(data.password, data.confirmPassword);
    if (confirmError) errors.confirmPassword = confirmError;
  }

  return errors;
};

// Validate User Login
export const validateLogin = (data) => {
  const errors = {};

  const emailError = validateEmailField(data.email);
  if (emailError) errors.email = emailError;

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

// Form Validation Helper
// Fixed: previously this could throw when an optional field was left
// undefined/empty (e.g. `value.length` on undefined). Now optional empty
// fields are skipped entirely, matching how `rule.required` is meant to work.
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];

    if (rule.required && isEmpty(value)) {
      errors[field] = rule.message || `${field} is required`;
      return;
    }

    if (isEmpty(value)) {
      // Optional field with no value — nothing further to validate.
      return;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `Invalid ${field}`;
    } else if (rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
    } else if (rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = rule.message || `${field} must be at most ${rule.maxLength} characters`;
    } else if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) errors[field] = customError;
    }
  });

  return errors;
};

export default {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidPassword,
  isValidUsername,
  isValidPincode,
  isEmpty,
  isValidLength,
  isValidFileType,
  isValidFileSize,
  isValidImage,
  isValidVideo,
  isValidObjectId,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidAge,
  isValidStateId,
  isValidDistrictId,
  isValidCityId,
  getStateById,
  getDistrictById,
  getCityById,
  getDistrictsForState,
  getCitiesForDistrict,
  validateRequired,
  validateEmailField,
  validatePhoneField,
  validatePasswordField,
  validateConfirmPassword,
  validatePincodeField,
  validateChannelName,
  validateArticleTitle,
  validateArticleBody,
  validateLocation,
  validateChannelData,
  validateArticleData,
  validateRegistration,
  validateLogin,
  validateForm,
};