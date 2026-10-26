const generateId = async (model, prefix) => {
  const year = new Date().getFullYear();
  const searchPattern = new RegExp(`^${prefix}-${year}-\\d+$`);

  // Field mapping
  const fieldName =
    prefix === 'REQ'
      ? 'requestCode'
      : prefix === 'SMP'
      ? 'sampleCode'
      : prefix === 'RUN'
      ? 'runCode'
      : 'reportCode';

  // Find all matching codes for the prefix and year to calculate the absolute max
  const docs = await model
    .find({ [fieldName]: searchPattern })
    .select(fieldName)
    .lean();

  let maxSeq = 0;
  for (const doc of docs) {
    if (doc[fieldName]) {
      const parts = doc[fieldName].split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(4, '0');
  return `${prefix}-${year}-${paddedSeq}`;
};

module.exports = { generateId };
