export function scopeToPropertyKey(scope: string): string | undefined {
  const match = scope.match(/#\/properties\/(.+)$/);
  return match?.[1];
}
