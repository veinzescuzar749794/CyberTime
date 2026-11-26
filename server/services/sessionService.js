export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    studentId: user.student_id ?? null,
    email: user.email ?? null,
    fullName: user.full_name ?? null,
    role: user.role,
    balance: Number(user.balance),
  };
}

export function regenerateLoginSession(req, user, res, status = 200) {
  req.session.regenerate((error) => {
    if (error) return res.status(500).json({ error: 'Could not establish a secure session.' });
    req.session.user = user;
    req.session.save((saveError) => {
      if (saveError) return res.status(500).json({ error: 'Could not establish a secure session.' });
      res.status(status).json({ user });
    });
  });
}
