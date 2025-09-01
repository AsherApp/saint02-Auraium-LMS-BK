import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = Router();
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow video files for video uploads
        if (req.path.includes('/video')) {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            }
            else {
                cb(new Error('Only video files are allowed'));
            }
        }
        else {
            // Allow all files for general uploads
            cb(null, true);
        }
    }
});
// Video upload endpoint
router.post('/video', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }
        const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        res.json({
            success: true,
            file: {
                url: fileUrl,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
                filename: req.file.filename
            }
        });
    }
    catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});
// File upload endpoint
router.post('/file', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        res.json({
            success: true,
            file: {
                url: fileUrl,
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
                filename: req.file.filename
            }
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
export { router };
