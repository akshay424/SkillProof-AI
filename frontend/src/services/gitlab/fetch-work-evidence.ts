import { gitlabFetchJson, parseProjectPath } from "@/services/gitlab/gitlab-client";
import { DEMO_MODE } from "@/utils/demo-mode";

const MAX_COMMITS = 20;
const MAX_DIFF_CHARS = 8000;

export interface CommitEvidence {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  authored_date: string;
}

export type BuildStatus = "passed" | "failed" | "blocked" | "unknown";

export interface WorkEvidence {
  repository: string;
  branch: string;
  baseCommit: string | null;
  headCommit: string | null;
  commits: CommitEvidence[];
  diff: string;
  filesChanged: string[];
  buildStatus: BuildStatus;
  testsPassed: number | null;
  testsFailed: number | null;
  reviewComments: string[];
}

interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  authored_date: string;
}

interface GitLabDiff {
  old_path: string;
  new_path: string;
  diff: string;
}

interface GitLabStatus {
  status: string;
  name: string;
}

interface GitLabMergeRequest {
  iid: number;
}

interface GitLabNote {
  body: string;
  system: boolean;
}

const DEMO_EVIDENCE: WorkEvidence = {
  repository: "demo/flutter-login-task",
  branch: "evaluate",
  baseCommit: "a1b2c3d",
  headCommit: "e4f5g6h",
  commits: [
    {
      id: "a1b2c3d4e5f6",
      short_id: "a1b2c3d",
      title: "Add login screen with form validation",
      message: "Add login screen with form validation",
      author_name: "Aarav Patel",
      authored_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "e4f5g6h7i8j9",
      short_id: "e4f5g6h",
      title: "Handle loading state and error responses",
      message: "Handle loading state and error responses on sign-in",
      author_name: "Aarav Patel",
      authored_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
  diff: `--- a/lib/screens/login_screen.dart
+++ b/lib/screens/login_screen.dart
@@ -1,10 +1,28 @@
 class LoginScreen extends StatefulWidget {
   @override
   State<LoginScreen> createState() => _LoginScreenState();
 }

 class _LoginScreenState extends State<LoginScreen> {
   final _formKey = GlobalKey<FormState>();
   bool _isLoading = false;
+  String? _error;

   Future<void> _submit() async {
     if (!_formKey.currentState!.validate()) return;
     setState(() => _isLoading = true);
-    await AuthService().signIn(_email, _password);
-    setState(() => _isLoading = false);
+    try {
+      await AuthService().signIn(_email, _password);
+    } catch (e) {
+      setState(() => _error = 'Invalid email or password');
+    } finally {
+      setState(() => _isLoading = false);
+    }
   }
 }`,
  filesChanged: ["lib/screens/login_screen.dart", "lib/services/auth_service.dart"],
  buildStatus: "passed",
  testsPassed: 3,
  testsFailed: 0,
  reviewComments: [],
};

export async function fetchWorkEvidence(
  gitlabUrl: string,
  branch: string,
  token?: string,
): Promise<WorkEvidence> {
  if (DEMO_MODE) {
    return DEMO_EVIDENCE;
  }

  const host = new URL(gitlabUrl).host;
  const projectPath = encodeURIComponent(parseProjectPath(gitlabUrl));

  const commits = await gitlabFetchJson<GitLabCommit[]>(
    host,
    `/projects/${projectPath}/repository/commits?ref_name=${encodeURIComponent(branch)}&per_page=${MAX_COMMITS}`,
    token,
  );

  if (commits.length === 0) {
    throw new Error(`No commits found on branch "${branch}".`);
  }

  const headCommit = commits[0];
  const baseCommit = commits[commits.length - 1];

  const diffsByCommit = await Promise.all(
    commits.map((c) =>
      gitlabFetchJson<GitLabDiff[]>(
        host,
        `/projects/${projectPath}/repository/commits/${c.id}/diff`,
        token,
      ).catch(() => [] as GitLabDiff[]),
    ),
  );

  const filesChanged = Array.from(
    new Set(diffsByCommit.flat().map((d) => d.new_path || d.old_path)),
  );

  let diff = diffsByCommit
    .flat()
    .map((d) => `--- a/${d.old_path}\n+++ b/${d.new_path}\n${d.diff}`)
    .join("\n\n");
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n... (truncated)";
  }

  let buildStatus: BuildStatus = "unknown";
  try {
    const statuses = await gitlabFetchJson<GitLabStatus[]>(
      host,
      `/projects/${projectPath}/repository/commits/${headCommit.id}/statuses`,
      token,
    );
    if (statuses.length > 0) {
      const latest = statuses[0].status;
      buildStatus = latest === "success" ? "passed" : latest === "failed" ? "failed" : "blocked";
    }
  } catch {
    // No CI configured on this project — leave as "unknown" rather than failing the evaluation.
  }

  let reviewComments: string[] = [];
  try {
    const mrs = await gitlabFetchJson<GitLabMergeRequest[]>(
      host,
      `/projects/${projectPath}/merge_requests?source_branch=${encodeURIComponent(branch)}&state=all`,
      token,
    );
    if (mrs.length > 0) {
      const notes = await gitlabFetchJson<GitLabNote[]>(
        host,
        `/projects/${projectPath}/merge_requests/${mrs[0].iid}/notes`,
        token,
      );
      reviewComments = notes.filter((n) => !n.system).map((n) => n.body);
    }
  } catch {
    // No merge request for this branch yet — reviewComments stays empty.
  }

  return {
    repository: projectPath,
    branch,
    baseCommit: baseCommit.short_id,
    headCommit: headCommit.short_id,
    commits: commits.map((c) => ({
      id: c.id,
      short_id: c.short_id,
      title: c.title,
      message: c.message,
      author_name: c.author_name,
      authored_date: c.authored_date,
    })),
    diff,
    filesChanged,
    buildStatus,
    testsPassed: null,
    testsFailed: null,
    reviewComments,
  };
}
