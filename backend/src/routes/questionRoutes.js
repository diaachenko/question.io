const express = require('express');
const questionController = require('../controllers/questionController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload'); 

const router = express.Router();

router.use(protect);

router.get('/board/:boardId', questionController.getQuestions);

router.post('/', upload.single('image'), questionController.createQuestion);

router.post('/:id/vote', questionController.voteQuestion);

router.patch('/:id/answered', questionController.markAsAnswered);

router.delete('/:id', questionController.deleteQuestion);

module.exports = router;