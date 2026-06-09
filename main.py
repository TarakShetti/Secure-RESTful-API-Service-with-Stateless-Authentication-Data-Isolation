from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import models, database
from routes import users, tasks

# 1. CREATE DATABASE TABLES
models.Base.metadata.create_all(bind=database.engine)

# 2. INITIALIZE APP
app = FastAPI(
    title="Task Manager API",
    description="A simple task manager with JWT Auth and a Modern UI",
    version="1.0.0"
)

# Mount static files (CSS, JS, Images)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="templates")

# 3. INCLUDE ROUTERS
app.include_router(users.router)
app.include_router(tasks.router)

# 4. FRONTEND ROUTES
@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    """Render the main dashboard."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    """Render the login page."""
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    """Render the registration page."""
    return templates.TemplateResponse("register.html", {"request": request})