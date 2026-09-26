// Password strength rules (user's decision: at least 8 characters with a
// lowercase letter, an uppercase letter, a digit and a symbol). These must
// match the Supabase dashboard setting (Authentication > Providers >
// Email), which is what actually enforces them on the server.

export const PASSWORD_MIN_LENGTH = 8;

// The symbols Supabase Auth accepts as "symbols" (from its password
// security docs). A character outside this list doesn't count as one.
const SUPABASE_SYMBOLS = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~';

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'lowercase', label: 'A lowercase letter', test: (password) => /[a-z]/.test(password) },
  { id: 'uppercase', label: 'An uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { id: 'digit', label: 'A number', test: (password) => /[0-9]/.test(password) },
  {
    id: 'symbol',
    label: 'A symbol, like ! @ # or ?',
    test: (password) => [...password].some((character) => SUPABASE_SYMBOLS.includes(character)),
  },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
