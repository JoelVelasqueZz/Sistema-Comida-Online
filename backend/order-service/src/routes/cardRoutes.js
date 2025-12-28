const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', cardController.getUserCards);
router.post('/', cardController.saveCard);
router.patch('/:id/default', cardController.setDefaultCard);
router.delete('/:id', cardController.deleteCard);

module.exports = router;
