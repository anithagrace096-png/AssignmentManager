const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');

// Get all assignments
router.get('/', async (req, res) => {
  try {
    const { subject, status } = req.query;
    let query = {};
    
    if (subject) {
      query.subject = { $regex: new RegExp(subject, 'i') };
    }
    
    if (status) {
      query.status = status;
    }

    const assignments = await Assignment.find(query).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single assignment
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new assignment submission entry
router.post('/', async (req, res) => {
  const { title, subject, dueDate, status, studentName, notes } = req.body;

  const newAssignment = new Assignment({
    title,
    subject,
    dueDate,
    status: status || 'Pending',
    studentName,
    notes
  });

  try {
    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update assignment details or status
router.put('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const fieldsToUpdate = ['title', 'subject', 'dueDate', 'status', 'studentName', 'notes'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        assignment[field] = req.body[field];
      }
    });

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an assignment record
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
