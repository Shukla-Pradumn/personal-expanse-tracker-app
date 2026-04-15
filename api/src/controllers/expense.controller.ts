import { Request, Response } from 'express';
import * as expenseService from '../services/expense.service';
import type { ExpensePayload } from '../models/expense.model';

//this is for list the expenses
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */
export async function listExpenses(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.query as { userId?: string };
    console.log('userId', userId);
    const items = await expenseService.getExpensesByUserId(userId);
    res.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to fetch expenses',
      error: message,
    });
  }
}

//this is for create the expense
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */
export async function createExpense(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const item = await expenseService.createExpense(req.body as ExpensePayload);
    res.status(201).json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to save expense',
      error: message,
    });
  }
}
