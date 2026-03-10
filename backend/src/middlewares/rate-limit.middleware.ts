import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  },
});

export const invoicesRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
    });
  },
});
