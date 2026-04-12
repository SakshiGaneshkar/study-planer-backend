const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // in minutes
  type: { type: String, enum: ['pomodoro', 'regular', 'focus'], default: 'regular' },
  pomodoroPhase: { type: String, enum: ['work', 'short-break', 'long-break'], default: 'work' },
  energyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  focusScore: { type: Number, min: 0, max: 100, default: 80 },
  notes: { type: String, default: '' },
  distractions: { type: Number, default: 0 },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', studySessionSchema);
