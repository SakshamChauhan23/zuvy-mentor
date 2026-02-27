export type MockUser = {
  email: string;
  password: string;
  role: "learner" | "mentor" | "admin";
  name: string;
  title: string;
  redirectTo: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    email: "learner@zuvy.com",
    password: "learner123",
    role: "learner",
    name: "Jane Doe",
    title: "Learner",
    redirectTo: "/mentors",
  },
  {
    email: "mentor@zuvy.com",
    password: "mentor123",
    role: "mentor",
    name: "Alex Johnson",
    title: "Senior Engineer",
    redirectTo: "/mentor/dashboard",
  },
  {
    email: "admin@zuvy.com",
    password: "admin123",
    role: "admin",
    name: "Admin",
    title: "Platform Admin",
    redirectTo: "/admin/dashboard",
  },
];

export function authenticateMockUser(
  email: string,
  password: string
): MockUser | null {
  return (
    MOCK_USERS.find(
      (u) => u.email === email.toLowerCase().trim() && u.password === password
    ) ?? null
  );
}
