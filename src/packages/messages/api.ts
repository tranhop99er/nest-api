export const API_ERROR_MSG = {
  wrongEmailOrPassword: 'Wrong email or password',
  existEmail: 'Email has already been taken',
  existPhone: 'Phone has already been taken',
  userNotFound: 'User not found',
  disabledAccount: 'Account is disabled',
  incorrectPassword: 'Incorrect password',
  emailNotFound: 'Email not found',
  invalidCode: 'Invalid code',
  accountNotExist: 'Account does not exist',
};

export const ERROR_MESSAGE = {
  // common
  requiredError: 'This field cannot be blank',
  invalidDate: 'The entered time is invalid',
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: 'The password is incorrect',
  invalidPhoneNumber: 'The phone number is invalid',
  invalidPostalCode: 'The postal code is invalid',
  maxCharacters: 'Exceeds the maximum of 255 characters',
  max1000Characters: 'Exceeds the maximum of 1000 characters',
  max500Characters: 'Exceeds the maximum of 500 characters',
  max50Characters: 'Exceeds the maximum of 50 characters',
  notSamePassword: 'The password and password confirmation do not match',
  invalid2FaCode: 'The format of the 2FA code is incorrect',
  emptyEmail: 'Please enter an email address',
  emptyPassword: 'Please enter a password',
  empty2FaCode: 'Please enter the 2FA code',
  emptySelectedUser: 'Please select a user',

  // note
  emailNote: 'This is the email address used for 2-factor authentication',
  passwordNote:
    'Please enter a password with at least 8 characters, including uppercase, lowercase, and numbers',

  // invalid
  compareDate:
    'The system usage start date must be after the business establishment date',
  uniqueField: 'The input field must be unique',
  maxTag: 'You can only have up to 10 data items',
  maxFileSize: 'The file is too large',
  maxQuantityFile:
    'The number or size of files exceeds the maximum limit (10 files, 100mb)',
  invalidFileType: 'Only png, jpg, jpeg, and pdf file formats are accepted',
  maxNumberInput: 'Exceeds the maximum of 7 digits',
  integerNumber:
    'Negative numbers and decimals cannot be registered, please enter a number',
  textNotAllowed: 'Text cannot be registered. Please enter a number',
  invalidQuestions: 'The health information is invalid',

  duplicateData: 'There are duplicate data. Please check again',
  notTimePast: 'The selected time is not in the past',
  notTimeFuture: 'The end date must be later than the start date',
  emptyUser: 'There is no user data',
  endDateBeforeStartDate: 'The end date is before the start date',
};
