const USER_ID_KEY = 'atoms_user_id';
const LAST_PROJECT_KEY = 'atoms_last_project';

export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

export function getLastProjectId(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export function setLastProjectId(projectId: string): void {
  localStorage.setItem(LAST_PROJECT_KEY, projectId);
}

export function clearLastProjectId(): void {
  localStorage.removeItem(LAST_PROJECT_KEY);
}
