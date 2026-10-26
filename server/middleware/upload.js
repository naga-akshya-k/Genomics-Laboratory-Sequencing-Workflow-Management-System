const multer = require('multer');
const path = require('path');
const fs = require('fs');

const analysisDir = path.join(__dirname, '..', 'uploads', 'analysis');
if (!fs.existsSync(analysisDir)) {
  fs.mkdirSync(analysisDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, analysisDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow common genomics/data files: vcf, fastq, bam, sam, csv, tsv, txt, pdf, zip, gz, json
  const allowedExtensions = /\.(vcf|fastq|fq|bam|sam|csv|tsv|txt|pdf|zip|gz|json)$/i;
  if (file.originalname.match(allowedExtensions)) {
    cb(null, true);
  } else {
    // Allow general files for academic/research flexibility
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter,
});

module.exports = upload;
