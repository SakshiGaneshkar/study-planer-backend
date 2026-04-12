const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.userId, isActive: true });
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const subject = new Subject({ ...req.body, user: req.userId });
    await subject.save();
    res.status(201).json({ subject, message: 'Subject added!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    res.json({ subject, message: 'Subject updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Subject.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isActive: false });
    res.json({ message: 'Subject removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
