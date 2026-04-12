const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, required: true, trim: true },
  subjectColor: { type: String, default: '#6C63FF' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'overdue'], default: 'pending' },
  deadline: { type: Date, required: true },
  estimatedHours: { type: Number, default: 1 },
  actualHours: { type: Number, default: 0 },
  energyRequired: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [{ type: String }],
  isDelayed: { type: Boolean, default: false },
  delayCount: { type: Number, default: 0 },
  completedAt: { type: Date, default: null },
  scheduledDate: { type: Date, default: null },
  pomodoroCount: { type: Number, default: 0 },
  revisionDates: [{ type: Date }],
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status !== 'completed' && this.deadline < new Date() && this.status !== 'overdue') {
    this.status = 'overdue';
    this.isDelayed = true;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
