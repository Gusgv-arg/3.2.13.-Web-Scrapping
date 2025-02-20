import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Registramos el plugin stealth para ocultar indicios de headless
puppeteer.use(StealthPlugin());

const scraperCrediCuotas2 = async (dni) => {
  let browser;
  try {
    console.log("Iniciando Puppeteer con plugin stealth...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        // Opcional, si da problemas:
        // "--disable-gpu",
        // "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // Ajustamos un timeout por defecto para todas las operaciones (esperas de selectores, etc.)
    page.setDefaultTimeout(120000); // 2 minutos de timeout general

    console.log("Configurando userAgent y viewport...");
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 720 });

    console.log("Navegando a la página de login...");
    await page.goto("https://comercios.credicuotas.com.ar/#/login", {
      waitUntil: "networkidle2", // Esperamos que haya 0 o casi 0 peticiones en red
      timeout: 60000,
    });
    console.log("Página de login cargada.");

    // Username
    console.log("Esperando por el campo de usuario (#username)...");
    await page.waitForSelector("#username");
    const userField = await page.$("#username");
    if (!userField) {
      console.log("No se encontró el campo de usuario.");
      return { success: false, error: "No se encontró el campo de usuario." };
    }
    console.log("Escribiendo el nombre de usuario...");
    await userField.type("GGLUNZ", { delay: 100 });

    // Password
    console.log("Esperando por el campo de contraseña (#password)...");
    const passwordField = await page.$("#password");
    if (!passwordField) {
      console.log("No se encontró el campo de contraseña.");
      return { success: false, error: "No se encontró el campo de contraseña." };
    }
    console.log("Escribiendo la contraseña...");
    await passwordField.type("840728", { delay: 100 });

    // Botón de login
    console.log("Buscando el botón de login (button[name='submit'])...");
    const loginButton = await page.$('button[name="submit"]');
    if (!loginButton) {
      console.log("No se encontró el botón de login.");
      return { success: false, error: "No se encontró el botón de login." };
    }
    console.log("Haciendo clic en el botón de login...");
    await Promise.all([
      loginButton.click(),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    ]);
    console.log("Inicio de sesión exitoso.");

    // Botón "Comenzar"
    const yellowButtonSelector =
      ".padding-10-l.padding-10-r.margin-10-b .btn.btn-default-yellow";
    console.log("Buscando el botón 'Comenzar'...");
    await page.waitForSelector(yellowButtonSelector, { timeout: 60000 });
    const yellowButton = await page.$(yellowButtonSelector);
    if (!yellowButton) {
      console.log("No se encontró el botón 'Comenzar'.");
      return { success: false, error: "No se encontró el botón 'Comenzar'." };
    }
    const buttonText = await page.evaluate(
      (btn) => btn.textContent.trim(),
      yellowButton
    );
    console.log("Texto del botón encontrado:", buttonText);
    if (buttonText !== "Comenzar") {
      console.log("El botón encontrado no tiene el texto 'Comenzar'.");
      return { success: false, error: "El botón encontrado no tiene el texto 'Comenzar'." };
    }
    console.log("Haciendo clic en el botón 'Comenzar'...");
    await yellowButton.click();

    // Formulario initForm
    console.log("Buscando el formulario con name='initForm'...");
    await page.waitForSelector('form[name="initForm"]', { timeout: 60000 });
    const form = await page.$('form[name="initForm"]');
    if (!form) {
      console.log("No se encontró el formulario 'initForm'.");
      return { success: false, error: "No se encontró el formulario 'initForm'." };
    }

    // Select principal
    console.log("Buscando el select principal dentro de initForm...");
    const selectPrincipal = await form.$(
      "select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
    );
    if (!selectPrincipal) {
      console.log("No se encontró el select principal dentro del formulario.");
      return { success: false, error: "No se encontró el select dentro del formulario." };
    }
    console.log("Seleccionando la opción 'MOTO' (value=2)...");
    await selectPrincipal.select("2");

    // Sub Producto
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
    if (!subProductoLabel) {
      console.log("No se encontró el label 'Sub Producto'.");
      return { success: false, error: "No se encontró el label 'Sub Producto'." };
    }
    console.log("Obteniendo select asociado a 'Sub Producto'...");
    const selectElement = await subProductoLabel.evaluateHandle(
      (label) => label.nextElementSibling
    );
    if (!selectElement) {
      console.log("No se encontró el select asociado al label 'Sub Producto'.");
      return {
        success: false,
        error: "No se encontró el select asociado a 'Sub Producto'.",
      };
    }
    console.log("Seleccionando la opción 'MOTOS' (value=2)...");
    await selectElement.select("2");

    // DNI
    console.log("Buscando el input para DNI...");
    const dniInput = await page.$(
      'input[title="Sólo números, entre 6 y 9 dígitos máximo"].form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required.ng-valid-pattern'
    );
    if (!dniInput) {
      console.log("No se encontró el input para DNI.");
      return { success: false, error: "No se encontró el input para DNI." };
    }
    console.log("Escribiendo DNI:", dni);
    await dniInput.type(dni.toString(), { delay: 100 });
    console.log("Presionando Enter en el input de DNI...");
    await dniInput.press("Enter");

    console.log("Buscando el select de PERSONA...");
    const personaSelect = await page.$(
      "select.form-control.ng-pristine.ng-untouched.ng-empty.ng-invalid.ng-invalid-required"
    );
    if (!personaSelect) {
      console.log("No se encontró el select de PERSONA.");
      return { success: false, error: "No se encontró el select de PERSONA." };
    }

    // Botón "Continuar"
    console.log("Buscando el botón 'Continuar'...");
    const continuarButton = await page.$("button.btn.btn-default-yellow");
    if (!continuarButton) {
      console.log("No se encontró el botón 'Continuar'.");
      return { success: false, error: "No se encontró el botón 'Continuar'." };
    }
    const continuarText = await page.evaluate(
      (btn) => btn.textContent.trim(),
      continuarButton
    );
    console.log("Texto del botón encontrado:", continuarText);
    if (continuarText !== "Continuar") {
      console.log("El botón encontrado no tiene el texto 'Continuar'.");
      return {
        success: false,
        error: "El botón encontrado no tiene el texto 'Continuar'.",
      };
    }
    console.log("Haciendo clic en 'Continuar' y esperando la navegación...");
    await Promise.all([
      continuarButton.click(),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }),
    ]);

    // Añadimos 5s extra para dar margen a la SPA
    console.log("Esperando 5s adicionales tras el click en 'Continuar'...");
    await page.waitForTimeout(5000);

    // Reintentos para #step-2.panel
    console.log("Buscando #step-2.panel...");
    let stepLoaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.waitForSelector("#step-2.panel", { timeout: 30000 });
        stepLoaded = true;
        console.log("#step-2.panel encontrado en el intento:", attempt);
        break;
      } catch (err) {
        console.log(
          `Intento ${attempt}: No se encontró #step-2.panel. Reintentando en 3s...`
        );
        if (attempt < 3) {
          await page.waitForTimeout(3000);
        } else {
          console.log("No se encontró #step-2.panel tras 3 intentos.");
          return {
            success: false,
            error: "No se encontró #step-2.panel después de varios intentos.",
          };
        }
      }
    }

    // Monto
    console.log("Buscando el span con el monto (.monto.font-weight-400.ng-binding)...");
    const montoSpanSelector = ".monto.font-weight-400.ng-binding";
    await page.waitForSelector(montoSpanSelector, { timeout: 60000 });

    let montoValue = "";
    for (let i = 0; i < 15; i++) {
      const montoSpan = await page.$(`#step-2.panel ${montoSpanSelector}`);
      if (montoSpan) {
        montoValue = await page.evaluate((span) => span.textContent, montoSpan);
        if (montoValue.trim() !== "") {
          console.log("Monto capturado:", montoValue);
          break;
        }
      }
      await page.waitForTimeout(1500);
    }

    // Requisitos
    console.log("Buscando lista de requisitos (ul.documents)...");
    await page.waitForSelector("ul.documents", { timeout: 60000 });
    const requisitosList = await page.$$("ul.documents li");
    if (requisitosList.length === 0) {
      console.log("No se encontraron elementos 'li' dentro de ul.documents.");
      return {
        success: false,
        error: "No se encontraron elementos 'li' dentro de ul.documents.",
      };
    }
    console.log("Capturando requisitos...");
    const requisitos = await Promise.all(
      requisitosList.map(async (li) => {
        return page.evaluate((item) => {
          const spans = item.querySelectorAll("span");
          spans.forEach((span) => span.remove());
          return item.textContent.trim();
        }, li);
      })
    );

    // Armamos el objeto final
    const objetoFinal = {
      success: true,
      data: {
        monto: montoValue,
        requisitos: requisitos.join(", "),
      },
    };
    console.log("Objeto final a devolver:", objetoFinal);

    console.log("Cerrando navegador...");
    await browser.close();
    console.log("Navegador cerrado. Devolviendo objeto final...");
    return objetoFinal;
  } catch (error) {
    console.log("Error inesperado:", error);
    if (browser) {
      await browser.close();
      console.log("Navegador cerrado tras el error inesperado.");
    }
    return { success: false, error: error.message || "Error desconocido" };
  }
};

export default scraperCrediCuotas2;

// Ejemplo de uso:
//scraperCrediCuotas2(20471170)
  