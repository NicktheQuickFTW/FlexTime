import { Router } from 'express';
import { ConstraintController } from './controllers/ConstraintController';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { 
  createConstraintSchema,
  updateConstraintSchema,
  evaluateConstraintSchema,
  bulkEvaluateSchema
} from './schemas';

const router = Router();
const controller = new ConstraintController();

// Apply authentication to all routes
router.use(authenticate);

// Constraint CRUD operations
router.get('/', controller.listConstraints);
router.get('/:id', controller.getConstraint);
router.post('/', validateRequest(createConstraintSchema), controller.createConstraint);
router.put('/:id', validateRequest(updateConstraintSchema), controller.updateConstraint);
router.delete('/:id', controller.deleteConstraint);

// Constraint evaluation
router.post('/evaluate', validateRequest(evaluateConstraintSchema), controller.evaluateConstraint);
router.post('/evaluate/bulk', validateRequest(bulkEvaluateSchema), controller.bulkEvaluateConstraints);

// Constraint templates
router.get('/templates', controller.listTemplates);
router.get('/templates/:id', controller.getTemplate);
router.post('/templates/:id/instantiate', controller.instantiateTemplate);

// Constraint validation
router.post('/validate', controller.validateConstraint);
router.get('/conflicts/:scheduleId', controller.getConflicts);

// Constraint categories
router.get('/categories', controller.listCategories);
router.get('/categories/:category', controller.getConstraintsByCategory);

// Performance metrics
router.get('/metrics', controller.getMetrics);
router.get('/metrics/:id', controller.getConstraintMetrics);

export { router as constraintRouter };