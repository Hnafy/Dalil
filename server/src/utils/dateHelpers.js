function localDayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayStringOffset(baseDay, offset) {
  const d = new Date(`${baseDay}T00:00:00`);
  d.setDate(d.getDate() + offset);
  return localDayString(d);
}

module.exports = { localDayString, dayStringOffset };
