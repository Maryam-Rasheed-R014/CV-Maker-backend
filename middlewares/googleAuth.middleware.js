// import url from 'url';

// // ✅ This middleware will handle redirecting after Google login
// export const googleAuthMiddleware = (req, res, next) => {
//   try {
//     const user = req.user;

//     if (!user || !user.token) {
//       return res.status(400).json({ message: 'Google login failed' });
//     }

//     // Build redirect URL with token (for frontend)
//     const redirectUrl = url.format({
//       pathname: 'http://localhost:5173/login-success',
//       query: { token: user.token },
//     });

//     // Redirect user to frontend
//     return res.redirect(redirectUrl);
//   } catch (error) {
//     console.error('Google Auth Middleware Error:', error);
//     next(error); // pass error to global handler
//   }
// };



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
