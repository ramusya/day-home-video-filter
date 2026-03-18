function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTimestamp(dateLike?: number | Date): string {
  const date = typeof dateLike === 'number' ? new Date(dateLike) : dateLike ?? new Date();

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}
