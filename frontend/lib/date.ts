/**
 * Standardizes date formatting to 'MMMM DD, YYYY' (e.g., "January 20, 2025").
 * Bypasses timezone shifts when dealing with date-only strings (YYYY-MM-DD).
 */
export function formatDate(dateInput: string | Date | null | undefined, locale: string = "en"): string {
  if (!dateInput) return "";

  let dateObj: Date;

  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(dateInput);
    }
  } else {
    dateObj = dateInput;
  }

  if (isNaN(dateObj.getTime())) return "";

  if (locale === "fr") {
    const monthsFr = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    const day = dateObj.getDate();
    const month = monthsFr[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const monthsEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = dateObj.getDate();
  const month = monthsEn[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatToYYYYMMDD(date: Date | null | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}