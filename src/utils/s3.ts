import { S3Client, PutObjectCommand, GetObjectCommand, } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 客户端配置
interface S3Config {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

// 上传图片的配置选项
interface UploadImageOptions {
  file: File | Blob
  key?: string // 可选的自定义文件名，如果不提供则使用随机生成的文件名
  contentType?: string // 可选的内容类型，如果不提供则自动检测
  expiresIn?: number // 可选的链接过期时间（秒），默认 3600 秒（1小时）
}

// 初始化 S3 客户端
let s3Client: S3Client | null = null
let currentConfig: S3Config | null = null

/**
 * 初始化 S3 客户端
 * @param config S3 配置信息
 */
export function initializeS3(config: S3Config): void {
  s3Client = new S3Client({
    endpoint: 'https://s3.fyl080801.uk',
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
  currentConfig = config
}

/**
 * 上传图片到 S3 并返回上传后的链接
 * @param options 上传选项
 * @returns 上传后的图片链接
 */
export async function uploadImage(options: UploadImageOptions): Promise<string> {
  if (!s3Client || !currentConfig) {
    throw new Error('S3 客户端未初始化，请先调用 initializeS3()')
  }

  const { file, key, contentType, expiresIn = 3600 } = options

  try {
    // 如果没有提供文件名，生成一个随机的文件名
    const fileName = key || generateRandomFileName(file)

    // 如果没有提供内容类型，尝试自动检测
    const mimeType = contentType || detectContentType(file)

    // 将 File/Blob 转换为 ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(file)

    // 创建上传命令
    const command = new PutObjectCommand({
      Bucket: currentConfig.bucket,
      Key: fileName,
      Body: arrayBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // 设置为公开读取，这样可以直接访问
    })

    // 执行上传
    await s3Client.send(command)

    // 生成预签名 URL
    const getCommand = new GetObjectCommand({
      Bucket: currentConfig.bucket,
      Key: fileName,
    })



    // return `https://s3.fyl080801.uk/${currentConfig.bucket}/${fileName}`
    // return `https://minio.fyl080801.uk/api/v1/buckets/${currentConfig.bucket}/objects/download?preview=true&prefix=${encodeURIComponent(fileName)}&version_id=null`
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn })

    // 返回可以直接访问的 URL
    return signedUrl
  } catch (error) {
    console.error('上传图片到 S3 失败:', error)
    throw new Error(`上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 生成随机文件名
 * @param file 文件对象
 * @returns 随机文件名
 */
function generateRandomFileName(file: File | Blob): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = getFileExtension(file)
  return `images/${timestamp}-${randomString}${extension}`
}

/**
 * 获取文件扩展名
 * @param file 文件对象
 * @returns 文件扩展名
 */
function getFileExtension(file: File | Blob): string {
  if (file instanceof File) {
    const name = file.name
    const lastDot = name.lastIndexOf('.')
    return lastDot === -1 ? '' : name.substring(lastDot)
  }

  // 对于 Blob 对象，根据类型推断扩展名
  const type = file.type
  const typeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
  }

  return typeMap[type] || '.jpg' // 默认返回 .jpg
}

/**
 * 自动检测内容类型
 * @param file 文件对象
 * @returns MIME 类型
 */
function detectContentType(file: File | Blob): string {
  if (file.type) {
    return file.type
  }

  // 如果没有类型信息，根据文件扩展名推断
  const extension = getFileExtension(file).toLowerCase()
  const extensionMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  }

  return extensionMap[extension] || 'application/octet-stream'
}

/**
 * 将 File/Blob 转换为 ArrayBuffer
 * @param file 文件对象
 * @returns ArrayBuffer
 */
async function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      resolve(arrayBuffer)
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * 获取 S3 对象的公开访问 URL（如果 bucket 和对象设置为公开访问）
 * @param key S3 对象的 key
 * @returns 公开访问 URL
 */
export function getPublicUrl(key: string): string {
  if (!currentConfig) {
    throw new Error('S3 客户端未初始化，请先调用 initializeS3()')
  }

  return `https://s3.fyl080801.uk/${currentConfig.region}/${currentConfig.bucket}/${key}`
}

/**
 * 检查 S3 客户端是否已初始化
 * @returns 是否已初始化
 */
export function isS3Initialized(): boolean {
  return s3Client !== null && currentConfig !== null
}

/**
 * 获取当前的 S3 配置
 * @returns 当前配置
 */
export function getS3Config(): S3Config | null {
  return currentConfig
}
