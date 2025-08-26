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

    // console.log("Parsing form data...");
    
    // Parse form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    // console.log("Files received:", Object.keys(files));
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // console.log("File info:", { size: file.size, type: file.mimetype, name: file.originalFilename });

    // Validate file
    if (!file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ error: "File must be an image" });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large (max 5MB)" });
    }

    // Create FormData using file stream (better for FastAPI)
    const FormData = require("form-data");
    const formData = new FormData();
    
    // Use file stream instead of reading into memory
    formData.append("file", fs.createReadStream(file.filepath), {
      filename: file.originalFilename || "upload.jpg",
      contentType: file.mimetype || "image/jpeg",
    });

    // Use node's https module for better compatibility
    const https = require("https");
    const url = require("url");
    const apiUrl = new URL(`${API}/upload-photo`);
    
    const response = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || (apiUrl.protocol === "https:" ? 443 : 80),
        path: apiUrl.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...formData.getHeaders(),
        },
      };

      const req = https.request(options, (res: any) => {
        let data = "";
        res.on("data", (chunk: any) => data += chunk);
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => data,
            json: async () => JSON.parse(data),
          });
        });
      });
      
      req.on("error", (error: any) => {
        console.error("Photo upload request error:", error);
        reject(error);
      });
      
      formData.pipe(req);
    });

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: "Invalid response from API", details: responseText });
    }
    
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
    return res.status(500).json({ error: error?.message || "Upload failed", stack: error?.stack });
  }
});
