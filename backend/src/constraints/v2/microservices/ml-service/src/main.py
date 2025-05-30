from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from prometheus_client import make_asgi_app
from .routers import optimization, prediction, training, models
from .services.message_broker import MessageBroker
from .services.model_manager import ModelManager
from .config import settings

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ML service...")
    
    # Initialize message broker
    message_broker = MessageBroker()
    await message_broker.connect()
    app.state.message_broker = message_broker
    
    # Initialize model manager
    model_manager = ModelManager()
    await model_manager.initialize()
    app.state.model_manager = model_manager
    
    # Set up message consumers
    await message_broker.consume('ml.optimize', handle_optimization_request)
    await message_broker.consume('ml.predict', handle_prediction_request)
    
    logger.info("ML service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML service...")
    await message_broker.disconnect()
    await model_manager.cleanup()

# Create FastAPI app
app = FastAPI(
    title="ML Service",
    description="Machine learning optimization service for constraint system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include routers
app.include_router(optimization.router, prefix="/api/v1/optimization", tags=["optimization"])
app.include_router(prediction.router, prefix="/api/v1/prediction", tags=["prediction"])
app.include_router(training.router, prefix="/api/v1/training", tags=["training"])
app.include_router(models.router, prefix="/api/v1/models", tags=["models"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0"
    }

# Message handlers
async def handle_optimization_request(message):
    """Handle optimization requests from message broker"""
    try:
        model_manager = app.state.model_manager
        result = await model_manager.optimize_schedule(
            schedule_data=message["schedule"],
            constraints=message["constraints"],
            optimization_params=message.get("params", {})
        )
        return result
    except Exception as e:
        logger.error(f"Error handling optimization request: {e}")
        raise

async def handle_prediction_request(message):
    """Handle prediction requests from message broker"""
    try:
        model_manager = app.state.model_manager
        result = await model_manager.predict_conflicts(
            schedule_data=message["schedule"],
            constraints=message["constraints"]
        )
        return result
    except Exception as e:
        logger.error(f"Error handling prediction request: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3003)