import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectSchema } from 'joi';

type ValidateSource = 'body' | 'query' | 'params';

//this is for validate the request
/**
 * @param {ObjectSchema} schema - The schema to validate the request.
 * @param {ValidateSource} source - The source of the request. Default is 'body'.
 * @returns {RequestHandler} A request handler function.
 */

export function validate(
  schema: ObjectSchema,
  source: ValidateSource = 'body',
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Joi-validated value replaces parsed segment; Express types are permissive at runtime.
    (req as unknown as Record<string, unknown>)[source] = value;
    next();
  };
}
