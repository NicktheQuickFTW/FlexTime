import { Router } from 'express';
import { ConflictController } from './controllers/ConflictController';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  analyzeScheduleSchema,
  resolveConflictsSchema,
  getConflictDetailsSchema
} from './schemas';

const router = Router();
const controller = new ConflictController();

// Apply authentication to all routes
router.use(authenticate);

// Conflict analysis
router.post('/analyze', validateRequest(analyzeScheduleSchema), controller.analyzeSchedule);
router.get('/schedule/:scheduleId', controller.getScheduleConflicts);
router.get('/:conflictId', controller.getConflictDetails);

// Conflict resolution
router.post('/resolve', validateRequest(resolveConflictsSchema), controller.resolveConflicts);
router.get('/resolutions/:scheduleId', controller.getResolutionHistory);
router.post('/resolutions/:resolutionId/apply', controller.applyResolution);
router.post('/resolutions/:resolutionId/reject', controller.rejectResolution);

// Resolution strategies
router.get('/strategies', controller.listResolutionStrategies);
router.get('/strategies/:strategyId', controller.getStrategyDetails);

// Conflict patterns
router.get('/patterns', controller.getConflictPatterns);
router.get('/patterns/:patternId', controller.getPatternDetails);

// Real-time conflict monitoring
router.ws('/monitor/:scheduleId', controller.monitorConflicts);

// Conflict reports
router.get('/reports/:scheduleId', controller.generateConflictReport);
router.get('/reports/:scheduleId/export', controller.exportConflictReport);

export { router as conflictRouter };