const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: 'Thank you for your feedback! 🙏' });
  } catch (err) {
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
});

module.exports = router;
