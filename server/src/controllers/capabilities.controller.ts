import { Request, Response } from 'express';
import { excerptSuggestionAvailable } from '../ai/provider';

// The server holds the credentials, so it is the only thing allowed to decide
// which optional capabilities are on — never a NEXT_PUBLIC_* flag that could
// drift from what's actually configured.
export const getCapabilities = (_req: Request, res: Response): void => {
  res.json({
    excerptSuggestion: excerptSuggestionAvailable(),
  });
};
