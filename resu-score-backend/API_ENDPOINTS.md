# ResuScore Backend API Endpoints

## Base URL
```
http://localhost:3001
```

## Endpoints

### 1. Health Check
**GET** `/health`
- Returns server status
- Response: `{ "status": "OK", "timestamp": "..." }`

### 2. Database Health Check
**GET** `/health/db`
- Returns MongoDB connection status
- Response: `{ "mongodb": { "status": "connected", "readyState": 1 }, "timestamp": "..." }`

### 3. Upload Resume
**POST** `/upload`
- Upload and process a resume file (PDF or DOCX)
- **Content-Type**: `multipart/form-data`
- **Field name**: `resume`
- **File size limit**: 5MB
- **Supported formats**: `.pdf`, `.docx`

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "analysisId": "507f1f77bcf86cd799439011",
  "filename": "resume-1234567890-123456789.pdf",
  "originalName": "MyResume.pdf",
  "fileType": "pdf",
  "size": 245678,
  "wordCount": 450,
  "textPreview": "John Doe Software Engineer..."
}
```

**Error Response:**
```json
{
  "error": "Failed to process file",
  "details": "Error message here"
}
```

### 4. Get Analysis by ID
**GET** `/analysis/:id`
- Retrieve a specific resume analysis
- **Parameters**: `id` (MongoDB ObjectId)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "filename": "resume-1234567890-123456789.pdf",
  "originalName": "MyResume.pdf",
  "fileType": "pdf",
  "fileSize": 245678,
  "uploadDate": "2025-12-06T05:51:26.305Z",
  "analysisResults": {
    "overallScore": 0,
    "formatScore": 0,
    "contentScore": 0,
    "atsScore": 0,
    "checks": {...},
    "suggestions": [],
    "extractedText": "Full extracted text...",
    "sections": {}
  }
}
```

### 5. Get All Analyses
**GET** `/analyses`
- Retrieve list of all resume analyses (limited to 50 most recent)
- Returns summary information only

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "filename": "resume-1234567890-123456789.pdf",
    "originalName": "MyResume.pdf",
    "fileType": "pdf",
    "fileSize": 245678,
    "uploadDate": "2025-12-06T05:51:26.305Z",
    "analysisResults": {
      "overallScore": 0
    }
  }
]
```

## Testing with cURL

### Upload a file:
```bash
curl -X POST http://localhost:3001/upload \
  -F "resume=@/path/to/your/resume.pdf"
```

### Get analysis:
```bash
curl http://localhost:3001/analysis/507f1f77bcf86cd799439011
```

### Get all analyses:
```bash
curl http://localhost:3001/analyses
```

## Testing with Postman

1. **Upload File:**
   - Method: POST
   - URL: `http://localhost:3001/upload`
   - Body: form-data
   - Key: `resume` (type: File)
   - Value: Select your PDF or DOCX file

2. **Get Analysis:**
   - Method: GET
   - URL: `http://localhost:3001/analysis/{analysisId}`
   - Replace `{analysisId}` with the ID from upload response

## Notes

- Files are automatically deleted after processing
- Extracted text is stored in MongoDB
- File processing supports both PDF and DOCX formats
- Maximum file size is 5MB
