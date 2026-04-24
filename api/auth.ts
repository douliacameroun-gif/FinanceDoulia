import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || "douliagroup@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "01234567";

  if (email === adminEmail && password === adminPassword) {
    return res.json({ success: true, message: "Authentification réussie" });
  }

  return res.status(401).json({ success: false, message: "Identifiants invalides" });
});

export default router;
