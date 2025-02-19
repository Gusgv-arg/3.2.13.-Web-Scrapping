import puppeteer from "puppeteer";
const dni = 20471170;

const scraperCrediCuotas = async (dni) => {
	// Inicializamos el navegador con opciones adicionales
	const browser = await puppeteer.launch({
		headless: true, // `headless: false` para ver lo que sucede en el navegador
		args: ["--no-sandbox", "--disable-setuid-sandbox"], // Opciones para mejorar la estabilidad		
	});

	const page = await browser.newPage();
	
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
									"'Sub Producto' encontrado. Buscando el select asociado..."
								);

								// Buscamos el select que sigue al label
								const selectElement = await subProductoLabel.evaluateHandle(
									(label) => {
										return label.nextElementSibling; // Asumiendo que el select es el siguiente elemento
									}
								);

								if (selectElement) {
									console.log(
										"Seleccionando la opción de subproducto 'MOTOS'..."
									);

									// Seleccionamos la opción con value="2"
									await selectElement.select("2"); // Usamos el value para seleccionar la opción
									console.log("Opción subproducto 'MOTOS' seleccionada");

									// Buscamos el input para el DNI
									const dniInput = await page.$(
										'input[title="Sólo números, entre 6 y 9 dígitos máximo"].form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required.ng-valid-pattern'
									);

									if (dniInput) {
										console.log(
											"Input para DNI encontrado. Colocando el DNI: ",
											dni
										);
										await dniInput.type(dni.toString(), { delay: 100 }); // Colocamos el DNI con un pequeño retraso

										// Simulamos la pulsación de la tecla "Enter"
										await dniInput.press("Enter");

										// Buscamos la primer opción de la PERSONA que aparece"
										const selectElement = await page.$(
											"select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
										);

										if (selectElement) {
											console.log("Seleccionando la opción de PERSONA");

											// Buscamos el botón "Continuar"
											const continuarButton = await page.$(
												"button.btn.btn-default-yellow"
											);
											if (continuarButton) {
												const buttonText = await page.evaluate(
													(button) => button.textContent.trim(),
													continuarButton
												);
												if (buttonText === "Continuar") {
													console.log(
														"Haciendo clic en el botón 'Continuar'..."
													);
													await continuarButton.click(); // Hacemos clic en el botón
													console.log("Botón 'Continuar' clickeado.");

													// Esperamos a que el contenido de la nueva página se cargue
													await page.waitForSelector("#step-2.panel", {
														timeout: 60000,
													});

													// Esperamos a que el span esté disponible
													const montoSpanSelector =
														".monto.font-weight-400.ng-binding";
													await page.waitForSelector(montoSpanSelector, {
														timeout: 60000,
													});

													// Usamos un bucle para esperar hasta que el contenido del span no esté vacío
													let montoValue = "";
													for (let i = 0; i < 15; i++) {
														// Intentar 10 veces
														const montoSpan = await page.$(
															"#step-2.panel " + montoSpanSelector
														);
														if (montoSpan) {
															montoValue = await page.evaluate(
																(span) => span.textContent,
																montoSpan
															);
															if (montoValue.trim() !== "") {
																console.log("Valor capturado:", montoValue);
																break; // Salimos del bucle si encontramos el valor
															}
														}
														await page.waitForTimeout(1500); // Esperar medio segundo antes de volver a intentar
													}

													// Esperamos a que la ul con los requisitos esté disponible
													await page.waitForSelector("ul.documents", {
														timeout: 60000,
													});

													// Capturamos los requisitos de la lista
													const requisitosList = await page.$$(
														"ul.documents li"
													); // Obtenemos todos los li dentro de la ul

													if (requisitosList.length > 0) {
														const requisitos = await Promise.all(
															requisitosList.map(async (li) => {
																// Capturamos solo el texto de los li, excluyendo el texto de los span
																const liText = await page.evaluate((item) => {
																	// Obtenemos el texto del li y excluimos el texto de los span
																	const spans = item.querySelectorAll("span");
																	spans.forEach((span) => span.remove()); // Eliminamos los span del li
																	return item.textContent.trim(); // Retornamos el texto restante
																}, li);
																return liText; // Retornamos el texto limpio
															})
														);

														// Unimos los requisitos en un string separado por comas
														const requisitosString = requisitos.join(", ");

														// Devolvemos el objeto con el monto y los requisitos
														const object = {
															monto: montoValue,
															requisitos: requisitosString,
														};
														console.log("Objeto a devolver:", object);

														// Cerramos el navegador
														await browser.close(); // Cerrar el navegador
														return object;
													} else {
														throw new Error(
															"No se encontraron elementos 'li' dentro de la ul con la clase 'documents'."
														);
													}
												} else {
													throw new Error(
														"El botón encontrado no tiene el texto 'Continuar'."
													);
												}
											} else {
												throw new Error("No se encontró el botón 'Continuar'.");
											}
										} else {
											throw new Error(
												"No se encontró el select con la clase especificada."
											);
										}
									} else {
										throw new Error("No se encontró el input para DNI.");
									}
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
scraperCrediCuotas(20471170);
