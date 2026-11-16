const router = require('express').Router();
const db = require('../db');

const validGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

router.post('/', async (req, res, next) => {
  try {
    const { fullName, age, gender, bloodGroup, phone, email, city, lastDonationDate } = req.body;
    if (!fullName || !age || Number(age) < 18 || Number(age) > 65 ||
        !validGroups.includes(bloodGroup) || !phone || !city) {
      return res.status(400).json({ message: 'Enter valid details. Donor age must be 18–65 for this demo.' });
    }
    const [result] = await db.execute(
      `INSERT INTO donors (full_name, age, gender, blood_group, phone, email, city, last_donation_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName.trim(), Number(age), gender || null, bloodGroup, phone.trim(),
       email || null, city.trim(), lastDonationDate || null]
    );
    res.status(201).json({ message: 'Donor registered successfully', id: result.insertId });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const { bloodGroup, city } = req.query;
    let sql = 'SELECT id, full_name, age, gender, blood_group, city, available FROM donors WHERE available = 1';
    const params = [];
    if (bloodGroup && validGroups.includes(bloodGroup)) {
      sql += ' AND blood_group = ?'; params.push(bloodGroup);
    }
    if (city) { sql += ' AND city LIKE ?'; params.push(`%${city}%`); }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (error) { next(error); }
});

module.exports = router;
