const { validationResult } = require("express-validator");

/**
 * Middleware factory: runs an array of express-validator chains,
 * and if any errors are present, forwards them to the error handler.
 *
 * Usage:
 *   router.post('/x', validate([ body('email').isEmail() ]), controller);
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const err = new Error(
      result.array().map((e) => e.msg).join("; ")
    );
    err.status = 400;
    err.details = result.array();
    return next(err);
  };
};

module.exports = validate;
