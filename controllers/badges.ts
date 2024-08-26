import express, { Request, Response } from "express";
const router = express.Router();
import isAuth from "../middleware/auth";
import { AuthenticatedRequest } from "../middleware/auth";
import Badge from "../models/Badge";

import fs from "fs";
import path from "path";
import multer from "multer";

//upload
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

//get all
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const badges = await Badge.find();
    return res.json({ badges });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//admin add badge
router.post(
  "/",
  isAuth,
  upload.single("icon"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, criteria } = req.body;
      if (!req.file) {
        return res.status(400).json({ msg: "Please insert badges icon" });
      }
      if (!req.user.isAdmin) {
        const filename = req.file.filename; //
        const filepath = path.join(__dirname, `../public/` + filename); //
        fs.unlinkSync(filepath); //
        return res.status(400).json({ msg: "Not Authorizesed", a: req.user });
      }
      if (!name || !description || !criteria) {
        const filename = req.file.filename; //
        const filepath = path.join(__dirname, `../public/` + filename); //
        fs.unlinkSync(filepath); //
        return res.status(400).json({ msg: "Please fill all forms" });
      }

      const checker = await Badge.findOne({ name });
      if (checker)
        return res.status(400).json({ msg: "Name used on other badge" });

      const badge = await Badge.create({
        name,
        description,
        criteria,
        icon: req.file.filename,
      });

      return res.json({ msg: "badge successfully created", badge });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//edit badge
router.put(
  "/:id",
  isAuth,
  upload.single("icon"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user.isAdmin)
        return res.status(400).json({ msg: "Not Authorizesed", a: req.user });

      const badge = await Badge.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        criteria: req.body.criteria,
        icon: req.file?.filename,
      });
      if (!badge) return res.status(400).json({ msg: "Badge not found" });

      //delete old icon if user upload new icon
      if (req.file) {
        const filename = badge.icon; //
        const filepath = path.join(__dirname, `../public/` + filename); //
        fs.unlinkSync(filepath); //
      }

      return res.json({ msg: "Badge editted succesfully", badge });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//delete
router.delete(
  "/:id",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user.isAdmin)
        return res.status(400).json({ msg: "Not Authorizesed", a: req.user });

      const badge = await Badge.findById(req.params.id);
      if (!badge)
        return res
          .status(400)
          .json({ msg: "Badge not found, what are you dleteing broe" });

      //delete icon in public foledr
      const filename = badge.icon; //
      const filepath = path.join(__dirname, `../public/` + filename); //
      fs.unlinkSync(filepath); //

      //delete real at database
      await Badge.findByIdAndDelete(req.params.id);

      return res.json({ msg: "Deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

module.exports = router;
