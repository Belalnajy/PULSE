const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const code = err.status || err.code || 500;
  logger.error({ code, msg: err.message, path: req.path });
  res.status(code).json({ success: false, error: { code, message: err.message || 'Internal error' } });
}

module.exports = { errorHandler };
