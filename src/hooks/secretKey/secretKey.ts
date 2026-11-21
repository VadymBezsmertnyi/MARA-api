import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import fs from "fs";

dotenv.config();

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || "";
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || "";

const appleId = APPLE_CLIENT_ID;
const keyId = APPLE_KEY_ID;
const teamId = APPLE_TEAM_ID;
const privateKey = fs.readFileSync(
  process.env.APPLE_AUTH_KEY_PATH || "AuthKey.p8"
);

export const getSecretKey = () => {
  const secret = jwt.sign(
    {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
      aud: "https://appleid.apple.com",
      sub: appleId,
    },
    privateKey,
    {
      algorithm: "ES256",
      keyid: keyId,
    }
  );

  console.warn(secret);
  return secret;
};

/* 

const args = process.argv.slice(2).reduce((acc, arg, i) => {
  if (arg.match(/^--\w/)) {
    const key = arg.replace(/^--/, "").toLowerCase();
    acc[key] = process.argv[i + 3];
  }
  return acc;
}, {} as Record<string, string | number>);

const {
  team_id = process.env.APPLE_TEAM_ID,
  iss = team_id,

  private_key = privateKey,

  client_id = process.env.APPLE_CLIENT_ID,
  sub = client_id,

  key_id = process.env.APPLE_KEY_ID,
  kid = key_id,

  expires_in = 86400 * 180,
  exp = Math.ceil(Date.now() / 1000) + Number(expires_in),
} = args;

export const getSecretKey = async () => {
  const expiresAt = Math.ceil(Date.now() / 1000) + Number(expires_in);
  const expirationTime = exp ?? expiresAt;

  const secret = await new SignJWT({})
    .setAudience("https://appleid.apple.com")
    .setIssuer(iss?.toString() || "")
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setSubject(sub?.toString() || "")
    .setProtectedHeader({ alg: "ES256", kid: kid?.toString() || "" })
    .sign(createPrivateKey(private_key.toString().replace(/\\n/g, "\n")));

  console.warn(secret);
  return secret;
};
*/
