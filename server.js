/*
========================================================================
  WHATSAPP + INSTAGRAM MUSTERI ASISTANI — TEK DOSYA
  ------------------------------------------------------------------
  Ikisi de ayni Meta altyapisini kullandigi icin tek sunucu, tek adres,
  tek dosyayla hem WhatsApp hem Instagram DM'lerini otomatik cevaplar.
  Asagi inip sadece "AYARLAR" ve "ISLETME" bolumlerini doldur.
========================================================================
*/

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(express.json());

// ======================================================================
// 1) AYARLAR — API anahtarlarini buraya yapistir
// ======================================================================
const AYARLAR = {
  // --- WhatsApp (developers.facebook.com) ---
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "BURAYA_WHATSAPP_TOKEN",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "BURAYA_PHONE_NUMBER_ID",

  // --- Instagram (ayni Meta App icinden, ayni token genelde yeterli) ---
  // Instagram hesabinin "Professional/Business" olmasi ve bir Facebook
  // Sayfasina bagli olmasi sart. Token genelde "Page Access Token"dir.
  INSTAGRAM_PAGE_TOKEN: process.env.INSTAGRAM_PAGE_TOKEN || "BURAYA_INSTAGRAM_PAGE_TOKEN",

  // Webhook dogrulamasi icin ikisinde de ayni gizli kelimeyi kullanabilirsin
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "gizli123",

  // --- Claude API (console.anthropic.com) ---
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "BURAYA_ANTHROPIC_API_KEY",

  // --- Sesli mesajlar icin, opsiyonel (platform.openai.com) ---
