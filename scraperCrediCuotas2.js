// A continuación, se muestra el código modificado para solucionar problemas en modo headless.

import puppeteer from "puppeteer";

const scraperCrediCuotas2 = async (dni) => {
  // Opciones de lanzamiento adicionales:
  // - userAgent para evitar detecciones en modo headless
  // - headless "new" es útil en Puppeteer 20+, pero si generase problemas, dejar en true
  // - viewport para simular una pantalla real
  // - "slowMo" opcional para depuración

  const browser = await puppeteer.launch({
    headless: true, // Usa true o "new" según la versión de Puppeteer
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // A veces es útil añadir estos:
      // "--disable-gpu",
      // "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();

  // Configuramos un userAgent para mimetizar un navegador real.
  // Ajustar si la página es sensible a la versión exacta del navegador.
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
  );

  // Ajustamos viewport para simular una pantalla real.
  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log("Navegando a https://comercios.credicuotas.com.ar/#/login");
    await page.goto("https://comercios.credicuotas.com.ar/#/login", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("Esperando por el campo de usuario #username...");
    await page.waitForSelector("#username", { timeout: 30000 });
    console.log("Escribiendo el nombre de usuario...");
    const userField = await page.$("#username");
    if (userField) {
      await userField.type("GGLUNZ", { delay: 100 });
    } else {
      throw new Error("No se encontró el campo de usuario.");
    }

    console.log("Escribiendo la contraseña...");
    const passwordField = await page.$("#password");
    if (passwordField) {
      await passwordField.type("840728", { delay: 100 });
    } else {
      throw new Error("No se encontró el campo de contraseña.");
    }

    console.log("Haciendo clic en el botón de login...");
    const loginButton = await page.$('button[name="submit"]');
    if (loginButton) {
      await Promise.all([
        loginButton.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
      ]);
      console.log("Inicio de sesión exitoso.");

      // Esperamos a que aparezca el botón 'Comenzar'
      const yellowButtonSelector =
        ".padding-10-l.padding-10-r.margin-10-b .btn.btn-default-yellow";
      await page.waitForSelector(yellowButtonSelector, { timeout: 60000 });
      const yellowButton = await page.$(yellowButtonSelector);
      if (!yellowButton)
        throw new Error("No se encontró el botón 'Comenzar'.");

      const buttonText = await page.evaluate(
        (button) => button.textContent.trim(),
        yellowButton
      );
      console.log("Texto del botón encontrado:", buttonText);
      if (buttonText !== "Comenzar") {
        throw new Error("El botón encontrado no tiene el texto 'Comenzar'.");
      }
      console.log("Haciendo clic en el botón 'Comenzar'...");
      await yellowButton.click();

      console.log("Buscando el formulario con name='initForm'...");
      await page.waitForSelector('form[name="initForm"]', { timeout: 60000 });
      const form = await page.$('form[name="initForm"]');
      if (!form)
        throw new Error("No se encontró el formulario 'initForm'.");

      console.log("Buscando el select principal...");
      const select = await form.$(
        "select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
      );
      if (!select)
        throw new Error("No se encontró el select dentro del formulario.");

      console.log("Seleccionando la opción 'MOTO' (value=2)...");
      await select.select("2");

      console.log("Buscando label 'Sub Producto'...");
      const labels = await page.$$("label.label-input");
      let subProductoLabel = null;
      for (const label of labels) {
        const lblText = await page.evaluate((el) => el.textContent.trim(), label);
        if (lblText === "Sub Producto") {
          subProductoLabel = label;
          break;
        }
      }
      if (!subProductoLabel)
        throw new Error("No se encontró el label 'Sub Producto'.");

      console.log("Buscando el select asociado a 'Sub Producto'...");
      const selectElement = await subProductoLabel.evaluateHandle(
        (label) => label.nextElementSibling
      );
      if (!selectElement)
        throw new Error("No se encontró el select asociado al label 'Sub Producto'.");

      console.log("Seleccionando la opción 'MOTOS' (value=2)...");
      await selectElement.select("2");

      // Buscando el input para DNI
      console.log("Buscando el input para DNI...");
      const dniInput = await page.$(
        'input[title="Sólo números, entre 6 y 9 dígitos máximo"].form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required.ng-valid-pattern'
      );
      if (!dniInput) throw new Error("No se encontró el input para DNI.");

      console.log("Colocando el DNI:", dni);
      await dniInput.type(dni.toString(), { delay: 100 });
      await dniInput.press("Enter");

      console.log("Buscando el select de PERSONA...");
      const personaSelect = await page.$(
        "select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
      );
      if (!personaSelect)
        throw new Error(
          "No se encontró el select con la clase especificada (PERSONA)."
        );

      console.log("Buscando el botón 'Continuar'...");
      const continuarButton = await page.$("button.btn.btn-default-yellow");
      if (!continuarButton) {
        throw new Error("No se encontró el botón 'Continuar'.");
      }
      const continuarText = await page.evaluate(
        (btn) => btn.textContent.trim(),
        continuarButton
      );
      if (continuarText !== "Continuar") {
        throw new Error("El botón encontrado no tiene el texto 'Continuar'.");
      }

      console.log("Haciendo clic en 'Continuar'...");
      await Promise.all([
        continuarButton.click(),
        // Esperamos la navegación o cambio en la URL/spa
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }),
      ]);

      // El selector #step-2.panel a veces puede tardar en aparecer, repetimos la espera.
      const stepSelector = "#step-2.panel";
      let stepLoaded = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await page.waitForSelector(stepSelector, { timeout: 60000 });
          stepLoaded = true;
          console.log("#step-2.panel encontrado!");
          break;
        } catch (err) {
          console.log(
            `Intento ${attempt + 1}: No se encontró #step-2.panel. Reintentando...`
          );
          await page.waitForTimeout(3000);
        }
      }
      if (!stepLoaded)
        throw new Error(
          `No se encontró el selector ${stepSelector} después de varios intentos.`
        );

      console.log("Esperando el span con monto...");
      const montoSpanSelector = ".monto.font-weight-400.ng-binding";
      await page.waitForSelector(montoSpanSelector, { timeout: 60000 });

      let montoValue = "";
      for (let i = 0; i < 15; i++) {
        const montoSpan = await page.$(`#step-2.panel ${montoSpanSelector}`);
        if (montoSpan) {
          montoValue = await page.evaluate((span) => span.textContent, montoSpan);
          if (montoValue.trim() !== "") {
            console.log("Valor capturado:", montoValue);
            break;
          }
        }
        await page.waitForTimeout(1500);
      }

      console.log("Buscando lista de requisitos...");
      await page.waitForSelector("ul.documents", { timeout: 60000 });
      const requisitosList = await page.$$("ul.documents li");
      if (requisitosList.length === 0)
        throw new Error(
          "No se encontraron 'li' dentro de la ul.documents para los requisitos."
        );

      const requisitos = await Promise.all(
        requisitosList.map(async (li) => {
          return page.evaluate((item) => {
            const spans = item.querySelectorAll("span");
            spans.forEach((span) => span.remove());
            return item.textContent.trim();
          }, li);
        })
      );

      const requisitosString = requisitos.join(", ");
      const object = {
        montoCrédito: montoValue,
        requisitos: requisitosString,
      };

      console.log("Objeto final enviado:", object);

      await browser.close();
      return object;
    } else {
      throw new Error("No se encontró el botón de login.");
    }
  } catch (error) {
    console.error("Ocurrió un error en scraperCrediCuotas.js:", error);
    await browser.close();
    return error;
  }
};

export default scraperCrediCuotas2;

// Ejemplo de ejecución
/* scraperCrediCuotas2(20471170)
  .then((resultado) => {
    console.log("Resultado:", resultado);
  })
  .catch((err) => {
    console.log("Error en la ejecución:", err);
  }); */
