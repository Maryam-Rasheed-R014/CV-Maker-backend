import url from "url";

export const googleAuthMiddleware = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const redirectUrl = url.format({
 pathname: "http://localhost:5173/testingLoginSuccess",
    query: { token: req.user.token },
  });

  res.redirect(redirectUrl);
};
