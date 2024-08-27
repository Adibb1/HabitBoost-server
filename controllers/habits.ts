import express, { Request, Response } from "express";
const router = express.Router();
import Habit from "../models/Habit";
import Badge from "../models/Badge";
import User from "../models/User";
import isAuth from "../middleware/auth";
import { AuthenticatedRequest } from "../middleware/auth";

//add badge////////////////////////////// NORMAL FUNCTION
const addBadge = async (userid: string, badgeid: string) => {
  try {
    const badge = await Badge.findById(badgeid);
    const user = await User.findById(userid);
    if (!user || !badge) return { msg: "Not found" };

    // Check if user already has the badge
    const check = user.badges.find(
      (userBadge: any) =>
        userBadge.badge && userBadge.badge.toString() === badgeid
    );

    if (check) {
      return { msg: "User already has this badge" };
    }

    // Add the badge to the user's badges array
    user.badges.push({ badge: badge._id });
    await user.save(); // Ensure to wait for the save operation to complete

    return { msg: "Successfully added badge achievement" };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unknown error occurred" };
  }
};

// Get all by user
router.get("/", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const habits = await Habit.find({ createdBy: req.user._id });
    return res.status(200).json(habits);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// Get by user and id
router.get("/:id", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const habits = await Habit.find({
      createdBy: req.user._id,
      _id: req.params.id,
    });
    return res.status(200).json(habits);
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// Add
router.post("/", isAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, frequency, isPublic } = req.body;

    //get 'new user' badge (if first time add habit)
    const userHabits = await Habit.find({ createdBy: req.user._id });
    const a = await addBadge(req.user._id, "66c54ad4acae3330f2d34a62"); //

    // get 'community star' badge (if user has created 10 public habits)
    if (isPublic) {
      const publicHabits = userHabits.filter((habit) => habit.isPublic);
      if (publicHabits.length + 1 === 10) {
        // +1 includes the new habit
        await addBadge(req.user._id, "66bddbab850d513e17874577"); // Community Star badge ID
      }
    }

    //check if same user has same habit name
    const check = await Habit.findOne({ createdBy: req.user._id, title });
    if (check) return res.status(400).json({ msg: "Please use other name" });

    //add into habit collection
    const habit = new Habit({
      title,
      description,
      frequency,
      isPublic,
      createdBy: req.user._id, // req.user
    });
    await habit.save();

    //add into user collection
    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ msg: "Cannot find user" });
    user.habits.push({ habit });
    await user.save();

    return res.json({ msg: "Habit created successfully", habit, a });
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
});

// Edit
router.put(
  "/:id/edit",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const habit = await Habit.findOne({ _id: id, createdBy: req.user._id });

      if (!habit) return res.status(400).json({ msg: "Habit not found" });

      const updatedHabit = await Habit.findByIdAndUpdate(id, { ...req.body });

      return res.json({ msg: "Habit updated successfully", updatedHabit });
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
);

// Delete
router.delete(
  "/:id",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const habit = await Habit.findOneAndDelete({
        _id: id,
        createdBy: req.user._id,
      });
      if (!habit) return res.status(404).json({ msg: "Habit not found" });

      //remove from user collection
      const user = await User.findById(req.user._id);
      if (!user) return res.status(400).json({ msg: "Cannot find user" });
      user.habits.pull(habit._id);
      await user.save();

      return res.status(200).json({ msg: "Habit deleted successfully" });
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
);

//daily checkin
router.put(
  "/:id/checkin",
  isAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - offset * 60 * 1000);
      const formattedDate = localDate.toISOString().slice(0, 10);

      const habit = await Habit.findById(id);
      if (!habit) return res.status(400).json({ msg: "Habit not found" });

      const alreadyCheckIn = habit.daysCompleted.some(
        (day) => day.date === formattedDate
      );
      if (alreadyCheckIn) {
        return res
          .status(400)
          .json({ msg: "Habit already checked in for today" });
      }

      // Update habit's daysCompleted array
      habit.daysCompleted.push({ date: formattedDate });
      await habit.save();

      // Manage streak logic
      const user = await User.findById(req.user._id);
      if (!user || !user.streak)
        return res.status(400).json({ msg: "User not found" });

      const lastCheckInDate = user.streak.lastCheckInDate
        ? new Date(user.streak.lastCheckInDate)
        : null;

      if (lastCheckInDate) {
        var dayDifference =
          (localDate.getTime() - lastCheckInDate.getTime()) /
          (1000 * 3600 * 24);

        if (dayDifference < 2 && dayDifference > 1) {
          //increment streak
          user.streak.count += 1;
        } else if (dayDifference > 2) {
          //reset streak
          user.streak.count = 1;
        }
      } else {
        //first streak entry
        user.streak.count = 1;
      }

      // Update last check-in date
      user.streak.lastCheckInDate = localDate;
      await user.save();

      if (user.streak.count >= 365)
        await addBadge(req.user._id, "66bdd76c4063a065bb59a543");
      else if (user.streak.count >= 100)
        await addBadge(req.user._id, "66bddaa9850d513e17874574");
      else if (user.streak.count >= 50)
        await addBadge(req.user._id, "66bdda28850d513e17874570");
      else if (user.streak.count >= 30)
        await addBadge(req.user._id, "66bdd6804063a065bb59a53a");
      else if (user.streak.count >= 10)
        await addBadge(req.user._id, "66bdd6c74063a065bb59a53d");

      return res.json({
        msg: "Well done!",
        streak: user.streak.count,
        lastCheckInDate: lastCheckInDate || null,
        localDate,
        a: lastCheckInDate
          ? (localDate.getTime() - lastCheckInDate.getTime()) /
            (1000 * 3600 * 24)
          : null,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
