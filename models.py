from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # This relationship links the User to their Tasks.
    # "back_populates" means if you have a Task, you can check 'task.owner' to see the User.
    tasks = relationship("Task", back_populates="owner")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)
    completed = Column(Boolean, default=False)
    
    # The Foreign Key is the actual link in the database.
    # It says: "This column stores the ID of a row in the 'users' table."
    user_id = Column(Integer, ForeignKey("users.id"))

    # This allows us to access the user object from a task (e.g., my_task.owner.email)
    owner = relationship("User", back_populates="tasks")