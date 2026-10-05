const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Readable } = require("stream");

const PHOTO_URL_PREFIX = "/api/workers/photos/";

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB is not connected");
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "workerPhotos",
  });
};

const storeWorkerPhoto = (file) => new Promise((resolve, reject) => {
  const retainUntil = new Date();
  retainUntil.setMonth(retainUntil.getMonth() + 3);

  const uploadStream = getBucket().openUploadStream(file.originalname || "worker-photo.jpg", {
    contentType: file.mimetype,
    metadata: {
      contentType: file.mimetype,
      uploadedAt: new Date(),
      retainUntil,
    },
  });

  uploadStream.once("error", reject);
  uploadStream.once("finish", () => {
    const id = uploadStream.id.toString();
    resolve({ id, photoUrl: `${PHOTO_URL_PREFIX}${id}` });
  });

  Readable.from([file.buffer]).pipe(uploadStream);
});

const deleteWorkerPhoto = async (photoId) => {
  await getBucket().delete(new mongoose.Types.ObjectId(photoId));
};

const createWorkerPhotoAccessUrl = (photoUrl) => {
  if (!photoUrl || !photoUrl.startsWith(PHOTO_URL_PREFIX)) return photoUrl || "";

  const photoId = photoUrl.slice(PHOTO_URL_PREFIX.length).split("?")[0];
  const token = jwt.sign(
    { workerPhotoId: photoId },
    process.env.JWT_SECRET,
    { expiresIn: "120d" }
  );

  return `${PHOTO_URL_PREFIX}${photoId}?token=${encodeURIComponent(token)}`;
};

const streamWorkerPhoto = (req, res) => {
  let claims;
  try {
    claims = jwt.verify(req.query.token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Photo link is invalid or expired" });
  }

  if (
    !mongoose.Types.ObjectId.isValid(req.params.photoId) ||
    claims.workerPhotoId !== req.params.photoId
  ) {
    return res.status(401).json({ message: "Photo link is invalid or expired" });
  }

  const downloadStream = getBucket().openDownloadStream(
    new mongoose.Types.ObjectId(req.params.photoId)
  );

  downloadStream.once("file", (file) => {
    res.set({
      "Content-Type": file.metadata?.contentType || file.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
  });

  downloadStream.once("error", (error) => {
    if (!res.headersSent) {
      res.status(404).json({ message: "Photo not found" });
    } else {
      res.destroy(error);
    }
  });

  downloadStream.pipe(res);
};

module.exports = {
  createWorkerPhotoAccessUrl,
  deleteWorkerPhoto,
  storeWorkerPhoto,
  streamWorkerPhoto,
};