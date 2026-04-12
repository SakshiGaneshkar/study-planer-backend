const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/sessions
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, date, week } = req.query;
    const filter = { user: req.userId };
    
    if (date) {
      filter.date = date;
    } else if (week) {
      const weekStart = new Date(week);
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filter.startTime = { $gte: weekStart, $lt: weekEnd };
    }
    
    const sessions = await StudySession.find(filter)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));
    
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    res.json({ sessions, totalMinutes, totalHours: (totalMinutes / 60).toFixed(1) });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching sessions.' });
  }
});

// POST /api/sessions/start
router.post('/start', auth, async (req, res) => {
  try {
    const { subject, type, energyLevel, taskId } = req.body;
    const session = new StudySession({
      user: req.userId,
      subject,
      type: type || 'regular',
      energyLevel: energyLevel || 'medium',
      task: taskId || null,
      startTime: new Date(),
      date: new Date().toISOString().split('T')[0]
    });
    await session.save();
    res.status(201).json({ session, message: 'Study session started!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error starting session.' });
  }
});

// PUT /api/sessions/:id/end
router.put('/:id/end', auth, async (req, res) => {
  try {
    const { distractions, focusScore, notes } = req.body;
    const session = await StudySession.findOne({ _id: req.params.id, user: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    
    session.endTime = new Date();
    session.duration = Math.round((session.endTime - session.startTime) / 60000);
    session.distractions = distractions || 0;
    session.focusScore = focusScore || 80;
    session.notes = notes || '';
    await session.save();

    // Update user total hours
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalStudyHours: session.duration / 60 }
    });

    res.json({ session, message: `Session complete! You studied for ${session.duration} minutes.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error ending session.' });
  }
});

// POST /api/sessions (log completed session directly)
router.post('/', auth, async (req, res) => {
  try {
    const sessionData = { ...req.body, user: req.userId };
    if (!sessionData.date) sessionData.date = new Date().toISOString().split('T')[0];
    const session = new StudySession(sessionData);
    await session.save();
    res.status(201).json({ session, message: 'Session logged!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error logging session.' });
  }
});

// GET /api/sessions/burnout-check
router.get('/burnout-check', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const sessions = await StudySession.find({
      user: req.userId,
      startTime: { $gte: sevenDaysAgo }
    });
    
    const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
    const dailyAvg = totalHours / 7;
    const user = await User.findById(req.userId);
    const goalHours = user.studyGoalHours || 4;
    
    let burnoutLevel = 'normal';
    let message = 'Your study schedule looks balanced!';
    let suggestion = 'Keep up the great work!';
    
    if (dailyAvg > goalHours * 1.5) {
      burnoutLevel = 'high';
      message = '⚠️ You might be overworking yourself!';
      suggestion = 'Consider taking a rest day and reducing tomorrow\'s study load.';
    } else if (dailyAvg > goalHours * 1.2) {
      burnoutLevel = 'moderate';
      message = '⚡ You\'re studying a bit more than usual.';
      suggestion = 'Make sure to take regular breaks and sleep well.';
    } else if (dailyAvg < goalHours * 0.3 && totalHours > 0) {
      burnoutLevel = 'low';
      message = '📉 Your study hours are below your goal.';
      suggestion = 'Try to gradually increase your study time. Small steps work!';
    }
    
    res.json({ burnoutLevel, totalHours: totalHours.toFixed(1), dailyAvg: dailyAvg.toFixed(1), goalHours, message, suggestion, weekSessions: sessions.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error checking burnout.' });
  }
});

module.exports = router;
