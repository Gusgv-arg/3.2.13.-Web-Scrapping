import express from "express";
import {scrapperMercadoLibre2} from "./scrapperMercadoLibre2.js"

const app = express();

const PORT = process.env.PORT || 4000;
let contador = 1
app.get("/scrape/mercado_libre", async (req, res) => {
  console.log("Api de Scrapping llamada numero:", contador)
  contador ++
  console.log("req:", req)
  const allProducts = await scrapperMercadoLibre2();
  res.status(200).send(allProducts)
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});