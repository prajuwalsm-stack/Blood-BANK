const router = require('express').Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT blood_group AS bloodGroup, units, updated_at AS updatedAt FROM inventory ORDER BY blood_group');
    res.json(rows);
  } catch (error) { next(error); }
});

// Only logged-in administrators can change stock.
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { bloodGroup, units } = req.body;
    if (!groups.includes(bloodGroup) || !Number.isInteger(Number(units)) || Number(units) < 0) {
      return res.status(400).json({ message: 'Choose a valid blood group and non-negative whole number of units.' });
    }
    await db.execute(
      `INSERT INTO inventory (blood_group, units) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE units = VALUES(units)`,
      [bloodGroup, Number(units)]
    );
    res.json({ message: 'Inventory updated successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
