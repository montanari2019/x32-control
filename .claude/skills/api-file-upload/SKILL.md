---
name: api-file-upload
description: Backend Template file upload patterns using Multer for local disk storage and AWS S3 for cloud storage, including image processing with Sharp and the Attachments domain as reference. Use when implementing file/image upload features.
---

# Backend Template - File Upload

## Overview

The template supports two storage strategies:
- **Local disk** — files are saved to the configured `WS_STORAGE_PATH` directory (used by the `attachments` domain)
- **AWS S3** — files are uploaded to an S3 bucket (used by the `s3-upload` middleware)

Both strategies share the same Multer-based reception pipeline.

---

## Configuration

**`src/config/storage.ts`**
```ts
const storageConfig = {
    maxFileSize: (25 * 1024 * 1024), // 25 MB
    baseDirectory: WS_STORAGE_PATH,  // env: WS_STORAGE_PATH (default: ./uploads)
    tempDirectory: join(WS_STORAGE_PATH, 'temp'),
};
```

**`src/config/aws.ts`** — required env vars for S3:
```
AWS_BUCKET_NAME
AWS_ACCESS_KEY
AWS_SECRET_KEY
AWS_BUCKET_REGION
```

---

## Step 1 — Receive files with Multer (`src/helpers/multer.ts`)

```ts
import createMulterMiddleware, { mimetypes, imageParserMiddleware } from '~/helpers/multer';

// createMulterMiddleware(allowedTypes, maxFiles?) — builds a Multer instance
// allowedTypes: RegExp[] | RegExpMap (per-field)
// maxFiles: number (default 1)

// Example: accept any mimetype, one file per field named "arquivos"
const multerMiddleware = createMulterMiddleware(mimetypes).fields([
    { name: 'arquivos', maxCount: 1 },
]);
```

### Available predefined `mimetypes` array
Covers `image/*`, `video/*`, `audio/*`, PDF, Office documents, text, XML, ZIP, SVG.

### Image-only uploads
```ts
import { imageParserMiddleware } from '~/helpers/multer';
// Use a custom array for images only
const imageMulter = createMulterMiddleware([/image\/.+/]).single('photo');
```

### `imageParserMiddleware`
After Multer, attach this middleware to populate `file.imageMetadata` (width, height, orientation) for every image file:
```ts
router.post('/photos', imageMulter, imageParserMiddleware, controller.create);
```

---

## Step 2A — Local storage (`src/helpers/storage.ts`)

Files land in `tempDirectory` after Multer. Move them to the final location inside the monthly sub-folder:

```ts
import { resolveStorageDirectory, removeLocalFile } from '~/helpers/storage';

// Returns: { relative: '2024-05/uuid.jpg', destination: '/uploads/2024-05/uuid.jpg' }
const directories = await resolveStorageDirectory(file.filename);

// Move from temp to final path (sync rename)
renameSync(file.path, directories.destination);

// Save the relative path to the DB
attachment.file_path = directories.relative;

// Remove a local file by its relative path
await removeLocalFile(attachment.file_path);
```

### EXIF-aware rotation (via Sharp)
```ts
import sharp from 'sharp';
import { getExifAngleToRotate } from '~/domains/attachments/controllers'; // internal helper

const angle = getExifAngleToRotate(file.imageMetadata?.orientation);
if (angle) {
    await sharp(file.path).rotate(angle).toFile(directories.destination);
    unlinkSync(file.path);
} else {
    renameSync(file.path, directories.destination);
}
```

---

## Step 2B — S3 storage (`src/helpers/s3-storage.ts`)

```ts
import {
    uploadFile,
    deleteFile,
    deleteFileByKey,
    getFile,
    getFileByKey,
    createPresignedUrl,
} from '~/helpers/s3-storage';

// Upload a Multer file to S3 (uses file.filename as the S3 key)
await uploadFile(file);

// Generate a temporary download URL (expires in 1 hour)
const url = await createPresignedUrl(attachment.file_path);

// Delete an attachment by its model instance
await deleteFile(attachment);

// Delete by key directly
await deleteFileByKey('2024-05/uuid.jpg');
```

### S3 upload middleware (`src/middlewares/s3-upload.ts`)
Drop-in middleware that uploads `request.files.arquivos` to S3:
```ts
import s3UploadMiddleware from '~/middlewares/s3-upload';

router.post('/docs', multerMiddleware, s3UploadMiddleware, controller.create);
```

---

## Reference: `attachments` Domain (local storage)

This domain is the canonical example for local file storage.

**`src/domains/attachments/routes.ts`**
```ts
import createMulterMiddleware, { mimetypes, imageParserMiddleware } from '~/helpers/multer';

const multerMiddleware = createMulterMiddleware(mimetypes).fields([
    { name: 'arquivos', maxCount: 1 },
]);

export default [
    {
        method: 'post',
        path: '/attachments',
        handlers: [multerMiddleware, imageParserMiddleware, controllers.create],
        swagger: swagger.create,
    },
] as Array<App.Router.Route>;
```

**`src/domains/attachments/model.ts`** — relevant fields:
```ts
class Attachment extends BaseModel {
    static get tableName() { return 'attachments'; }

    mimetype: string;
    file_path: string;   // relative path stored in DB (e.g. '2024-05/uuid.jpg')
    file_size: number;
    original_name: string;
    image_width?: number;
    image_height?: number;
}
```

**Controller pattern** (abbreviated):
```ts
async function create(request, response, next) {
    const filesRequestField = castArray(request.files.arquivos).filter(Boolean);

    const result = await Attachment.transaction(async transacting => {
        // 1. Move files from temp to final storage
        for (const file of filesRequestField) {
            const directories = await resolveStorageDirectory(file.filename);
            // handle EXIF rotation then renameSync / sharp.toFile
        }
        // 2. Insert DB records with { mimetype, file_size, file_path, image_width, image_height }
        return Attachment.query(transacting).insert(attachmentsValues);
    });

    response.status(201).json(result);
}
```

---

## Multer error handling

Errors thrown by Multer are caught by `src/middlewares/errors.ts` automatically:

| Multer code | Mapped error |
|---|---|
| `LIMIT_FILE_SIZE` | `PreconditionFailedError(41)` |
| `LIMIT_FILE_COUNT` / `LIMIT_UNEXPECTED_FILE` | `PreconditionFailedError(42)` |
| Invalid mimetype (thrown by fileFilter) | `PreconditionFailedError(100)` |

Do NOT manually catch Multer errors — just call `next(err)`.

---

## Choosing local vs. S3
- Follow the instructions from the user. If the user doesn't specify, ask for clarification about the expected usage pattern and choose based on the table below.

| Scenario | Strategy |
|---|---|
| Images/files served directly from the API | Local storage (`resolveStorageDirectory`) |
| Files served from a CDN or third-party client | S3 + presigned URLs |
| Temporary processing (resize, convert) | Always land in `tempDirectory` first |
