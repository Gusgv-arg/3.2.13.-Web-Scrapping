import express from "express";
import { scrapperMercadoLibre } from "./scrapperMercadoLibre.js";
import { apifyFacebookScraper } from "./apifyFacebookScraper.js";

const app = express();

const PORT = process.env.PORT || 4000;
let contador = 1
app.get("/scrape/mercado_libre", async (req, res) => {
  console.log("Api de Scrape Mercado Libre:", contador)
  contador ++
  const allProducts = await scrapperMercadoLibre();
  res.status(200).send(allProducts)
});

app.get("/scrape/facebook", async (req, res) => {
  console.log("Api de Scrape Facebook:", contador)
  contador ++
  const allProducts = await apifyFacebookScraper();
  console.log("Allproducts:", allProducts)
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(allProducts)
});

app.get("/", (req, res) => {
  res.send("Servidor de Scrapin en Render prendido!");
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});