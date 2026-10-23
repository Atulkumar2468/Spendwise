import express from 'express';
import {
  getSummary,
  getMonthlyHistory,
  getCategoryAnalytics,
  downloadPdfStatement,
  emailMonthlyStatement,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyHistory);
router.get('/categories', getCategoryAnalytics);
router.get('/statement/pdf', downloadPdfStatement);
router.post('/statement/email', emailMonthlyStatement);

export default router;
