import url from "url";
import jwt from "jsonwebtoken";

export const googleAuthMiddleware = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  try {
   
    const payload = {
      userId: req.user._id,
      email: req.user.email,
      name: req.user.firstName,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      education: req.user.education,
      isAdmin: req.user.isAdmin || false
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const redirectUrl = url.format({
      pathname: "http://localhost:4200/dashboard/upload-cv",
      query: { 
        token: token,
        isAdmin: req.user.isAdmin || false
      },
    });

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Token generation error:", error);
    return res.status(500).json({ message: "Token generation failed" });
  }
};
