import express from "express";
import {scrapperMercadoLibre2} from "./scrapperMercadoLibre2.js"

const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape/mercado_libre", (req, res) => {
  scrapperMercadoLibre2(res);
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});