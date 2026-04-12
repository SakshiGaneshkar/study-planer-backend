const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// GET /api/habits
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId, isActive: true });
    res.json({ habits });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching habits.' });
  }
});

// POST /api/habits
router.post('/', auth, async (req, res) => {
  try {
    const habit = new Habit({ ...req.body, user: req.userId });
    await habit.save();
    res.status(201).json({ habit, message: 'Habit created!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error creating habit.' });
  }
});

// PATCH /api/habits/:id/check
router.patch('/:id/check', auth, async (req, res) => {
  try {
    const { date } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });
    
    const isCompleted = habit.completedDates.includes(today);
    if (isCompleted) {
      habit.completedDates = habit.completedDates.filter(d => d !== today);
    } else {
      habit.completedDates.push(today);
    }
    
    // Calculate streak
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    habit.currentStreak = streak;
    if (streak > habit.longestStreak) habit.longestStreak = streak;
    
    await habit.save();
    res.json({ habit, message: isCompleted ? 'Habit unchecked.' : 'Habit completed! 🔥' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating habit.' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Habit.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isActive: false });
    res.json({ message: 'Habit removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting habit.' });
  }
});

module.exports = router;
