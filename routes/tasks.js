const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, subject, priority, date } = req.query;
    const filter = { user: req.userId };
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (priority) filter.priority = priority;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduledDate = { $gte: start, $lt: end };
    }
    const tasks = await Task.find(filter).sort({ deadline: 1, priority: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const taskData = { ...req.body, user: req.userId };
    const task = new Task(taskData);
    await task.save();
    res.status(201).json({ task, message: 'Task created successfully!' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error creating task.' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task, message: 'Task updated successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating task.' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting task.' });
  }
});

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ task, message: 'Task completed! Great job! 🎉' });
  } catch (err) {
    res.status(500).json({ message: 'Server error completing task.' });
  }
});

// POST /api/tasks/generate-plan
router.post('/generate-plan', auth, async (req, res) => {
  try {
    const { subjects, deadline, dailyHours, energyPattern } = req.body;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return res.status(400).json({ message: 'Deadline must be in the future.' });
    }

    const plan = [];
    const hoursPerSubject = Math.floor((daysLeft * dailyHours) / subjects.length);
    
    subjects.forEach((subject, idx) => {
      const subjectDeadline = new Date(today);
      subjectDeadline.setDate(today.getDate() + Math.floor((idx + 1) * daysLeft / subjects.length));
      
      plan.push({
        title: `Study ${subject}`,
        subject,
        priority: idx < 2 ? 'high' : 'medium',
        deadline: subjectDeadline,
        estimatedHours: hoursPerSubject,
        energyRequired: energyPattern === 'morning' ? 'high' : 'medium',
        scheduledDate: new Date(today.getTime() + idx * 24 * 60 * 60 * 1000),
        user: req.userId
      });
    });

    const createdTasks = await Task.insertMany(plan);
    res.json({ tasks: createdTasks, message: `Generated ${createdTasks.length} study tasks!`, daysLeft, totalHours: daysLeft * dailyHours });
  } catch (err) {
    res.status(500).json({ message: 'Server error generating plan.' });
  }
});

module.exports = router;
