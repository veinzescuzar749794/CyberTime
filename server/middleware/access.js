export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  next();
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.session.user?.role)) {
      return res.status(403).json({ error: 'You do not have access to this action.' });
    }
    next();
  };
}
