const router = require('express').Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const urgencies = ['Normal','Urgent','Emergency'];
const statuses = ['Pending','Approved','Rejected','Completed'];

// 1. Submit a blood request (logged-in users only)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      patientName, bloodGroup, units,
      hospital, city, contactPhone, urgency
    } = req.body;

    if (
      !patientName || !groups.includes(bloodGroup) ||
      !Number.isInteger(Number(units)) || Number(units) < 1 ||
      !hospital || !city || !contactPhone ||
      !urgencies.includes(urgency || 'Normal')
    ) {
      return res.status(400).json({
        message: 'Please complete all fields with valid values.'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO blood_requests
       (user_id, patient_name, blood_group, units, hospital, city, contact_phone, urgency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        patientName.trim(),
        bloodGroup,
        Number(units),
        hospital.trim(),
        city.trim(),
        contactPhone.trim(),
        urgency || 'Normal'
      ]
    );

    res.status(201).json({
      message: 'Blood request submitted successfully.',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// 2. Show all blood requests to logged-in users
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, patient_name AS patientName,
       blood_group AS bloodGroup, units, hospital, city,
       contact_phone AS contactPhone, urgency, status,
       created_at AS createdAt
       FROM blood_requests
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// 3. Show requests submitted by the logged-in user
router.get('/mine', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, patient_name AS patientName,
       blood_group AS bloodGroup, units, hospital, city,
       contact_phone AS contactPhone, urgency, status,
       created_at AS createdAt
       FROM blood_requests
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// 4. Admin updates a blood request status
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id < 1 || !statuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid request ID or status.'
      });
    }

    const [result] = await db.execute(
      'UPDATE blood_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Blood request not found.'
      });
    }

    res.json({
      message: 'Blood request status updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;