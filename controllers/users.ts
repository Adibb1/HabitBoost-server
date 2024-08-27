import express, { Request, Response } from "express";
const router = express.Router();
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import isAuth from "../middleware/auth";

import multer from "multer";

//upload pfp
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, "./public");
  },
  //file destination
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
  //file name format
});
const upload = multer({ storage });

const SECRET_KEY = process.env.SECRET_KEY as string;

// Register fullname, email, username, password, profilePicture
router.post(
  "/register",
  upload.single("profilePicture"),
  async (req: Request, res: Response) => {
    try {
      const { fullname, username, email, password } = req.body;

      if (!email || !username || !password || !fullname) {
        return res
          .status(400)
          .json({ msg: "All fields are required", code: 400 });
      }

      const checkUser = await User.findOne({ email, username });
      if (checkUser)
        return res.status(400).json({ msg: "User already exists", code: 400 });

      const salt = bcrypt.genSaltSync(10);
      const hashedPass = bcrypt.hashSync(password, salt);

      let user = new User({ ...req.body, password: hashedPass });
      req.file
        ? (user.profilePicture = req.file.filename)
        : (user.profilePicture = "default.png");
      await user.save();
      return res.json({ msg: "Successfully Registered", code: 200 });
    } catch (error) {
      if (error instanceof Error) {
        return res.json({ error: error.message });
      }
      return res.json({ error: "An unknown error occurred" });
    }
  }
);

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ msg: "User doesn't exist", code: 400 });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid Credentials", code: 400 });

    const token = jwt.sign({ data: user }, SECRET_KEY);
    return res.json({ token, user, msg: "Logged in Successfully", code: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

// Get all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .populate("challenges.challenge")
      .populate("badges.badge")
      .populate("habits.habit");
    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//Get by id
router.get("/:id", isAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("challenges.challenge")
      .populate("badges.badge")
      .populate("habits.habit");
    res.json(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

module.exports = router;
