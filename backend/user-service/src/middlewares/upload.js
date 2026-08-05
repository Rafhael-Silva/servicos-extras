const multer = require('multer');
const AppError = require('../../errors/AppError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Tipo de arquivo inválido. Apenas PDF, DOC, DOCX, JPEG e PNG são permitidos!',
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

module.exports = upload;
