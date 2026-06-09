from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import schemas, database, models

# --- CONFIGURATION ---
# In a real job, these would be in a .env file, not the code!
SECRET_KEY = "my_super_secret_key_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This tells FastAPI that the token will be sent in the "Authorization" header
# as a "Bearer" token. It's the standard way to do it.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")
# --- PASSWORD FUNCTIONS ---

def verify_password(plain_password, hashed_password):
    """Checks if the password entered matches the hash in the DB."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Turns a password (secret123) into a hash ($2b$12$...)."""
    return pwd_context.hash(password)

# --- TOKEN FUNCTIONS ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates the JWT token string."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Add the expiration time to the token data
    to_encode.update({"exp": expire})
    
    # Actually create the token using the secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- THE SECURITY GUARD (Dependency) ---

def get_db():
    """Helper to get a database session."""
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    This function will be used in our routes.
    It takes the token from the request, decodes it, finds the user,
    and returns the User object. If anything is wrong, it throws an error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check if user actually exists in DB
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user