import type { NextApiRequest, NextApiResponse } from "next";
import { withApiAuthRequired, getAccessToken } from "@auth0/nextjs-auth0";
import formidable from "formidable";
import fs from "fs";

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL!;
const AUDIENCE = process.env.AUTH0_AUDIENCE || "https://api.cookbook";

async function getToken(req: NextApiRequest, res: NextApiResponse): Promise<string | undefined> {
  try {
    const { accessToken } = await (getAccessToken as any)(req as any, res as any, { audience: AUDIENCE } as any);
    return accessToken as string;
  } catch {
    try {
      const { accessToken } = await (getAccessToken as any)(req as any, res as any);
      return accessToken as string;
    } catch {
      return undefined;
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const accessToken = await getToken(req, res);
    if (!accessToken) {
      return res.status(401).json({ error: "No access token" });
    }

    // Parse form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Read file content
    const fileContent = fs.readFileSync(file.filepath);
    
    // Create FormData for browser-compatible multipart request
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", fileContent, {
      filename: file.originalFilename || "upload.jpg",
      contentType: file.mimetype || "image/jpeg",
    });

    // Forward to API using node-fetch style
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    };

    const response = await fetch(`${API}/upload-photo`, {
      method: "POST",
      headers,
      body: formData,
    } as any);

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Convert relative photo URL to full API URL
    if (data.photo_url && data.photo_url.startsWith("/photos/")) {
      data.photo_url = `${API}${data.photo_url}`;
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return res.status(500).json({ error: error?.message || "Upload failed" });
  }
});
