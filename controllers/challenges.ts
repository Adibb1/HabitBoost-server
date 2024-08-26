import express, { Request, Response } from "express";
const router = express.Router();
import Challenge from "../models/Challenge";
import isAuth from "../middleware/auth";
import { AuthenticatedRequest } from "../middleware/auth";

import fs from "fs";
import path from "path";
import multer from "multer";

import User from "../models/User";
import Badge from "../models/Badge";

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

//add badge////////////////////////////// NORMAL FUNCTION
const addBadge = async (userid: string, badgeid: string) => {
  try {
    const badge = await Badge.findById(badgeid);
    const user = await User.findById(userid);
    if (!user || !badge) return { msg: "Not found" };

    //check if user already get the badge
    const check = user.badges.find(
      (badge: any) => badge._id.toString() === badgeid
    );
    if (check) return { msg: "User already get this badge" };

    user.badges.push({ badge });
    user.save();

    return { msg: "Successfully added badge achievement" };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
};

//get all
router.get("/", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await Challenge.find()
      .populate("participants.user")
      .populate("createdBy");
    return challenges
      ? res.json({ challenges })
      : res.json({ msg: "No challenge" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//get by id
router.get("/:id", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await Challenge.findById(req.params.id)
      .populate("participants.user")
      .populate("createdBy");
    return challenges
      ? res.json({ challenges })
      : res.json({ msg: "No challenge" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(400).json({ error: "An unknown error occurred" });
  }
});

//add challenge
router.post(
  "/",
  isAuth,
  upload.single("proofOfCompletion"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ msg: "Please fill in all form" });
      }
      if (!req.file)
        return res.status(400).json({ msg: "Upload your proof of completion" });

      //post a new challenge
      let challenge = await Challenge.create({
        title,
        description,
        createdAt: Date.now(),
        createdBy: req.user._id,
        participants: [
          {
            user: req.user._id,
            proofOfCompletion: req.file.filename,
            completedAt: Date.now(),
          },
        ],
      });

      //insert this challenge into this user (creator) collection
      let user = await User.findById(req.user._id);
      if (user) {
        user.challenges.push({ challenge: challenge._id });
        user.lastAddedChallenge = new Date();
        await user.save();
      }

      return res.json({
        msg: "Comunity Challenge Added Succesfully",
        challenge,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//other user join
router.post(
  "/:challengeid",
  isAuth,
  upload.single("proofOfCompletion"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const challenge = await Challenge.findById(req.params.challengeid);
      if (!challenge)
        return res.status(400).json({ msg: "Challenge not found" });

      if (!req.file)
        return res
          .status(400)
          .json({ msg: "Please upload proof of completion" });

      //check user joined or not
      const alreadyJoined = challenge.participants.find(
        (participant) => participant.user == req.user._id
      );
      if (alreadyJoined) {
        //deleting the file uploaded when user already joined. to avoid trash picture uploaded. without these, file will upload even when it return user already joined
        const filename = req.file.filename; //
        const filepath = path.join(__dirname, `../public/` + filename); //
        fs.unlinkSync(filepath); //
        return res
          .status(400)
          .json({ msg: "You already joined this challenge" });
      }

      //add user as participant
      challenge.participants.push({
        user: req.user._id,
        proofOfCompletion: req.file.filename,
        completedAt: Date.now(),
        reported: 0,
      });
      await challenge.save();

      //add this challenge into user collection
      let user = await User.findById(req.user._id);
      if (user) {
        user.challenges.push({ challenge: challenge._id });
        await user.save();
      }

      //get "challenge master" if user already joined 5 challenges
      const userChallengesTotal = user?.challenges.length;
      if (userChallengesTotal)
        await addBadge(req.user._id, "66bdd7264063a065bb59a540");

      return res.json({
        msg: "Congrats, you successfully join this challenge",
        challenge,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//other user report
router.put(
  "/:challengeid/:userid",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const challenge = await Challenge.findById(req.params.challengeid);
      if (!challenge)
        return res.status(400).json({ msg: "Cannot find challenge" });

      challenge.participants.forEach((participant: any) => {
        if (participant.user.equals(req.params.userid)) {
          participant.reported.count++;
          participant.reported.users.push({ user: req.user._id });
        }
      });

      await challenge.save();

      return res.json({
        reported: challenge,
        msg: "Thanks for reporting. Our admin will review it",
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//admin delete participation
router.put(
  "/:challengeid/:reporteduser/delete",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { challengeid, reporteduser } = req.params;

      // Check if the user is an admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ msg: "Admin access required" });
      }

      // Find the challenge
      const challenge = await Challenge.findById(challengeid);
      if (!challenge) {
        return res.status(404).json({ msg: "Challenge not found" });
      }

      // Remove the participant from the challenge
      const participantIndex = challenge.participants.findIndex(
        (participant: any) => participant.user.equals(reporteduser)
      );

      if (participantIndex === -1) {
        return res.status(404).json({ msg: "Participant not found" });
      }

      challenge.participants.splice(participantIndex, 1);
      await challenge.save();

      // Remove the challenge from the user's collection and reset streak
      const user: any = await User.findById(reporteduser);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      user.challenges = user.challenges.filter(
        (challengeRef: any) => !challengeRef.challenge.equals(challengeid)
      );
      user.streak.count = 0;
      user.streak.lastCheckInDate = null;
      await user.save();

      return res.json({
        msg: "Participant removed from challenge, challenge removed from user, and the user streaks will reset",
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

//admin approve participation (reset report)
router.put(
  "/:challengeid/:reporteduser/approve",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { challengeid, reporteduser } = req.params;

      // Check if the user is an admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ msg: "Admin access required" });
      }

      // Find the challenge
      const challenge = await Challenge.findById(challengeid);
      if (!challenge) {
        return res.status(404).json({ msg: "Challenge not found" });
      }

      //reset the report count and list of user that report
      challenge.participants.forEach((participant: any) => {
        if (participant.user.equals(reporteduser)) {
          participant.reported.count = 0;
          participant.reported.users = [];
        }
      });

      await challenge.save();

      return res.json({
        msg: "Approved the participation. Report count reset",
      });
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
  "/:challengeid",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const challenge = await Challenge.findById(req.params.challengeid);
      if (!challenge)
        return res.status(400).json({ msg: "Challenge not found" });

      //check authorized user -> owns this challenge or admin
      //req.user._id and challenge.createdBy are likely ObjectId types, and you can't compare them directly using !==. Instead, you should use the equals() method provided by Mongoose for ObjectId comparisons.
      if (!challenge.createdBy.equals(req.user._id) && !req.user.isAdmin) {
        return res
          .status(400)
          .json({ msg: "Please don't delete other people's challenge :(" });
      }

      const deleteChallenge = await Challenge.findByIdAndDelete(
        req.params.challengeid
      );

      return res.json({
        msg: "Challenge successfully deleted",
        deleteChallenge,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(400).json({ error: "An unknown error occurred" });
    }
  }
);

module.exports = router;
