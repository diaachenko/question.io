const express = require('express');
const boardController = require('../controllers/boardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/join/:code', boardController.getBoardByCode);

router.use(protect);

router.post('/', boardController.createBoard);
router.get('/my', boardController.getMyBoards);
router.patch('/:id/status', boardController.updateBoardStatus);
router.get('/:id', boardController.getBoardById);

router.delete('/:id', boardController.deleteBoard);

module.exports = router;