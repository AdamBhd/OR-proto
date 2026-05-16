import { Request, Response, NextFunction } from 'express';

/** 404 fallback — must be mounted after all real routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

/** Centralised error handler. Keep stack traces out of prod responses. */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProd ? undefined : err.message,
  });
}
