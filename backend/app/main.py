from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, auth, health, interview, reports, roadmaps, submissions, tasks

settings = get_settings()

app = FastAPI(
    title="SkillProof AI API",
    description="Backend for AI-powered employee learning & project readiness evaluation.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(roadmaps.router)
app.include_router(tasks.router)
app.include_router(submissions.router)
app.include_router(reports.router)
app.include_router(interview.router)


@app.get("/")
def root() -> dict:
    return {"name": "SkillProof AI API", "status": "running"}
