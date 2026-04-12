const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#6C63FF' },
  icon: { type: String, default: '📖' },
  targetHoursPerWeek: { type: Number, default: 5 },
  totalHoursStudied: { type: Number, default: 0 },
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  topics: [{
    name: { type: String },
    mastery: { type: Number, min: 0, max: 100, default: 0 },
    lastRevised: { type: Date, default: null },
    revisionCount: { type: Number, default: 0 }
  }],
  examDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
