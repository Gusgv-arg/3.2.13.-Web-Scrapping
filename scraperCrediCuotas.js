import puppeteer from "puppeteer";

const scraperCrediCuotas = async () => {
	// Inicializamos el navegador con opciones adicionales
	const browser = await puppeteer.launch({
		headless: false, // `headless: false` para ver lo que sucede en el navegador
		args: ["--no-sandbox", "--disable-setuid-sandbox"], // Opciones para mejorar la estabilidad
		defaultViewport: null, // Usar la resolución nativa del navegador
		timeout: 60000, // Aumentar el tiempo de espera para evitar desconexiones prematuras
	});

	const page = await browser.newPage();

	// ... existing code ...

	try {
		// Navegamos directamente a la página de login
		console.log("Navegando a https://comercios.credicuotas.com.ar/#/login");
		await page.goto("https://comercios.credicuotas.com.ar/#/login", {
			waitUntil: "networkidle2",
			timeout: 60000,
		});

		// DEPURACIÓN: Obtenemos el HTML completo de la página después de la navegación
		console.log("Obteniendo el HTML completo de la página de login...");
		const pageContent = await page.content();
		//console.log('HTML de la página:', pageContent);

		// DEPURACIÓN: Inspeccionamos todos los elementos <input> y <button> en la página de login
		console.log(
			"Inspeccionando elementos <input> y <button> en el DOM de la página de login..."
		);
		const debugElements = await page.evaluate(() => {
			const elements = Array.from(document.querySelectorAll("input, button"));
			return elements.map((el) => ({
				tagName: el.tagName,
				id: el.id,
				name: el.name,
				className: el.className,
				value: el.value,
				placeholder: el.placeholder,
			}));
		});
		//console.log("Elementos encontrados en la página de login:", debugElements);

		// Aquí puedes continuar con el proceso de login como antes
		// Esperamos explícitamente por el campo de usuario
		console.log("Esperando por el campo de usuario...");
		await page.waitForSelector("#username", { timeout: 30000 }); // Esperamos hasta que el campo de usuario esté disponible

		// Buscamos el input de usuario usando el atributo id="username"
		console.log("Escribiendo el nombre de usuario...");
		const userField = await page.$("#username"); // Selector basado en id
		if (userField) {
			await userField.type("GGLUNZ", { delay: 100 }); // Tipeamos el usuario con un pequeño retraso
		} else {
			throw new Error("No se encontró el campo de usuario.");
		}

		// Buscamos el input de contraseña usando el atributo id="password"
		console.log("Escribiendo la contraseña...");
		const passwordField = await page.$("#password"); // Selector basado en id
		if (passwordField) {
			await passwordField.type("840728", { delay: 100 }); // Tipeamos la contraseña con un pequeño retraso
		} else {
			throw new Error("No se encontró el campo de contraseña.");
		}

		// Buscamos el botón de login usando el atributo name="submit"
		console.log("Haciendo clic en el botón de login...");
		const loginButton = await page.$('button[name="submit"]');
		if (loginButton) {
			await Promise.all([
				loginButton.click(), // Hacemos clic en el botón
				page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }), // Esperamos a que la nueva página cargue completamente
			]);
			console.log("Inicio de sesión exitoso.");

			// Hacemos clic en el botón "Comenzar" dentro del div específico
			console.log("Haciendo clic en el botón 'Comenzar'...");

			const yellowButtonSelector =
				".padding-10-l.padding-10-r.margin-10-b .btn.btn-default-yellow";

			let yellowButton;
			try {
				// Esperamos explícitamente por el botón 'Comenzar'
				await page.waitForSelector(yellowButtonSelector, { timeout: 60000 }); // Aumentar el tiempo de espera
				yellowButton = await page.$(yellowButtonSelector); // Seleccionamos el botón
			} catch (error) {
				throw new Error(
					"No se encontró el botón 'Comenzar' después de esperar."
				);
			}

			if (yellowButton) {
				// Verificamos el texto del botón antes de hacer clic
				const buttonText = await page.evaluate(
					(button) => button.textContent.trim(),
					yellowButton
				);
				console.log("Texto del botón encontrado:", buttonText);

				if (buttonText === "Comenzar") {
					console.log("Intentando hacer clic en el botón 'Comenzar'...");
					await yellowButton.click(); // Hacemos clic en el botón amarillo

					console.log("Buscando el formulario con name='initForm'...");

					// Esperamos a que el formulario esté disponible
					await page.waitForSelector('form[name="initForm"]', {
						timeout: 60000,
					});

					// Seleccionamos el formulario
					const form = await page.$('form[name="initForm"]');
					if (form) {
						console.log("Formulario encontrado. Buscando el select...");

						// Buscamos el select dentro del formulario
						const select = await form.$(
							"select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
						);

						if (select) {
							console.log(
								"Select encontrado. Seleccionando la opción 'MOTO'..."
							);

							// Seleccionamos la opción con label="MOTO" y value="2"
							await select.select("2"); // Usamos el value para seleccionar la opción
							console.log("Opción 'MOTO' seleccionada.");

							// Buscamos todos los labels con la clase "label-input"
							const labels = await page.$$("label.label-input");
							let subProductoLabel = null;

							// Filtramos para encontrar el label que contiene "Sub Producto"
							for (const label of labels) {
								const labelText = await page.evaluate(
									(el) => el.textContent.trim(),
									label
								);
								if (labelText === "Sub Producto") {
									subProductoLabel = label;
									break;
								}
							}

							if (subProductoLabel) {
								console.log(
									"Label 'Sub Producto' encontrado. Buscando el select asociado..."
								);

								// Buscamos el select que sigue al label
								const selectElement = await subProductoLabel.evaluateHandle(
									(label) => {
										return label.nextElementSibling; // Asumiendo que el select es el siguiente elemento
									}
								);

								if (selectElement) {
									console.log(
										"Select encontrado. Seleccionando la opción 'MOTOS'..."
									);

									// Seleccionamos la opción con value="2"
									await selectElement.select("2"); // Usamos el value para seleccionar la opción
									console.log("Opción 'MOTOS' seleccionada nuevamente!!.");
								} else {
									throw new Error(
										"No se encontró el select asociado al label 'Sub Producto'."
									);
								}
							} else {
								throw new Error("No se encontró el label 'Sub Producto'.");
							}
						} else {
							throw new Error(
								"No se encontró el select dentro del formulario."
							);
						}
					} else {
						throw new Error("No se encontró el formulario 'initForm'.");
					}
				} else {
					throw new Error("El botón encontrado no tiene el texto 'Comenzar'.");
				}
			} else {
				throw new Error("No se encontró el botón 'Comenzar'.");
			}
		} else {
			throw new Error("No se encontró el botón de login.");
		}
	} catch (error) {
		console.error("Ocurrió un error:", error);
	} finally {
		// Cerramos el navegador al finalizar
		//await browser.close(); // Descomentar esta línea si deseas cerrar el navegador automáticamente
	}
};

export default scraperCrediCuotas;
scraperCrediCuotas();
