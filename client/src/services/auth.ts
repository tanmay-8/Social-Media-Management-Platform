export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = 'sma_users';

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function signupUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StoredUser> {
  const users = readUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase()
  );
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user: StoredUser = {
    id: 'user-' + Date.now().toString(),
    name: input.name,
    email: input.email,
    password: input.password
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<StoredUser> {
  const users = readUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === input.email.toLowerCase() &&
      u.password === input.password
  );
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  return user;
}





