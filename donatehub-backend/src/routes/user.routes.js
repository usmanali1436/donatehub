import { Router } from "express";
import { loginUser, registerUser, updateUser, logoutUser, getCurrentUser, changeUserPassword} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = new Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/update-details").post(verifyJWT, updateUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeUserPassword);

export default router;