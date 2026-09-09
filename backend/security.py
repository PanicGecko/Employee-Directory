import hashlib
import hmac
import os

from pwdlib import PasswordHash
from pwdlib.exceptions import HasherNotAvailable

PBKDF2_ITERATIONS = 600_000

try:
    password_hash = PasswordHash.recommended()
except HasherNotAvailable:
    password_hash = None


def hash_password(password: str) -> str:
    if password_hash is not None:
        return password_hash.hash(password)

    salt = os.urandom(16)
    hashed_password = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    ).hex()

    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${hashed_password}"


def verify_password(plain: str, hashed: str) -> bool:
    if password_hash is not None:
        try:
            return password_hash.verify(plain, hashed)
        except Exception:
            return False

    parts = hashed.split("$")

    if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
        return False

    try:
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = parts[3]
    except ValueError:
        return False

    actual_hash = hashlib.pbkdf2_hmac(
        "sha256",
        plain.encode("utf-8"),
        salt,
        iterations,
    ).hex()

    return hmac.compare_digest(actual_hash, expected_hash)


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
