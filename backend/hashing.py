# Import CryptContext from passlib.context. CryptContext is a simple wrapper for hashing passwords.
from passlib.context import CryptContext

# Create a CryptContext instance and specify the hashing scheme as bcrypt.
# The deprecated parameter is set to "auto" to automatically handle deprecated hashes.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Function to hash a password
def get_hashed_password(password):
    # Use the CryptContext instance to hash the password
    return pwd_context.hash(password)


# Function to verify a password against a hashed password
def verify_password(plain_password, hashed_password):
    # Use the CryptContext instance to verify the plain password against the hashed password
    return pwd_context.verify(plain_password, hashed_password)
