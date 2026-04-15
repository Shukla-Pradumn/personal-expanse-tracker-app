import { Request, Response, NextFunction } from 'express';

//this is for log the request
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {void} A void function.
 */

export function requestLogger(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
}
