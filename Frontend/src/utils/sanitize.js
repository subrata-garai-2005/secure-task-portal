export const sanitize = (str) =>
  str.replace(/[<>"'`]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c]));
