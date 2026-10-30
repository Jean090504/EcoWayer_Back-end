import { Router } from 'express';
import { ListingAIController } from '../controllers/ListingAIController.js';
import { ModerationController } from '../controllers/ModerationController.js';

const router = Router();
const listingAIController = new ListingAIController();
const moderationController = new ModerationController();

router.post('/listings/classify', listingAIController.classify.bind(listingAIController));
router.post('/moderation/review', moderationController.reviewMessage.bind(moderationController));

export default router;
