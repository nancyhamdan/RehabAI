from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_hashed_password(password):
    return pwd_context.hash(password)


# Password Hashing Function
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
