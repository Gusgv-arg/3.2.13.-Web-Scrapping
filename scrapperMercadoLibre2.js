import dotenv from "dotenv"
import puppeteer from "puppeteer";
import XLSX from "xlsx"; 

dotenv.config()

export const scrapperMercadoLibre2 = async (res) => {
	// Inicializa el navegador
	//const browser = await puppeteer.launch({ headless: false }); // Cambié headless a false para depurar visualmente
	const browser = await puppeteer.launch({
		args: [
		  "--disable-setuid-sandbox",
		  "--no-sandbox",
		  "--single-process",
		  "--no-zygote",
		],
		executablePath:
		  process.env.NODE_ENV === "production"
			? process.env.PUPPETEER_EXECUTABLE_PATH
			: puppeteer.executablePath(),
	  });
	const page = await browser.newPage();

	/* const urls = [
		"https://motos.mercadolibre.com.ar/scooters/motomel/blitz-110/blitz110_KILOMETERS_0km-0km_NoIndex_True#applied_filter_id%3DKILOMETERS%26applied_filter_name%3DKil%C3%B3metros%26applied_filter_order%3D8%26applied_value_id%3D%5B0km-0km%5D%26applied_value_name%3D0+km%26applied_value_order%3D2%26applied_value_results%3D94%26is_custom%3Dfalse",
		"https://motos.mercadolibre.com.ar/naked/benelli/leoncino-500_ITEM*CONDITION_2230284_NoIndex_True#applied_filter_id%3DITEM_CONDITION%26applied_filter_name%3DCondici%C3%B3n%26applied_filter_order%3D9%26applied_value_id%3D2230284%26applied_value_name%3DNuevo%26applied_value_order%3D1%26applied_value_results%3D47%26is_custom%3Dfalse",
		"https://motos.mercadolibre.com.ar/naked/suzuki/ax-100/ax100_ITEM*CONDITION_2230284_NoIndex_True#applied_filter_id%3DITEM_CONDITION%26applied_filter_name%3DCondici%C3%B3n%26applied_filter_order%3D6%26applied_value_id%3D2230284%26applied_value_name%3DNuevo%26applied_value_order%3D1%26applied_value_results%3D44%26is_custom%3Dfalse",
		"https://motos.mercadolibre.com.ar/scooters/motomel/strato-150_ITEM*CONDITION_2230284_NoIndex_True#applied_filter_id%3DITEM_CONDITION%26applied_filter_name%3DCondici%C3%B3n%26applied_filter_order%3D8%26applied_value_id%3D2230284%26applied_value_name%3DNuevo%26applied_value_order%3D1%26applied_value_results%3D40%26is_custom%3Dfalse"
	]; */
	const urls = [
		"https://motos.mercadolibre.com.ar/naked/benelli/leoncino-500_ITEM*CONDITION_2230284_NoIndex_True#applied_filter_id%3DITEM_CONDITION%26applied_filter_name%3DCondici%C3%B3n%26applied_filter_order%3D9%26applied_value_id%3D2230284%26applied_value_name%3DNuevo%26applied_value_order%3D1%26applied_value_results%3D47%26is_custom%3Dfalse",
	];

	let allProducts = [];

	try {
		for (const url of urls) {
			console.log(`Navegando a la URL: ${url}`);
			await page.goto(url, { waitUntil: "networkidle2" });
	
			// Ingresa en la barra de búsqueda
			/* console.log("Ingresando la búsqueda");
			await page.type('input[name="as_word"]', "blitz 110");
			await page.click('button[type="submit"]'); */
	
			// Espera a que los resultados se carguen
			console.log("Esperando a que los resultados de la búsqueda se carguen...");
			await page.waitForSelector("ol.ui-search-layout", { timeout: 15000 });
	
			// Verifica si los resultados están presentes
			const resultadosDisponibles = await page.$("ol.ui-search-layout");
			if (resultadosDisponibles) {
				console.log(
					"Resultados de búsqueda encontrados, procediendo al scraping..."
				);
			} else {
				console.error(
					"No se encontró el contenedor de resultados. Verifique el selector o la conexión."
				);
				continue; // Salta a la siguiente URL
			}
	
			do {
				// Realiza el scraping de cada aviso
				const products = await page.evaluate(() => {
					// Selecciona todos los contenedores de resultados dentro del elemento <ol>
					const resultados = document.querySelectorAll(
						"ol.ui-search-layout.ui-search-layout--grid > li.ui-search-layout__item"
					);
					let data = [];
	
					// Itera sobre los resultados para extraer la información relevante
					resultados.forEach((resultado) => {
						const titulo =
							resultado.querySelector("h2.poly-component__title > a")
								?.innerText || "Título no disponible";
						const precio =
							resultado.querySelector(
								".poly-component__price .andes-money-amount__fraction"
							)?.innerText || "Precio no disponible";
						const link =
							resultado.querySelector("h2.poly-component__title > a")?.href ||
							"Link no disponible";
						const ubicacion =
							resultado.querySelector(".poly-component__location")?.innerText ||
							"Ubicación no disponible";
						const vendedor =
							resultado.querySelector(".poly-component__seller")?.innerText ||
							"Vendedor no disponible";
						const atributos =
							Array.from(
								resultado.querySelectorAll(
									".poly-component__attributes-list .poly-attributes-list__item"
								)
							).map((attr) => attr.innerText) || [];
	
						// Filtra solo los resultados que contengan "0 Km" en sus atributos
						const esNuevo = atributos.filter(
							(attr) => attr.trim() === "2024, 0 Km"
						);
	
						if (titulo && precio && link && esNuevo) {
							data.push({
								titulo,
								precio,
								link,
								ubicacion,
								vendedor,
								atributos: atributos.join(", "),
							});
						}
					});
					return data;
				});
	
				allProducts = allProducts.concat(products); // Acumula los resultados
	
				// Verifica si hay un botón de "Siguiente" y haz clic en él
				const siguienteBoton = await page.$('a[title="Siguiente"]'); // Selector del botón "Siguiente"
	
				if (siguienteBoton) {
					try {
						await siguienteBoton.click(); // Haz clic en el botón "Siguiente"
						await page.waitForTimeout(2000); // Espera un poco para que la nueva página cargue
					} catch (error) {
						console.error("Error al hacer clic en el botón 'Siguiente':", error);
						break; // Sal del bucle si hay un error
					}
				} else {
					break; // Si no hay botón "Siguiente", sal del bucle
				}
			} while (true);
		}
	
		// Muestra los datos extraídos en la consola
		if (allProducts.length > 0) {
			console.log("Datos extraídos:", allProducts);
			console.log("Cantidad:", allProducts.length);
			// Exportar a Excel
			/* const ws = XLSX.utils.json_to_sheet(allProducts); 
			const wb = XLSX.utils.book_new(); 
			XLSX.utils.book_append_sheet(wb, ws, "Productos"); 
			XLSX.writeFile(wb, "output/productos.xlsx"); 
			console.log("Datos exportados a productos.xlsx"); */

			res.send(allProducts)
		} else {
			console.warn(
				"No se encontraron datos para extraer. Verifique los selectores o los resultados de la búsqueda."
			);
			res.send(`No se extrajeron productos de Mercado Libre. Hay que revizar los selectores`)
		}
	
	} catch (error) {
		console.log("Error corriendo Puppeteer:", error)
	} finally {
		// Cierra el navegador
		console.log("Cerrando el navegador...");
		await browser.close();
	}
};
