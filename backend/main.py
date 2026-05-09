from dotenv import load_dotenv
load_dotenv()  # must run before any other import that reads env vars

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: F401 — ensures models are registered before create_all
from routers import auth, accounts, statements, transactions, dashboard, recommendations, rules

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinSight API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/auth",            tags=["auth"])
app.include_router(accounts.router,        prefix="/accounts",        tags=["accounts"])
app.include_router(statements.router,      prefix="/statements",      tags=["statements"])
app.include_router(transactions.router,    prefix="/transactions",    tags=["transactions"])
app.include_router(dashboard.router,       prefix="/dashboard",       tags=["dashboard"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(rules.router,           prefix="/rules",           tags=["rules"])


@app.get("/health")
def health():
    return {"status": "ok"}
