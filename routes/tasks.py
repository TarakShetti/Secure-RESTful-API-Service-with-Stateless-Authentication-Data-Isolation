from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, auth, database

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)

@router.get("/", response_model=List[schemas.Task])
def get_tasks(
    db: Session = Depends(auth.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """Get all tasks for the logged in user."""
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    return tasks

@router.post("/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(auth.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """Create a new task."""
    new_task = models.Task(**task.dict(), user_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/{task_id}", response_model=schemas.Task)
def get_task(
    task_id: int, 
    db: Session = Depends(auth.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """Get a specific task by ID."""
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int, 
    task_update: schemas.TaskCreate, 
    db: Session = Depends(auth.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """Update a specific task."""
    task_query = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
    task = task_query.first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    task_query.update(task_update.dict(), synchronize_session=False)
    db.commit()
    return task_query.first()

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int, 
    db: Session = Depends(auth.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """Delete a specific task."""
    task_query = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
    task = task_query.first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    task_query.delete(synchronize_session=False)
    db.commit()
    return None
