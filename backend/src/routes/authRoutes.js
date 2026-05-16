const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/guest', authController.guestLogin);

router.get('/me', protect, (req, res) => {
  req.user.password = undefined;
  res.status(200).json({ status: 'success', data: { user: req.user } });
});

module.exports = router;