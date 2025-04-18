import express from "express";
import { scrapperMercadoLibre } from "./scrapperMercadoLibre.js";
import { apifyFacebookScraper } from "./apifyFacebookScraper.js";
import scraperCrediCuotas from "./scraperCrediCuotas.js";
import scraperCrediCuotas2 from "./scraperCrediCuotas2.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
let contador = 1

app.get("/", (req, res) => {
  console.log("Prendieron el servidor de Scraping en Render")
  res.send("Servidor de Scrapin en Render prendido!!");
});

app.get("/scrape/mercado_libre", async (req, res) => {
  console.log("Api de Scrape Mercado Libre:", contador)
  contador ++
  const allProducts = await scrapperMercadoLibre();
  res.status(200).send(allProducts)
});

app.post("/scrape/credicuotas", async (req, res) => {
  console.log("Api de Scrape Credicuotas:", req.body)
  const dni = req.body.dni
  console.log("DNI recibido:", dni)
  const credito = await scraperCrediCuotas2(dni);
  res.status(200).send(credito)
});

app.get("/scrape/facebook", async (req, res) => {
  console.log("Api de Scrape Facebook:", contador)
  contador ++
  const allProducts = await apifyFacebookScraper();
  console.log("Allproducts:", allProducts)
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(allProducts)
});


app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});