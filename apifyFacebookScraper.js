import { ApifyClient } from "apify-client";
import ExcelJS from "exceljs";
import dotenv from "dotenv";

dotenv.config();

//const token = process.env.APIFY_TOKEN
const client = new ApifyClient({
	token: "apify_api_dlX9xHKkHFTQwc4Zy5obbKHdeAo88P2PHgsS",
});

export const apifyFacebookScraper = async () => {
	const results = [];

	try {
		const input = {
			startUrls: [
				/* {
					url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&media_type=all&search_type=page&view_all_page_id=173245975874895",
				},
				{
					url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&media_type=image_and_meme&search_type=page&view_all_page_id=289127913034",
				}, */
				{
					name: "Ciudad Moto",
					url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AR&media_type=all&search_type=page&view_all_page_id=289127913034",
				},
			],
		};

		// Run the Actor
		const run = await client.actor("JJghSZmShuco4j9gJ").call(input);

		// Fetch and print Actor results from the run's dataset (if any)
		const { items } = await client.dataset(run.defaultDatasetId).listItems();
		//console.log("ITEMS:", items)

		items.forEach((item) => {
			//console.log("item:",item);
			const name = item?.name
				? item.name
				: item?.pageInfo?.page?.name
				? item.pageInfo.page.name
				: item.facebookUrl
				? `Sin avisos id=${item.facebookUrl.split("id=").pop()}`
				: "Nombre no disponible"; 
			const text = item?.snapshot?.body?.text
				? item.snapshot.body.text
				: "No hay avisos o no tienen texto.";
			const cards = item?.snapshot?.cards ? item.snapshot.cards : [];
			const images = item?.snapshot?.images ? item.snapshot.images : [];
			const videos = item?.snapshot?.videos ? item.snapshot.videos : [];
			const extraTexts = item?.snapshot?.extraTexts
				? item.snapshot.extraTexts
				: "";
			console.log("Videos:", videos);
			console.log("Extra Texts:", extraTexts);

			// Unificar las constantes cards e images
			const unifiedImages = [...images, ...cards, ...videos];

			// Agrupar resultados por nombre
			if (!results[name]) {
				results[name] = [];
			}
			results.push({ name, text, images: unifiedImages, extraTexts });
		});

		console.log("results:", results);
		return results;
		
	} catch (error) {
		console.log("Error-->", error.message);
		return error.message;
	}
};
//apifyFacebookScraper();
