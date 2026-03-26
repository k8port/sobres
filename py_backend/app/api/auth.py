from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.models import User
from app.db.session import get_db

DEV_USER_ID   = "dev-user-1"
DEV_USER_NAME = "Dev User"

router = APIRouter()


def get_current_user(
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """MVP stub: X-User-Id header is the identity. Replace with JWT later."""
    if not x_user_id:
        return None
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        user = User(id=x_user_id, name=DEV_USER_NAME)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def require_user(current_user: User | None = Depends(get_current_user)) -> User:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user


@router.get("/api/auth/me")
def me(current_user: User | None = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"id": current_user.id, "name": current_user.name}
