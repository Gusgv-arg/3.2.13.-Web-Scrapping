import { ApifyClient } from "apify-client";
import ExcelJS from "exceljs";
import dotenv from "dotenv"

dotenv.config()

//const token = process.env.APIFY_TOKEN
const client = new ApifyClient({
	token: "apify_api_dlX9xHKkHFTQwc4Zy5obbKHdeAo88P2PHgsS",
});

export const apifyFacebookScraper = async () => {
	const results = [];

	try {
		const input = {
			startUrls: [
				{
					url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&media_type=all&search_type=page&view_all_page_id=173245975874895",
				},
				{
					url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&media_type=image_and_meme&search_type=page&view_all_page_id=289127913034",
				},
			],
		};

		// Run the Actor
		const run = await client.actor("JJghSZmShuco4j9gJ").call(input);

		// Fetch and print Actor results from the run's dataset (if any)
		const { items } = await client.dataset(run.defaultDatasetId).listItems();
		//console.log("ITEMS:", items)

		items.forEach((item) => {
			console.log("item:",item);
			const name = item?.pageInfo?.page?.name 
			? item.pageInfo.page.name 
			: item.facebookUrl ? `Sin avisos id=${item.facebookUrl.split("id=").pop()}` : "Nombre no disponible"; // Modificación aquí
			const text = item?.snapshot?.body?.text ? item.snapshot.body.text : "No hay avisos o no tienen texto.";
			const cards = item?.snapshot?.cards ?  item.snapshot.cards : [];
			const images = item?.snapshot?.images ? item.snapshot.images : [];

			// Unificar las constantes cards e images
			const unifiedImages = [...images, ...cards];

			// Agrupar resultados por nombre
			if (!results[name]) {
				results[name] = []; 
			}
			results.push({ name, text, images: unifiedImages });
		});

		console.log("results:", results);
		return results

		/* // Crear un nuevo libro de Excel
		const workbook = new ExcelJS.Workbook();

		// Inicializar la fila donde comenzaremos a agregar resultados
		let startRow = 1;

		// Iterar sobre los nombres agrupados
		for (const [name, group] of Object.entries(results)) {
			// Crear una nueva hoja con el nombre del anunciante
			const worksheet = workbook.addWorksheet(name);

			// Inicializar la fila para este grupo
			startRow = 1;

			for (const result of group) {
				const { text, images } = result;

				// Agregar el texto a la celda correspondiente
				worksheet.getCell(`A${startRow}`).value = text;

				// Contar la cantidad de imágenes y cards
				const imageCount = images ? images.length : 0;

				// Agregar la cantidad de avisos debajo del texto
				worksheet.getCell(
					`A${startRow + 1}`
				).value = `Cantidad de avisos: ${imageCount}`;

				// Ajustar el tamaño de las celdas para las imágenes
				worksheet.getColumn(1).width = 40;
				worksheet.getColumn(2).width = 5;
				worksheet.getColumn(3).width = 40;
				worksheet.getColumn(4).width = 5;
				worksheet.getColumn(5).width = 40;

				// Agregar imágenes de "images"
				if (imageCount > 0) {
					for (let i = 0; i < imageCount; i++) {
						const imageUrl = images[i].originalImageUrl;

						// Descargar la imagen y agregarla a la hoja
						const response = await fetch(imageUrl);
						if (!response.ok)
							throw new Error(`Error al descargar la imagen: ${imageUrl}`);
						const arrayBuffer = await response.arrayBuffer();
						const buffer = Buffer.from(arrayBuffer); // Convertir a Buffer
						const imageId = workbook.addImage({
							buffer,
							type: "picture",
							extension: "png",
						});

						// Calcular la fila y columna para la imagen
						const row = startRow + 1;
						const col = (i * 2) % 6; // Columna 0, 2, 4 para las imágenes
						
						// Agregar la imagen a la celda correspondiente
						worksheet.addImage(imageId, {
							tl: { col: col, row: row },
							br: { col: col + 1, row: row + 1 },
							editAs: "oneCell",
						});

						// Ajustar la altura de la fila para que se muestre la imagen
						worksheet.getRow(row + 1).height = 400; 

						// Incrementar la fila después de cada 3 imágenes
						if ((i + 1) % 3 === 0) {
							startRow += 2; 
						}
						// Ajustar la altura de la fila vacía debajo de las imágenes
						worksheet.getRow(row + 2).height = 15; 
					}
				}

				// Incrementar la fila de inicio para el siguiente aviso
				startRow += Math.ceil(imageCount / 3) * 2; 
			}
		}

		// Guardar el archivo de Excel
		const facebookAds = await workbook.xlsx.writeFile("Avisos Facebook.xlsx");
		console.log("Archivo de Excel creado: Avisos Facebook.xlsx y enviado");
		return facebookAds */
	} catch (error) {
		console.log("Error-->", error.message);
		return error.message
	}
};
//apifyFacebookScraper();
