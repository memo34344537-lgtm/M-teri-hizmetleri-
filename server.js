const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(express.json());

const AYARLAR = {
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN || "BURAYA_WHATSAPP_TOKEN",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "BURAYA_PHONE_NUMBER_ID",
  INSTAGRAM_PAGE_TOKEN: process.env.INSTAGRAM_PAGE_TOKEN || "BURAYA_INSTAGRAM_PAGE_TOKEN",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "gizli123",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "BURAYA_ANTHROPIC_API_KEY",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "BURAYA_OPENAI_API_KEY",
  PORT: process.env.PORT || 3000,
};

const ISLETME = {
  isletme_adi: "Ornek Isletme",
  urunler: [
    { ad: "Urun A", stokta: true, adet: 12, fiyat: "450 TL", aciklama: "Kisa urun aciklamasi" },
    { ad: "Urun B", stokta: false, adet: 0, fiyat: "899 TL", aciklama: "Kisa urun aciklamasi" },
  ],
  randevu_musaitlik: {
    calisma_saatleri: "Hafta ici 09:00 - 18:00",
    musait_gunler: [
      { tarih: "2026-11-17", saatler: ["10:00", "11:30", "14:00", "16:00"] },
      { tarih: "2026-11-18", saatler: ["09:30", "13:00", "15:30"] },
    ],
  },
  genel_bilgi: {
    adres: "Adres buraya",
    telefon: "Telefon buraya",
    kargo_bilgisi: "Siparisler 1-3 is gunu icinde kargoya verilir.",
  },
};

const konusmaGecmisi = {};

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === AYARLAR.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const gelenVeri = req.body;
    if (gelenVeri.object === "whatsapp_business_account") {
      await whatsappMesajiIsle(gelenVeri);
    } else if (gelenVeri.object === "instagram") {
      await instagramMesajiIsle(gelenVeri);
    }
  } catch (hata) {
    console.error("Hata:", hata.message);
  }
});

app.get("/test", async (req, res) => {
  try {
    const mesaj = req.query.mesaj || "Merhaba, urunleriniz neler?";
    const cevap = await yapayZekaCevapUret("test_kullanici", mesaj);
    res.send(cevap);
  } catch (hata) {
    res.status(500).send("Hata: " + hata.message);
  }
});

async function whatsappMesajiIsle(gelenVeri) {
  const message = gelenVeri.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return;
  const musteriNo = message.from;
  const anahtar = "whatsapp_" + musteriNo;
  let musteriMetni = "";
  if (message.type === "text") {
    musteriMetni = message.text.body;
  } else {
    await whatsappGonder(musteriNo, "Mesajinizi aldim, en kisa surede donus yapilacak.");
    return;
  }
  const cevap = await yapayZekaCevapUret(anahtar, musteriMetni);
  await whatsappGonder(musteriNo, cevap);
}

async function instagramMesajiIsle(gelenVeri) {
  const olay = gelenVeri.entry?.[0]?.messaging?.[0];
  const musteriMetni = olay?.message?.text;
  const musteriId = olay?.sender?.id;
  if (!musteriMetni || !musteriId) return;
  const anahtar = "instagram_" + musteriId;
  const cevap = await yapayZekaCevapUret(anahtar, musteriMetni);
  await instagramGonder(musteriId, cevap);
}

async function yapayZekaCevapUret(anahtar, musteriMetni) {
  if (!konusmaGecmisi[anahtar]) konusmaGecmisi[anahtar] = [];
  konusmaGecmisi[anahtar].push({ role: "user", content: musteriMetni });
  konusmaGecmisi[anahtar] = konusmaGecmisi[anahtar].slice(-10);

  const sistemTalimati = "Sen " + ISLETME.isletme_adi + " isletmesinin musteri temsilcisisin. Kisa, net, samimi Turkce cevaplar ver. ISLETME VERISI: " + JSON.stringify(ISLETME);

  const yanit = await axios.post(
    "https://api.anthropic.com/v1/messages",
    { model: "claude-sonnet-4-6", max_tokens: 400, system: sistemTalimati, messages: konusmaGecmisi[anahtar] },
    { headers: { "x-api-key": AYARLAR.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" } }
  );

  const cevapMetni = yanit.data.content.map(function(b) { return b.text || ""; }).join("\n").trim();
  konusmaGecmisi[anahtar].push({ role: "assistant", content: cevapMetni });
  return cevapMetni;
}

async function whatsappGonder(aliciNo, metin) {
  await axios.post(
    "https://graph.facebook.com/v21.0/" + AYARLAR.WHATSAPP_PHONE_NUMBER_ID + "/messages",
    { messaging_product: "whatsapp", to: aliciNo, type: "text", text: { body: metin } },
    { headers: { Authorization: "Bearer " + AYARLAR.WHATSAPP_TOKEN } }
  );
}

async function instagramGonder(aliciId, metin) {
  await axios.post(
    "https://graph.facebook.com/v21.0/me/messages",
    { recipient: { id: aliciId }, message: { text: metin } },
    { headers: { Authorization: "Bearer " + AYARLAR.INSTAGRAM_PAGE_TOKEN } }
  );
}

app.listen(AYARLAR.PORT, function() {
  console.log("Sunucu " + AYARLAR.PORT + " portunda calisiyor.");
});
