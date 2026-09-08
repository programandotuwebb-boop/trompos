export function onlyDigits(text: string): string {
  return text.replace(/\D/g, "");
}

// Validación de formato, no de identidad: solo evita que se cargue algo que
// claramente no es un teléfono. No reemplaza ningún control de seguridad.
export function isValidPhone(phone: string): boolean {
  const digits = onlyDigits(phone);
  return digits.length >= 10 && digits.length <= 13;
}
