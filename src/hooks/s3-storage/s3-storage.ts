import * as admin from "firebase-admin";
import { readSecretJson } from "../secretFile";
import {
  FileType,
  FolderType,
  UploadFileResult,
  DeleteFileResult,
} from "./s3-storage.types";

const serviceAccount = readSecretJson(
  "MARA_FIREBASE_SERVICE_ACCOUNT_PATH",
  "serviceAccounts/mara-firebase.json"
);

let storageInitialized = false;

const getStorageApp = () => {
  try {
    return admin.app("storage-app");
  } catch {
    return admin.initializeApp(
      {
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
        storageBucket:
          process.env.MARA_FIREBASE_STORAGE_BUCKET ||
          "moto-auto-road-assistant.firebasestorage.app",
      },
      "storage-app"
    );
  }
};

const initializeStorage = () => {
  if (storageInitialized) return;

  try {
    getStorageApp();
    storageInitialized = true;
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    throw error;
  }
};

const getFileExtension = (mimeType: string, originalName?: string): string => {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };
  if (mimeType && mimeToExt[mimeType]) return mimeToExt[mimeType];
  if (originalName) {
    const ext = originalName.split(".").pop()?.toLowerCase();
    if (ext) return ext;
  }

  return "jpg";
};

const generateFileName = (extension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}.${extension}`;
};

export const addFile = async (
  file: Express.Multer.File,
  folder: FolderType,
  fileType: FileType = "images"
): Promise<UploadFileResult> => {
  initializeStorage();

  const app = getStorageApp();
  const bucket = app.storage().bucket();
  const extension = getFileExtension(file.mimetype, file.originalname);
  const fileName = generateFileName(extension);
  const filePath = `${fileType}/${folder}/${fileName}`;

  try {
    const fileRef = bucket.file(filePath);
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname || fileName,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return {
      url,
      path: filePath,
      name: fileName,
    };
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    throw error;
  }
};

export const deleteFile = async (url: string): Promise<DeleteFileResult> => {
  initializeStorage();

  const app = getStorageApp();
  const bucket = app.storage().bucket();

  try {
    let filePath: string;

    if (url.includes("firebasestorage.googleapis.com")) {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const pathMatch = pathname.match(/\/o\/(.+)$/);
      if (!pathMatch) {
        throw new Error("Invalid Firebase Storage URL format");
      }
      filePath = decodeURIComponent(pathMatch[1]);
    } else if (url.includes("storage.googleapis.com")) {
      const urlParts = url.split("/");
      const bucketIndex = urlParts.findIndex((part) =>
        part.includes("googleapis.com")
      );

      if (bucketIndex === -1) {
        throw new Error("Invalid Firebase Storage URL");
      }

      const pathStartIndex = bucketIndex + 2;
      filePath = urlParts.slice(pathStartIndex).join("/");
    } else {
      filePath = url;
    }

    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();

    if (!exists) {
      return {
        success: false,
        path: filePath,
      };
    }

    await fileRef.delete();

    return {
      success: true,
      path: filePath,
    };
  } catch (error) {
    console.error("Error deleting file from Firebase Storage:", error);
    throw error;
  }
};

export const addFiles = async (
  files: Express.Multer.File[],
  folder: FolderType,
  fileType: FileType = "images"
): Promise<UploadFileResult[]> => {
  try {
    const uploadPromises = files.map((file) => addFile(file, folder, fileType));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple files to Firebase Storage:", error);
    throw error;
  }
};

export const deleteFiles = async (
  urls: string[]
): Promise<DeleteFileResult[]> => {
  try {
    const deletePromises = urls.map((url) => deleteFile(url));
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error(
      "Error deleting multiple files from Firebase Storage:",
      error
    );
    throw error;
  }
};
