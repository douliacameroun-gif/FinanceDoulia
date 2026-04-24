import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.MOT_DE_PASSE_ADMIN;

  if (!adminEmail || !adminPassword) {
    console.error("Configuration d'authentification manquante sur le serveur.");
    return res.status(500).json({ success: false, message: "Configuration serveur incomplète." });
  }

  if (email === adminEmail && password === adminPassword) {
    return res.json({ success: true, message: "Authentification réussie" });
  }

  return res.status(401).json({ success: false, message: "Identifiants invalides" });
});

export default router;
