import sqlite3
from pysqlcipher3 import dbapi2 as sqlcipher
import hashlib
import os

class EncryptedDB:
    """Manages an encrypted SQLite database using SQLCipher."""

    def __init__(self, db_path, password, salt_size=16, iterations=100000):
        self.db_path = db_path
        self.password = password
        self.salt_size = salt_size
        self.iterations = iterations
        self.conn = None

    def _derive_key(self, salt):
        """Derives a key from the password and salt using PBKDF2."""
        return hashlib.pbkdf2_hmac('sha256', self.password.encode('utf-8'), salt, self.iterations)

    def connect(self):
        """Connects to the encrypted database, creating it if it doesn't exist."""
        # For a new database, generate and store a salt
        salt_path = self.db_path + '.salt'
        if not os.path.exists(self.db_path):
            salt = os.urandom(self.salt_size)
            with open(salt_path, 'wb') as f:
                f.write(salt)
        else:
            with open(salt_path, 'rb') as f:
                salt = f.read()

        key = self._derive_key(salt).hex()
        
        self.conn = sqlcipher.connect(self.db_path)
        self.conn.execute(f'PRAGMA key = "x\'{key}\'"')
        self.conn.execute('PRAGMA cipher_page_size = 4096')
        self.conn.execute('PRAGMA kdf_iter = 64000')
        self.conn.execute('PRAGMA cipher_hmac_algorithm = HMAC_SHA256')
        self.conn.execute('PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA256')

    def execute_query(self, query, params=()):
        """Executes a given SQL query."""
        if not self.conn:
            self.connect()
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        self.conn.commit()
        return cursor

    def close(self):
        """Closes the database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
