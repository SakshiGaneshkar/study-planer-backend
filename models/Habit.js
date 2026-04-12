const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  targetDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  completedDates: [{ type: String }], // YYYY-MM-DD format
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  color: { type: String, default: '#6C63FF' },
  icon: { type: String, default: '📚' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', habitSchema);
