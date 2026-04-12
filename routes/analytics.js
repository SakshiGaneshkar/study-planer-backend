const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sessions, tasks, habits] = await Promise.all([
      StudySession.find({ user: req.userId, startTime: { $gte: thirtyDaysAgo } }),
      Task.find({ user: req.userId }),
      Habit.find({ user: req.userId, isActive: true })
    ]);

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const delayedTasks = tasks.filter(t => t.isDelayed || t.status === 'overdue').length;
    const totalTasks = tasks.length;

    // Hours per subject
    const subjectHours = {};
    sessions.forEach(s => {
      if (!subjectHours[s.subject]) subjectHours[s.subject] = 0;
      subjectHours[s.subject] += (s.duration || 0) / 60;
    });

    // Daily hours for last 7 days
    const dailyHours = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyHours[dateStr] = 0;
    }
    sessions.forEach(s => {
      const dateStr = s.date;
      if (dailyHours.hasOwnProperty(dateStr)) {
        dailyHours[dateStr] += (s.duration || 0) / 60;
      }
    });

    // Procrastination score
    const procrastinationScore = totalTasks > 0 ? Math.round((delayedTasks / totalTasks) * 100) : 0;

    // Habit completion rate
    const today = new Date().toISOString().split('T')[0];
    const habitsCompletedToday = habits.filter(h => h.completedDates.includes(today)).length;

    res.json({
      totalHours: (totalMinutes / 60).toFixed(1),
      totalSessions: sessions.length,
      completedTasks,
      totalTasks,
      delayedTasks,
      procrastinationScore,
      subjectHours,
      dailyHours,
      habitCompletionRate: habits.length > 0 ? Math.round((habitsCompletedToday / habits.length) * 100) : 0,
      activeHabits: habits.length,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
});

// GET /api/analytics/weekly
router.get('/weekly', auth, async (req, res) => {
  try {
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = await StudySession.find({ user: req.userId, date: dateStr });
      const dayMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      weeklyData.push({
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        hours: parseFloat((dayMinutes / 60).toFixed(1)),
        sessions: daySessions.length,
        avgFocus: daySessions.length > 0
          ? Math.round(daySessions.reduce((sum, s) => sum + (s.focusScore || 80), 0) / daySessions.length)
          : 0
      });
    }
    res.json({ weeklyData });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
