"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.storage = void 0;
const storage_1 = require("@google-cloud/storage");
const path_1 = __importDefault(require("path"));
const keyFilePath = path_1.default.join(__dirname, '../../config/backend-storage-uploader.json');
const storage = new storage_1.Storage({
    keyFilename: keyFilePath,
    projectId: 'shaped-infusion-461917-n0'
});
exports.storage = storage;
const bucketName = 'roomie-backups';
const bucket = storage.bucket(bucketName);
exports.bucket = bucket;
