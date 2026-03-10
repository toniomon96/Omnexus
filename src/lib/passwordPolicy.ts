export const MIN_PASSWORD_LENGTH = 12;

export function passwordLengthError(): string {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
}
