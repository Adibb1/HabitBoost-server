import express, { Request, Response } from "express";
const router = express.Router();
import isAuth from "../middleware/auth";
import { AuthenticatedRequest } from "../middleware/auth";
import Quote from "../models/Quote";

//get all
router.get("/", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quote = await Quote.find().populate("author");

    return res.json({ quote });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//add quote
router.post("/", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ msg: "Please add quote" });

    const checker = await Quote.findOne({ text });
    if (checker)
      return res
        .status(400)
        .json({ msg: "There is other same exact quote with yours" });

    const quote = await Quote.create({
      text,
      author: req.user._id,
    });

    return res.json({ msg: "Quote successfully created", quote });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//delete
router.delete(
  "/:id",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote)
        return res
          .status(400)
          .json({ msg: "Quote not found, what are you dleteing broe" });

      //check user
      if (!quote.author?.equals(req.user._id) && req.user.isAdmin == false)
        return res.status(400).json({ msg: "not authorixed" });
      //delete real at database
      await Quote.findByIdAndDelete(req.params.id);

      return res.json({ msg: "Deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

export default router;
