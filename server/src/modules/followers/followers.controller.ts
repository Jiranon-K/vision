import { Request, Response } from 'express';
import type { AuthRequest } from '../auth';
import * as followers from './followers.service';

// HTTP only: read the request, call the service, write the response.

export const follow = async (req: Request, res: Response): Promise<void> => {
  await followers.follow(req.body);
  res.status(202).json({ message: 'Check your inbox to confirm' });
};

export const confirm = async (req: Request, res: Response): Promise<void> => {
  res.json(await followers.confirm(req.body));
};

// Two ways in: the stop page posts the token in the body, and a mail client's
// one-click unsubscribe (RFC 8058) posts to the link itself.
export const stop = async (req: Request, res: Response): Promise<void> => {
  const outcome = await followers.stop({ token: req.params.token ?? req.body?.token });
  res.json({ stopped: true, ...(outcome ?? {}) });
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ items: await followers.listFollowers(req.actor!) });
};

export const exportCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  const csv = await followers.exportFollowers(req.actor!);
  res
    .status(200)
    .type('text/csv; charset=utf-8')
    .attachment('followers.csv')
    .send(csv);
};

export const summary = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(await followers.summary(req.actor!));
};

export const count = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ count: await followers.countFor(req.actor!, String(req.params.creatorId)) });
};
