import { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const USER_POOL_ID = String(process.env.COGNITO_USER_POOL_ID).trim();
const CLIENT_ID = String(process.env.COGNITO_CLIENT_ID).trim();

const verifier =
  USER_POOL_ID && CLIENT_ID
    ? CognitoJwtVerifier.create({
        userPoolId: USER_POOL_ID,
        tokenUse: 'id',
        clientId: CLIENT_ID,
      })
    : null;

//this is for get the token from the header
/**
 * @param {Request} req - The request object.
 * @returns {string} The token from the header.
 */

function getTokenFromHeader(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return '';
  const [scheme, token] = String(authHeader).split(' ');
  if (scheme !== 'Bearer') return '';
  return String(token || '').trim();
}

//this is for verify the user is authenticated
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function.
 * @returns {Promise<void>} A promise that resolves to void.
 */

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!verifier) {
    return res.status(500).json({
      message:
        'Auth not configured. Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID.',
    });
  }

  const token = getTokenFromHeader(req);
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: missing bearer token.' });
  }

  try {
    const payload = await verifier.verify(token);
    (req as Request & { authUserId?: string }).authUserId = String(payload.sub);
    (req as Request & { authUserEmail?: string }).authUserEmail = String(
      payload.email || '',
    ).trim();
    (req as Request & { authUserName?: string }).authUserName = String(
      payload.name || '',
    ).trim();
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized: invalid token.',
      error: error instanceof Error ? error.message : 'Unknown token error',
    });
  }
}

//this is for verify the user is the same as the user in the request
//To prevent one user from accessing/modifying another user's data by passing a different userId in URL/query/body.

/**
 * @param {string} source - The source of the request.
 * @param {string} key - The key of the user id. Default is 'userId'.
 * @returns {Function} A middleware function that verifies if the user is the same as the user in the request.
 */

export function verifySameUser(
  source: 'params' | 'query' | 'body',
  key: string = 'userId',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authUserId = (req as Request & { authUserId?: string }).authUserId;
    const sourceObj = req[source] as Record<string, unknown>;
    const requestedUserId = String(sourceObj?.[key] || '').trim();

    if (!authUserId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!requestedUserId) {
      return res.status(400).json({ message: `${key} is required.` });
    }

    if (requestedUserId !== authUserId) {
      return res.status(403).json({
        message: 'Forbidden: token user does not match requested user.',
      });
    }

    next();
  };
}
