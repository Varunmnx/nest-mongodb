export function formatDate(date: Date): { dateFormatted: string; timeFormatted: string } {
  const optionsDate: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
  const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  const dateFormatted = date.toLocaleDateString('en-US', optionsDate).replace(/\//g, ' - ');
  const timeFormatted = date.toLocaleTimeString('en-US', optionsTime);

  return { dateFormatted, timeFormatted };
}
