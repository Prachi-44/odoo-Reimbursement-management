import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth.js";
import { scanReceiptFromBase64 } from "../services/ocr.js";

const router: IRouter = Router();

router.post("/ocr/scan", requireAuth, async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const result = await scanReceiptFromBase64(imageBase64, mimeType);
  res.json(result);
});

export default router;
