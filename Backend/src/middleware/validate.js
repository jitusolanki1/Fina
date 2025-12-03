import Joi from "joi";

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
    }
    req.body = value;
    next();
  };
}

export const schemas = {
  register: Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(6).required(), name: Joi.string().allow('', null) }),
  login: Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }),
  accountCreate: Joi.object({ name: Joi.string().required(), openingBalance: Joi.number().default(0) })
};
