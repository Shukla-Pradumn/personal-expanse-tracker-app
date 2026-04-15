import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import type { UserPayloadInput } from '../models/user.model';

//this is for get the user by id
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    console.log('GET /api/users/:userId params =>', req.params);
    const item = await userService.getUserById(req.params.userId);
    if (!item) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to fetch users',
      error: message,
    });
  }
}

//this is for update/create the user
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */

export async function upsertUser(req: Request, res: Response): Promise<void> {
  try {
    console.log('POST /api/users body =>', req.body);
    const item = await userService.upsertUser(req.body as UserPayloadInput);
    res.status(201).json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to save user',
      error: message,
    });
  }
}
