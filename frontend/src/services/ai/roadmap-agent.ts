import { completeJSON } from "@/services/ai/openai-client";
import { DEMO_MODE } from "@/utils/demo-mode";
import type { TaskDifficulty, TaskResource } from "@/types/task";

export interface GeneratedTask {
  title: string;
  description: string;
  requirements: string[];
  acceptanceCriteria: string[];
  difficulty: TaskDifficulty;
  estimatedHours: number;
  resources: TaskResource[];
}

export interface GeneratedWeek {
  weekNumber: number;
  theme: string;
  summary: string;
  task: GeneratedTask;
}

export interface GeneratedRoadmap {
  title: string;
  weeks: GeneratedWeek[];
}

const SYSTEM_PROMPT = `You are a senior engineering mentor designing an 8-week, project-readiness roadmap for a
newly hired fresher software developer. Read their resume and interview evaluation, then produce a
personalized week-by-week roadmap. Each week must have exactly one hands-on coding task that builds
toward real project readiness (not quizzes). Weight difficulty and topics to the fresher's actual gaps
mentioned in the interview notes. Respond with strict JSON matching this exact shape, no prose outside JSON:
{
  "title": string,
  "weeks": [
    {
      "weekNumber": number (1-8),
      "theme": string,
      "summary": string (1 sentence),
      "task": {
        "title": string,
        "description": string,
        "requirements": string[],
        "acceptanceCriteria": string[],
        "difficulty": "beginner" | "intermediate" | "advanced",
        "estimatedHours": number,
        "resources": [{ "label": string, "url": string }]
      }
    }
  ]
}`;

const DEMO_ROADMAP: GeneratedRoadmap = {
  title: "Flutter Project Readiness Track",
  weeks: [
    {
      weekNumber: 1,
      theme: "Flutter Basics",
      summary: "Widgets, layouts, and navigation fundamentals.",
      task: {
        title: "Build a Login Screen",
        description: "Implement a Flutter login screen with form validation and a loading state on submit.",
        requirements: ["TextFormField validation", "Loading state on submit"],
        acceptanceCriteria: ["Invalid email shows inline error", "Submit button disables while loading"],
        difficulty: "beginner",
        estimatedHours: 4,
        resources: [],
      },
    },
    {
      weekNumber: 2,
      theme: "REST API",
      summary: "Consuming REST APIs with Dio and error handling.",
      task: {
        title: "Build a Weather REST API Client",
        description: "Consume a public weather REST API and render current conditions in a Flutter screen.",
        requirements: ["Use Dio for networking", "Handle loading and error states"],
        acceptanceCriteria: ["Loading indicator while fetching", "Network errors show a retry button"],
        difficulty: "intermediate",
        estimatedHours: 6,
        resources: [{ label: "Dio documentation", url: "https://pub.dev/packages/dio" }],
      },
    },
    {
      weekNumber: 3,
      theme: "Firebase",
      summary: "Auth, Firestore, and push notifications.",
      task: {
        title: "Add Firebase Auth",
        description: "Wire up Firebase email/password auth alongside the existing login screen.",
        requirements: ["FirebaseAuth sign-in/sign-up", "Persist session across restarts"],
        acceptanceCriteria: ["User stays logged in after app restart"],
        difficulty: "intermediate",
        estimatedHours: 6,
        resources: [],
      },
    },
    {
      weekNumber: 4,
      theme: "Architecture",
      summary: "Clean Architecture and Repository Pattern.",
      task: {
        title: "Refactor to a Repository Layer",
        description: "Introduce a repository layer between UI and the API/Firebase clients.",
        requirements: ["Repository interfaces", "Dependency injection for repositories"],
        acceptanceCriteria: ["UI no longer calls Dio/Firebase directly"],
        difficulty: "advanced",
        estimatedHours: 8,
        resources: [],
      },
    },
    {
      weekNumber: 5,
      theme: "State Management",
      summary: "Provider, Riverpod, and Bloc.",
      task: {
        title: "Migrate State to Riverpod",
        description: "Replace setState-based state with Riverpod providers for the auth and weather features.",
        requirements: ["StateNotifierProvider for auth", "FutureProvider for weather"],
        acceptanceCriteria: ["No remaining setState for shared state"],
        difficulty: "advanced",
        estimatedHours: 8,
        resources: [],
      },
    },
    {
      weekNumber: 6,
      theme: "Testing",
      summary: "Unit, widget, and integration tests.",
      task: {
        title: "Add Unit and Widget Tests",
        description: "Cover the repository layer with unit tests and the login screen with widget tests.",
        requirements: ["3+ unit tests", "1+ widget test"],
        acceptanceCriteria: ["All tests pass in CI"],
        difficulty: "intermediate",
        estimatedHours: 6,
        resources: [],
      },
    },
    {
      weekNumber: 7,
      theme: "Performance",
      summary: "Profiling and optimizing render performance.",
      task: {
        title: "Profile and Optimize List Rendering",
        description: "Use Flutter DevTools to find and fix unnecessary rebuilds in the main list screen.",
        requirements: ["Use const constructors where possible", "Add ListView.builder if missing"],
        acceptanceCriteria: ["No dropped frames in DevTools timeline for the list screen"],
        difficulty: "advanced",
        estimatedHours: 6,
        resources: [],
      },
    },
    {
      weekNumber: 8,
      theme: "Capstone",
      summary: "End-to-end project combining every skill so far.",
      task: {
        title: "Capstone: Ship a Small Full-Stack Feature",
        description: "Combine auth, API, architecture, state management, and tests into one cohesive feature.",
        requirements: ["Uses the repository layer", "Uses Riverpod", "Has tests"],
        acceptanceCriteria: ["Feature works end-to-end on a real device/emulator"],
        difficulty: "advanced",
        estimatedHours: 10,
        resources: [],
      },
    },
  ],
};

export async function generateRoadmap(resumeText: string, interviewNotes: string): Promise<GeneratedRoadmap> {
  if (DEMO_MODE) {
    return DEMO_ROADMAP;
  }

  const user = `Resume:\n${resumeText}\n\nInterview evaluation notes:\n${interviewNotes}`;
  return completeJSON<GeneratedRoadmap>(SYSTEM_PROMPT, user);
}
