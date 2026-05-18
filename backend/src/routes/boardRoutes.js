const express = require('express');
const boardController = require('../controllers/boardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/join/:code', boardController.getBoardByCode);
router.get('/my', protect, boardController.getMyBoards);
router.get('/:id', boardController.getBoardById);

router.use(protect);

router.post('/', boardController.createBoard);
router.patch('/:id/status', boardController.updateBoardStatus);
router.delete('/:id', boardController.deleteBoard);

module.exports = router;