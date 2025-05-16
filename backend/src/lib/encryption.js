import crypto from "crypto";

const rawKey = process.env.MESSAGE_SECRET_KEY;
const secretKey = crypto.createHash("sha256").update(rawKey).digest(); // Converts to 32-byte key

const algorithm = "aes-256-cbc";
const ivLength = 16;

export const encryptText = (text) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

export const decryptText = (encryptedData) => {
  const [ivHex, encryptedText] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
