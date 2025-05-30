from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from ..schemas import OptimizationRequest, OptimizationResponse, OptimizationStatus
from ..services.optimizer import ScheduleOptimizer
from ..dependencies import get_current_user

router = APIRouter()

@router.post("/schedule", response_model=OptimizationResponse)
async def optimize_schedule(
    request: OptimizationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Optimize a schedule using ML algorithms
    """
    try:
        optimizer = ScheduleOptimizer()
        result = await optimizer.optimize(
            schedule=request.schedule,
            constraints=request.constraints,
            objective=request.objective,
            parameters=request.parameters
        )
        return OptimizationResponse(
            status="success",
            optimized_schedule=result.schedule,
            score=result.score,
            improvements=result.improvements,
            execution_time=result.execution_time
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch", response_model=List[OptimizationResponse])
async def batch_optimize(
    requests: List[OptimizationRequest],
    current_user: Dict = Depends(get_current_user)
):
    """
    Optimize multiple schedules in batch
    """
    try:
        optimizer = ScheduleOptimizer()
        results = await optimizer.batch_optimize(requests)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{optimization_id}", response_model=OptimizationStatus)
async def get_optimization_status(
    optimization_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get the status of an ongoing optimization
    """
    try:
        optimizer = ScheduleOptimizer()
        status = await optimizer.get_status(optimization_id)
        if not status:
            raise HTTPException(status_code=404, detail="Optimization not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel/{optimization_id}")
async def cancel_optimization(
    optimization_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Cancel an ongoing optimization
    """
    try:
        optimizer = ScheduleOptimizer()
        cancelled = await optimizer.cancel(optimization_id)
        if not cancelled:
            raise HTTPException(status_code=404, detail="Optimization not found")
        return {"message": "Optimization cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/algorithms")
async def list_optimization_algorithms():
    """
    List available optimization algorithms
    """
    return {
        "algorithms": [
            {
                "id": "genetic",
                "name": "Genetic Algorithm",
                "description": "Evolutionary algorithm for complex constraint satisfaction",
                "parameters": ["population_size", "mutation_rate", "generations"]
            },
            {
                "id": "simulated_annealing",
                "name": "Simulated Annealing",
                "description": "Probabilistic technique for approximating global optimum",
                "parameters": ["initial_temp", "cooling_rate", "iterations"]
            },
            {
                "id": "particle_swarm",
                "name": "Particle Swarm Optimization",
                "description": "Swarm intelligence-based optimization",
                "parameters": ["swarm_size", "inertia", "cognitive_weight", "social_weight"]
            },
            {
                "id": "reinforcement_learning",
                "name": "Reinforcement Learning",
                "description": "RL-based schedule optimization using PPO",
                "parameters": ["learning_rate", "batch_size", "epochs"]
            }
        ]
    }

@router.post("/parameters/tune")
async def tune_optimization_parameters(
    algorithm: str,
    sample_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """
    Automatically tune optimization parameters using Optuna
    """
    try:
        optimizer = ScheduleOptimizer()
        best_params = await optimizer.tune_parameters(algorithm, sample_data)
        return {
            "algorithm": algorithm,
            "best_parameters": best_params,
            "message": "Parameters tuned successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))