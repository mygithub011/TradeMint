
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.models.models import User
from app.utils.auth import verify_password, get_password_hash, create_access_token
from app.utils.schemas import UserRegister, Token, UserResponse, UserProfileUpdate, UserProfileResponse
from app.utils.config import settings
from app.utils.dependencies import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (admin, trader, or client)."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        role=user_data.role.value
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get JWT access token."""
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/accept-terms")
def accept_terms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Accept Terms & Conditions for the current user."""
    from datetime import datetime
    
    current_user.terms_accepted = True
    current_user.terms_accepted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Terms accepted successfully",
        "terms_accepted": True,
        "terms_accepted_at": current_user.terms_accepted_at
    }

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's complete profile."""
    # Count enrolled courses (active subscriptions)
    active_subs = len([s for s in current_user.subscriptions if s.status == 'ACTIVE'])
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        name=current_user.name,
        phone=current_user.phone,
        dob=current_user.dob,
        gender=current_user.gender,
        pan=current_user.pan,
        profile_photo=current_user.profile_photo,
        enrolled_courses=active_subs
    )

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile. PAN and phone cannot be changed once set."""
    # Check if trying to update immutable fields
    if profile_data.pan and current_user.pan and profile_data.pan != current_user.pan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PAN number cannot be changed once set"
        )
    
    if profile_data.phone and current_user.phone and profile_data.phone != current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number cannot be changed once set"
        )
    
    # Update allowed fields
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.dob is not None:
        current_user.dob = profile_data.dob
    if profile_data.gender is not None:
        current_user.gender = profile_data.gender
    if profile_data.pan and not current_user.pan:  # Only set if not already set
        current_user.pan = profile_data.pan
    if profile_data.phone and not current_user.phone:  # Only set if not already set
        current_user.phone = profile_data.phone
    
    db.commit()
    db.refresh(current_user)
    
    # Count enrolled courses
    active_subs = len([s for s in current_user.subscriptions if s.status == 'ACTIVE'])
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        name=current_user.name,
        phone=current_user.phone,
        dob=current_user.dob,
        gender=current_user.gender,
        pan=current_user.pan,
        profile_photo=current_user.profile_photo,
        enrolled_courses=active_subs
    )
