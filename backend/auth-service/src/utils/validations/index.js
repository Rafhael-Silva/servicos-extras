const registerUserSchema = require('./registerUserSchema');
const startLoginSchema = require('./startLoginSchema');
const finalizeLoginSchema = require('./finalizeLoginSchema');
const forgotPasswordSchema = require('./forgotPasswordSchema');
const resetPasswordSchema = require('./resetPasswordSchema');
const changePasswordSchema = require('./changePasswordSchema');
const resendCodeSchema = require('./resendCodeSchema');
const verifyUserCodeSchema = require('./verifyUserCodeSchema');
const verifyEmailSchema = require('./verifyEmailSchema');

module.exports = {
  registerUserSchema,
  startLoginSchema,
  finalizeLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendCodeSchema,
  verifyUserCodeSchema,
  verifyEmailSchema,
};
