import os
# Force testing environment before database imports
os.environ["TESTING"] = "True"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, engine
from app.api.dependencies import get_db

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create all tables on the test database
    Base.metadata.create_all(bind=engine)
    yield
    # We can drop tables if we want clean teardown, but keeping them is fine.
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
