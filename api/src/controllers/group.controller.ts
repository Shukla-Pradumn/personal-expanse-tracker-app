import { Request, Response } from 'express';
import * as groupService from '../services/group.service';

const getAuth = (req: Request) =>
  req as Request & { authUserId?: string; authUserEmail?: string; authUserName?: string };

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const ownerUserId = String(auth.authUserId || '').trim();
    const ownerEmail = String(auth.authUserEmail || '').trim();
    const ownerName = String(auth.authUserName || '').trim();
    if (!ownerUserId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const result = await groupService.createGroup(
      String(req.body?.name || ''),
      ownerUserId,
      ownerEmail || `${ownerUserId}@social.local`,
      ownerName,
    );
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to create group', error: message });
  }
}

export async function listGroups(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const items = await groupService.listGroupsForUser(userId);
    res.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch groups', error: message });
  }
}

export async function inviteMember(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const item = await groupService.inviteMemberToGroup(
      String(req.params.groupId),
      userId,
      req.body,
    );
    res.status(201).json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /forbidden/i.test(message) ? 403 : 500;
    res.status(status).json({ message: 'Failed to invite member', error: message });
  }
}

export async function joinGroup(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const email = String(auth.authUserEmail || '').trim();
    const name = String(auth.authUserName || '').trim();
    const item = await groupService.joinGroup(
      String(req.params.groupId),
      userId,
      email || `${userId}@social.local`,
      name,
    );
    res.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to join group', error: message });
  }
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const items = await groupService.getGroupMembers(String(req.params.groupId), userId);
    res.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /forbidden/i.test(message) ? 403 : 500;
    res.status(status).json({ message: 'Failed to fetch members', error: message });
  }
}

export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const item = await groupService.createGroupExpense(
      String(req.params.groupId),
      userId,
      req.body,
    );
    res.status(201).json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /forbidden/i.test(message) ? 403 : 500;
    res.status(status).json({ message: 'Failed to save group expense', error: message });
  }
}

export async function listExpenses(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const items = await groupService.listGroupExpenses(String(req.params.groupId), userId);
    res.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /forbidden/i.test(message) ? 403 : 500;
    res.status(status).json({ message: 'Failed to fetch group expenses', error: message });
  }
}

export async function getBalances(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = String(auth.authUserId || '').trim();
    const result = await groupService.getGroupBalances(String(req.params.groupId), userId);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /forbidden/i.test(message) ? 403 : 500;
    res.status(status).json({ message: 'Failed to fetch group balances', error: message });
  }
}
