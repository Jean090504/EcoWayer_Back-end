import { Router } from 'express';
import { AIAuditController } from '../controllers/AIAuditController.js';
import { AIRetrainingController } from '../controllers/AIRetrainingController.js';

const router = Router();
const auditController = new AIAuditController();
const retrainingController = new AIRetrainingController();

router.get('/audit', auditController.dashboard.bind(auditController));
router.post('/audit/retraining', retrainingController.enqueueCorrections.bind(retrainingController));

export default router;
