import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { urlsMercadoLibre } from "./urlsMercadoLibre.js";

dotenv.config();

let isScraping = false; // Variable de bloqueo

export const scrapperMercadoLibre = async () => {
	console.log("isScraping:", isScraping);
	if (isScraping === true) {
		console.log(
			"El scraping ya está en ejecución. Ignorando la nueva solicitud."
		);
		return { error: "Scaping en progreso", data: null };
	}

	isScraping = true; // Establecer el bloqueo
	let browser = null;
	let allProducts = [];
	let error = null;

	// Inicializa el navegador
	//const browser = await puppeteer.launch({ headless: false }); // Cambié headless a false para depurar visualmente
	browser = await puppeteer.launch({
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

	try {
		for (const urlData of urlsMercadoLibre) {
			console.log(`Navegando a la URL: ${urlData.url}`);
			await page.goto(urlData.url, {
				waitUntil: "networkidle2",
				timeout: 60000,
			});

			// Ingresa en la barra de búsqueda
			/* console.log("Ingresando la búsqueda");
			await page.type('input[name="as_word"]', "blitz 110");
			await page.click('button[type="submit"]'); */

			// Espera a que los resultados se carguen
			console.log(
				"Esperando a que los resultados de la búsqueda se carguen..."
			);
			await page.waitForSelector("ol.ui-search-layout.ui-search-layout--grid", {
				timeout: 35000,
			});

			// Verifica si los resultados están presentes
			const resultadosDisponibles = await page.evaluate(() => {
				const resultados = document.querySelector(
					"ol.ui-search-layout.ui-search-layout--grid"
				);
				if (!resultados) return 0;
				return resultados.children.length;
			});

			if (resultadosDisponibles > 0) {
				console.log(
					`Resultados de búsqueda encontrados: ${resultadosDisponibles}`
				);
				const elementos = await page.evaluate(() => {
					const resultados = document.querySelector(
						"ol.ui-search-layout.ui-search-layout--grid"
					);
					return Array.from(resultados.children).map((el) => el.outerHTML);
				});
				//console.log('Elementos:', elementos);
			} else {
				console.error(
					"No se encontró el contenedor de resultados o está vacío. Verifique el selector o la conexión."
				);
				continue; // Salta a la siguiente URL
			}

			// Itera sobre cada palabra clave
			for (const palabraClave of urlData.palabraClave) {
				do {
					// Realiza el scraping de cada aviso
					const products = await page.evaluate((palabraClave) => {
						// Selecciona todos los contenedores de resultados dentro del elemento <ol>
						const resultados = document.querySelectorAll(
							"ol.ui-search-layout.ui-search-layout--grid > li.ui-search-layout__item"
						);
						let data = [];

						resultados.forEach((resultado) => {
							const titulo =
								resultado.querySelector("h3.poly-component__title-wrapper > a")
									?.innerText || "Título no disponible";

							// Verificar la moneda antes de procesar
							const currencySymbol =
								resultado
									.querySelector(
										".poly-component__price .andes-money-amount__currency-symbol"
									)
									?.innerText.toLowerCase() || "";

							// Ignorar si es dólar (u$, us, us$)
							const isDollar =
								currencySymbol.startsWith("u$") ||
								currencySymbol.startsWith("us") ||
								currencySymbol.startsWith("us$");

							// Solo procesar si el título contiene la palabra clave (ignorando mayúsculas/minúsculas)
							if (
								titulo.toLowerCase().includes(palabraClave.toLowerCase()) &&
								!titulo.toLowerCase().includes("no leoncino") &&
								!titulo.toLowerCase().includes("no 300") &&
								!titulo.toLowerCase().includes("no trk") &&
								!titulo.toLowerCase().includes("no tnt 15") &&
								!titulo.toLowerCase().includes("no benelli") &&
								!titulo.toLowerCase().includes("no beneli") &&
								!titulo.toLowerCase().includes("no es benelli") &&
								!isDollar
							) {
								const precio =
									resultado.querySelector(
										".poly-component__price .andes-money-amount__fraction"
									)?.innerText || "Precio no disponible";
								const link =
									resultado.querySelector("h2.poly-component__title > a")
										?.href || "Link no disponible";
								const ubicacion =
									resultado.querySelector(".poly-component__location")
										?.innerText || "Ubicación no disponible";
								const vendedor =
									resultado.querySelector(".poly-component__seller")
										?.innerText || "Vendedor no disponible";
								const atributos =
									Array.from(
										resultado.querySelectorAll(
											".poly-component__attributes-list .poly-attributes-list__item"
										)
									).map((attr) => attr.innerText) || [];

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
							}
						});
						return data;
					}, palabraClave);

					allProducts = allProducts.concat(products); // Acumula los resultados
					console.log(
						`Productos encontrados para ${urlData.palabraClave} en esta página: ${products.length}`
					);

					// Verifica si hay un botón de "Siguiente" y haz clic en él
					//const siguienteBoton = await page.$('a[title="Siguiente"]'); // Selector del botón "Siguiente"
					//console.log("Siguiente boton encontrado", siguienteBoton);

					// Verifica si hay un botón de "Siguiente"
					const siguienteBoton = await page.$('a[title="Siguiente"]');
					console.log("Siguiente boton encontrado:", !!siguienteBoton);

					if (siguienteBoton) {
						try {
							// Obtener información de la página actual y la siguiente URL directamente del botón
							const pageInfo = await page.evaluate(() => {
								const currentPage = parseInt(
									document
										.querySelector(".andes-pagination__button--current")
										?.textContent?.trim() || "1"
								);
								const totalResultsText =
									document.querySelector(
										".ui-search-search-result__quantity-results"
									)?.textContent || "0";
								const totalResults = parseInt(totalResultsText.match(/\d+/)[0]);

								// Obtener el total de páginas desde la paginación
								const paginationButtons = document.querySelectorAll(
									".andes-pagination__button"
								);
								const lastPageButton = Array.from(paginationButtons)
									.filter(
										(button) =>
											!button.classList.contains(
												"andes-pagination__button--next"
											)
									)
									.pop();
								const totalPages = lastPageButton
									? parseInt(lastPageButton.textContent.trim())
									: Math.ceil(totalResults / 48);

								// Obtener la URL de la siguiente página directamente del botón siguiente
								const nextButton = document.querySelector(
									".andes-pagination__button--next a"
								);
								const nextUrl = nextButton ? nextButton.href : null;

								return {
									currentPage,
									totalPages,
									totalResults,
									nextUrl,
									hasMorePages: currentPage < totalPages,
								};
							});

							console.log(
								`Página ${pageInfo.currentPage} de ${pageInfo.totalPages} (${pageInfo.totalResults} resultados totales)`
							);

							if (!pageInfo.hasMorePages || !pageInfo.nextUrl) {
								console.log("Llegamos a la última página disponible");
								break;
							}

							console.log("Intentando navegar a:", pageInfo.nextUrl);

							// Navegar a la siguiente página
							const response = await page.goto(pageInfo.nextUrl, {
								waitUntil: "networkidle2",
								timeout: 35000,
							});

							// Verificar si la navegación fue exitosa
							if (response.status() !== 200) {
								console.log(
									`Error en la navegación: Status ${response.status()}`
								);
								break;
							}

							// Esperar a que los resultados se carguen
							await page.waitForSelector("ol.ui-search-layout", {
								timeout: 20000,
							});

							// Verificar si hay resultados en la nueva página
							const hasResults = await page.evaluate(() => {
								const results = document.querySelector("ol.ui-search-layout");
								return results && results.children.length > 0;
							});

							if (!hasResults) {
								console.log(
									"No se encontraron resultados en la siguiente página"
								);
								break;
							}

							console.log("Navegación exitosa a la siguiente página");
							await page.waitForTimeout(3000);
						} catch (error) {
							console.error("Error durante la navegación:", error);
							console.error("Error detallado:", error.message);
							break;
						}
					} else {
						console.log(
							"No se encontró el botón 'Siguiente'. Fin del scraping."
						);
						break;
					}
				} while (true);
			}
		}
		// Muestra los datos extraídos en la consola
		if (allProducts.length > 0) {
			console.log("Datos extraídos:", allProducts);
			console.log("Cantidad:", allProducts.length);
			return allProducts;
		} else {
			console.warn(
				"No se encontraron datos para extraer. Verifique los selectores o los resultados de la búsqueda."
			);
			return allProducts;
		}
	} catch (error) {
		console.log(
			"Error corriendo Puppeteer:",
			error.response ? error.response.data : error.message
		);
		return {
			error: error.response ? error.response.data : error.message,
		};
	} finally {
		// Cierra el navegador
		console.log("Cerrando el navegador...");
		isScraping = false;
		await browser.close();
	}
};
//scrapperMercadoLibre();
