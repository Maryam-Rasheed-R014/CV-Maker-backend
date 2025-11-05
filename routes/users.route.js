import express from 'express';
import passport from 'passport';
import { createNewUser, loginUser, resetPasswordRequest, resetPassword, getAllUsers } from '../controllers/users.controller.js';    
import '../config/passport.js'; 
import { googleAuthMiddleware } from '../middlewares/googleAuth.middleware.js';
const router = express.Router();
router.post('/register', createNewUser);
router.post('/login', loginUser);
router.post("/request-reset", resetPasswordRequest);
router.post("/reset-password/:token", resetPassword);

// Get all users (for admin)
router.get("/all-users", getAllUsers);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  googleAuthMiddleware //  our middlewar handle redirect
);

export default router;