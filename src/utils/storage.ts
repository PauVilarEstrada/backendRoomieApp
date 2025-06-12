import { Storage } from '@google-cloud/storage'
import path from 'path'

const keyFilePath = path.join(__dirname, '../../config/backend-storage-uploader.json')

const storage = new Storage({
  keyFilename: keyFilePath,
  projectId: 'shaped-infusion-461917-n0'
})

const bucketName = 'roomie-backups'
const bucket = storage.bucket(bucketName)

export { storage, bucket }
