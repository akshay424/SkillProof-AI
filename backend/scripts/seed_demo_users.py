"""Creates 3 demo Supabase Auth accounts (employee/supervisor/admin) and seeds
their dependent rows (roadmap, weeks, tasks, skill scores, one report) so the
Foundation-phase dashboards render real data end to end.

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set (real project,
not placeholders) and supabase/seed.sql to have already been applied.

Usage: python -m scripts.seed_demo_users
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings  # noqa: E402
from app.database.supabase_client import get_supabase_admin_client  # noqa: E402

ORG_ID = "11111111-1111-1111-1111-111111111111"
LEARNING_PATH_ID = "22222222-2222-2222-2222-222222222222"

WEEK_THEMES = [
    "Flutter Basics",
    "REST API",
    "Firebase",
    "Architecture",
    "State Management",
    "Testing",
    "Performance",
    "Capstone",
]

DEMO_ACCOUNTS = [
    {
        "email": "employee.demo@skillproof.ai",
        "password": "SkillProof!Demo1",
        "full_name": "Aarav Employee",
        "role": "employee",
        "job_title": "Flutter Developer Trainee",
    },
    {
        "email": "supervisor.demo@skillproof.ai",
        "password": "SkillProof!Demo1",
        "full_name": "Priya Supervisor",
        "role": "supervisor",
        "job_title": "Engineering Team Lead",
    },
    {
        "email": "admin.demo@skillproof.ai",
        "password": "SkillProof!Demo1",
        "full_name": "Rohan Admin",
        "role": "admin",
        "job_title": "Platform Administrator",
    },
]


def create_or_get_user(supabase, account: dict) -> str:
    created = supabase.auth.admin.create_user(
        {
            "email": account["email"],
            "password": account["password"],
            "email_confirm": True,
            "user_metadata": {
                "full_name": account["full_name"],
                "role": account["role"],
                "organization_id": ORG_ID,
            },
        }
    )
    return created.user.id


def seed_employee_data(supabase, employee_id: str, supervisor_id: str) -> None:
    supabase.table("user_profiles").update(
        {"supervisor_id": supervisor_id, "job_title": DEMO_ACCOUNTS[0]["job_title"]}
    ).eq("id", employee_id).execute()

    roadmap = (
        supabase.table("roadmaps")
        .insert(
            {
                "user_id": employee_id,
                "learning_path_id": LEARNING_PATH_ID,
                "title": "Flutter Project Readiness Track",
                "total_weeks": 8,
                "status": "in_progress",
                "started_at": "now()",
            }
        )
        .execute()
        .data[0]
    )

    week_rows = []
    for i, theme in enumerate(WEEK_THEMES, start=1):
        status = "completed" if i == 1 else ("active" if i == 2 else "locked")
        week_rows.append(
            {
                "roadmap_id": roadmap["id"],
                "week_number": i,
                "theme": theme,
                "status": status,
            }
        )
    weeks = supabase.table("roadmap_weeks").insert(week_rows).execute().data

    task = (
        supabase.table("tasks")
        .insert(
            {
                "roadmap_week_id": weeks[1]["id"],
                "title": "Build a Weather REST API Client",
                "description": "Consume a public weather REST API and render current conditions in a Flutter screen.",
                "requirements": [
                    "Use Dio for networking",
                    "Handle loading and error states",
                    "Cache the last successful response",
                ],
                "acceptance_criteria": [
                    "App shows a loading indicator while fetching",
                    "Network errors show a retry button",
                    "Unit test covers the API client's error path",
                ],
                "difficulty": "intermediate",
                "estimated_hours": 6,
                "resources": [
                    {"label": "Dio documentation", "url": "https://pub.dev/packages/dio"},
                ],
                "status": "in_progress",
            }
        )
        .execute()
        .data[0]
    )

    completed_task = (
        supabase.table("tasks")
        .insert(
            {
                "roadmap_week_id": weeks[0]["id"],
                "title": "Build a Login Screen",
                "description": "Implement a Flutter login screen with form validation.",
                "requirements": ["TextFormField validation", "Loading state on submit"],
                "acceptance_criteria": ["Invalid email shows inline error"],
                "difficulty": "beginner",
                "estimated_hours": 4,
                "resources": [],
                "status": "completed",
            }
        )
        .execute()
        .data[0]
    )

    submission = (
        supabase.table("submissions")
        .insert(
            {
                "task_id": completed_task["id"],
                "user_id": employee_id,
                "submission_type": "gitlab_url",
                "gitlab_url": "https://gitlab.com/demo-org/login-screen-task",
                "detected_project_type": "flutter",
                "status": "analyzed",
            }
        )
        .execute()
        .data[0]
    )

    supabase.table("evaluation_reports").insert(
        {
            "submission_id": submission["id"],
            "user_id": employee_id,
            "architecture": {"pattern": "MVC", "verdict": "Reasonable for a single screen"},
            "folder_structure": {"verdict": "Clear separation of widgets and services"},
            "problem_solving": {"verdict": "Handled edge cases for empty fields"},
            "code_quality": {"verdict": "Consistent naming, minor duplication in validators"},
            "ai_usage": {"detected": False},
            "evidence": {"files_reviewed": ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"]},
            "suggestions": ["Extract form validators into a shared utility"],
            "confidence": 0.82,
            "overall_score": 78,
        }
    ).execute()

    skill_rows = [
        {"user_id": employee_id, "skill_name": "Flutter", "score": 72, "source": "task_evaluation"},
        {"user_id": employee_id, "skill_name": "Dart", "score": 68, "source": "task_evaluation"},
        {"user_id": employee_id, "skill_name": "Git", "score": 80, "source": "diagnostic"},
        {"user_id": employee_id, "skill_name": "REST API", "score": 55, "source": "diagnostic"},
        {"user_id": employee_id, "skill_name": "Clean Architecture", "score": 40, "source": "diagnostic"},
        {"user_id": employee_id, "skill_name": "Problem Solving", "score": 65, "source": "diagnostic"},
    ]
    supabase.table("skill_scores").insert(skill_rows).execute()


def main() -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SystemExit(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured. "
            "Set real values in backend/.env before running this script."
        )

    supabase = get_supabase_admin_client()

    user_ids = {}
    for account in DEMO_ACCOUNTS:
        user_ids[account["role"]] = create_or_get_user(supabase, account)
        print(f"Created {account['role']}: {account['email']} ({user_ids[account['role']]})")

    seed_employee_data(supabase, user_ids["employee"], user_ids["supervisor"])
    print("Seeded roadmap, tasks, submission, evaluation report, and skill scores for the demo employee.")


if __name__ == "__main__":
    main()
