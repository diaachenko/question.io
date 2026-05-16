const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/question/:questionId', commentController.getComments);
router.post('/', commentController.createComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;