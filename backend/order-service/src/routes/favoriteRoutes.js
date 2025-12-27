const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', favoriteController.getUserFavorites);
router.post('/:product_id', favoriteController.addFavorite);
router.delete('/:product_id', favoriteController.removeFavorite);
router.get('/:product_id/check', favoriteController.isFavorite);

module.exports = router;
