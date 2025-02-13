import puppeteer from 'puppeteer';

const scraperCrediCuotas = async () => {
  // Inicializamos el navegador con opciones adicionales
  const browser = await puppeteer.launch({
    headless: false, // `headless: false` para ver lo que sucede en el navegador
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Opciones para mejorar la estabilidad
    defaultViewport: null, // Usar la resolución nativa del navegador
    timeout: 60000 // Aumentar el tiempo de espera para evitar desconexiones prematuras
  });

  const page = await browser.newPage();

  try {
    // Bloqueamos solicitudes a recursos externos no críticos
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (
        request.url().includes('wisepops.net') || // Bloqueamos solicitudes a wisepops.net
        request.url().includes('zendesk.com') || // Bloqueamos solicitudes a Zendesk
        request.resourceType() === 'image' || // Bloqueamos imágenes
        request.resourceType() === 'stylesheet' || // Bloqueamos hojas de estilo
        request.resourceType() === 'font' // Bloqueamos fuentes
      ) {
        request.abort(); // Abortamos la solicitud
      } else {
        request.continue(); // Permitimos la solicitud
      }
    });

    // Navegamos a la página principal
    console.log('Navegando a https://www.credicuotas.com.ar/');
    await page.goto('https://www.credicuotas.com.ar/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Esperamos a que el div con la clase especificada esté presente
    console.log('Buscando el div con class="MuiBox-root css-xi606m"');
    await page.waitForSelector('.MuiBox-root.css-xi606m', { timeout: 30000 });

    // Inspeccionamos el DOM para verificar que el enlace existe
    console.log('Verificando si el enlace de login existe...');
    const linkExists = await page.evaluate(() => {
      const link = document.querySelector('a[href="https://comercios.credicuotas.com.ar/#/login"]');
      return !!link; // Retorna true si el enlace existe, false si no
    });

    if (!linkExists) {
      throw new Error('El enlace de login no fue encontrado en la página.');
    }

    // Esperamos un momento adicional para asegurarnos de que el enlace esté disponible
    console.log('Esperando un momento para asegurar disponibilidad del enlace...');
    await page.waitForTimeout(3000); // Espera de 3 segundos (ajusta según sea necesario)

    // Buscamos nuevamente el enlace y hacemos clic
    console.log('Haciendo clic en el enlace de login...');
    const loginLink = await page.$('a[href="https://comercios.credicuotas.com.ar/#/login"]');
    if (loginLink) {
      // Esperamos tanto la navegación como una respuesta específica
      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
      const responsePromise = page.waitForResponse(response => {
        return response.url().includes('https://comercios.credicuotas.com.ar/#/login') && response.status() === 200;
      }, { timeout: 60000 });

      await loginLink.click(); // Hacemos clic en el enlace

      // Esperamos ambas promesas
      await Promise.all([navigationPromise, responsePromise]);
      console.log('Navegación exitosa a la página de login.');
    } else {
      console.error('No se encontró el enlace de login.');
    }

    // DEPURACIÓN: Obtenemos el HTML completo de la página
    console.log('Obteniendo el HTML completo de la página...');
    const pageContent = await page.content();
    console.log('HTML de la página:', pageContent);

    // DEPURACIÓN: Inspeccionamos todos los elementos <input> y <button>
    console.log('Inspeccionando elementos <input> y <button> en el DOM...');
    const debugElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('input, button'));
      return elements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        name: el.name,
        className: el.className,
        value: el.value,
        placeholder: el.placeholder
      }));
    });
    console.log('Elementos encontrados:', debugElements);

    // Segundo paso: Completar el formulario de login
    console.log('Completando el formulario de login...');

    // Esperamos explícitamente por el campo de usuario
    console.log('Esperando por el campo de usuario...');
    try {
      await page.waitForSelector('#username', { timeout: 30000 }); // Esperamos hasta que el campo de usuario esté disponible
    } catch (error) {
      console.error('El campo de usuario no apareció después de 30 segundos.');
      throw error;
    }

    // Buscamos el input de usuario usando el atributo id="username"
    console.log('Escribiendo el nombre de usuario...');
    const userField = await page.$('#username'); // Selector basado en id
    if (userField) {
      await userField.type('GGLUNZ', { delay: 100 }); // Tipeamos el usuario con un pequeño retraso
    } else {
      throw new Error('No se encontró el campo de usuario.');
    }

    // Buscamos el input de contraseña usando el atributo id="password"
    console.log('Escribiendo la contraseña...');
    const passwordField = await page.$('#password'); // Selector basado en id
    if (passwordField) {
      await passwordField.type('840728', { delay: 100 }); // Tipeamos la contraseña con un pequeño retraso
    } else {
      throw new Error('No se encontró el campo de contraseña.');
    }

    // Buscamos el botón de login usando el atributo name="submit"
    console.log('Haciendo clic en el botón de login...');
    const loginButton = await page.$('button[name="submit"]');
    if (loginButton) {
      await Promise.all([
        loginButton.click(), // Hacemos clic en el botón
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }) // Esperamos a que la nueva página cargue completamente
      ]);
      console.log('Inicio de sesión exitoso.');
    } else {
      throw new Error('No se encontró el botón de login.');
    }
  } catch (error) {
    if (error.message.includes('browser has disconnected')) {
      console.error('El navegador se ha desconectado. Verifica los recursos del sistema o aumenta los tiempos de espera.');
    } else {
      console.error('Ocurrió un error:', error);
    }
  } finally {
    // Cerramos el navegador al finalizar
    // await browser.close(); // Descomentar esta línea si deseas cerrar el navegador automáticamente
  }
};

export default scraperCrediCuotas;
scraperCrediCuotas()