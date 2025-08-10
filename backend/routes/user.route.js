import express from "express";
import { getSavedJobs, login, logout, register, saveJob, unsaveJob, updateProfile, updateProfilePhoto, getResume } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/mutler.js";
 
const router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, singleUpload, updateProfile);
router.route("/profile/photo").post(isAuthenticated, singleUpload, updateProfilePhoto);
router.route("/resume/:id").get(getResume);
router.route("/save-job/:id").post(isAuthenticated, saveJob);
router.route("/save-job/:id").delete(isAuthenticated, unsaveJob);
router.route("/saved-jobs").get(isAuthenticated, getSavedJobs);

export default router;

