/**
 * Input validation helpers for Edge Functions.
 * Returns error message string if invalid, null if valid.
 */

export function validateStringLength(
  value: unknown,
  fieldName: string,
  maxLength: number,
  required = true,
): string | null {
  if (required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
    return `${fieldName}은(는) 필수입니다`;
  }
  if (maxLength > 0 && value && typeof value === 'string' && value.length > maxLength) {
    return `${fieldName}은(는) ${maxLength}자 이내로 입력해주세요`;
  }
  return null;
}

export interface ValidationRule {
  value: unknown;
  field: string;
  max: number;
  required?: boolean;
}

/**
 * Validate multiple fields at once. Returns first error or null.
 */
export function validateInputs(rules: ValidationRule[]): string | null {
  for (const { value, field, max, required = true } of rules) {
    const error = validateStringLength(value, field, max, required);
    if (error) return error;
  }
  return null;
}
