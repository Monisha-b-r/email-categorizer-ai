// services/categorizeService.js
export function categorizeEmail(email) {
  const subject = email.subject.toLowerCase();

  if (subject.includes("meeting")) return "Interested";
  if (subject.includes("booked")) return "Meeting Booked";
  if (subject.includes("not interested")) return "Not Interested";
  if (subject.includes("spam")) return "Spam";
  if (subject.includes("out of office")) return "Out of Office";

  return "Interested"; // default
}

