// Requiere Puppeteer. Instálalo ejecutando: npm install puppeteer
import puppeteer from "puppeteer";
import XLSX from "xlsx"; // Importa la biblioteca xlsx

(async () => {
	// Inicializa el navegador
	const browser = await puppeteer.launch({ headless: false }); // Cambié headless a false para depurar visualmente
	const page = await browser.newPage();

	// Navega a la página de Mercado Libre Argentina
	console.log("Navegando a la página principal de Mercado Libre Argentina...");
	await page.goto("https://motos.mercadolibre.com.ar", {
		waitUntil: "networkidle2",
	});

	// Ingresa "motos blitz 110" en la barra de búsqueda
	console.log("Ingresando la búsqueda")
	await page.type('input[name="as_word"]', "overgrip tecnifibre");
	await page.click('button[type="submit"]');

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
		await browser.close();
		return;
	}

	let allProducts = [];

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
					resultado.querySelector("h2.poly-component__title > a")?.innerText ||
					"Título no disponible";
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
				const esNuevo = atributos.filter(attr => attr.trim() === "2024, 0 Km");
				;

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

	// Muestra los datos extraídos en la consola
	if (allProducts.length > 0) {
		console.log("Datos extraídos:", allProducts);
		console.log("Cantidad:", allProducts.length);
		// Exportar a Excel
		const ws = XLSX.utils.json_to_sheet(allProducts); // Convierte los datos a una hoja de Excel
		const wb = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo
		XLSX.utils.book_append_sheet(wb, ws, "Productos"); // Agrega la hoja al libro
		XLSX.writeFile(wb, "productos.xlsx"); // Escribe el archivo Excel
		console.log("Datos exportados a productos.xlsx");
	} else {
		console.warn(
			"No se encontraron datos para extraer. Verifique los selectores o los resultados de la búsqueda."
		);
	}

	// Cierra el navegador
	console.log("Cerrando el navegador...");
	await browser.close();
})();
