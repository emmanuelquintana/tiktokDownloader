const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Función para esperar un selector con reintentos
async function waitForSelectorWithRetries(page, selector, retries = 3, timeout = 15000) {
    while (retries > 0) {
        try {
            await page.waitForSelector(selector, { timeout });
            return true; // Si el selector se encuentra, termina la función
        } catch (error) {
            retries--;
            console.warn(`Retrying selector '${selector}'... Attempts left: ${retries}`);
            if (retries === 0) throw new Error(`Failed to find selector '${selector}' after retries`);
        }
    }
}

// Función principal para procesar un enlace
async function scrapeVideo(link, browser) {
    const page = await browser.newPage();

    try {
        console.log(`Navigating to video link: ${link}`);
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Reintentos para el selector del video
        await waitForSelectorWithRetries(page, 'video source[src]', 3, 15000);
        const videoSrc = await page.evaluate(() => {
            const videoElement = document.querySelector('video source[src]');
            return videoElement ? videoElement.src : null;
        });

        if (!videoSrc) throw new Error('Video source not found');

        // Capturar el thumbnail
        await waitForSelectorWithRetries(page, 'picture img', 3, 15000);
        const thumbnailSrc = await page.evaluate(() => {
            const imgElement = document.querySelector('picture img');
            return imgElement ? imgElement.src : null;
        });

        if (!thumbnailSrc) throw new Error('Thumbnail source not found');

        // Capturar el título
        const title = await page.evaluate(() => {
            const titleElement = document.querySelector('h1[data-e2e="video-desc"]');
            if (titleElement) {
                // Combina todo el contenido de texto dentro del <h1>
                return Array.from(titleElement.childNodes)
                    .map(node => node.textContent.trim())
                    .join(' ');
            }
            return 'No title found';
        });

        // Descargar el video
        const cookies = (await page.cookies())
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        const videoPath = await downloadVideo(videoSrc, cookies, {
            Referer: 'https://www.tiktok.com/',
        });

        console.log('Video descargado en:', videoPath);
        console.log('Miniatura encontrada:', thumbnailSrc);
        console.log('Título del video:', title);

        return {
            link,
            videoSrc,
            downloadLink: `http://localhost:3001/videos/${path.basename(videoPath)}`,
            thumbnail: thumbnailSrc,
            title,
        };
    } catch (error) {
        console.error(`Error processing video at ${link}: ${error.message}`);
        // Captura de pantalla para depuración
        const screenshotPath = path.resolve(__dirname, `../../public/videos/error_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(`Screenshot saved to ${screenshotPath}`);
        return { link, error: error.message };
    } finally {
        await page.close();
    }
}

// Función para descargar el video
async function downloadVideo(videoUrl, cookies, headers) {
    try {
        const response = await axios.get(videoUrl, {
            headers: {
                ...headers,
                Cookie: cookies,
                Referer: 'https://www.tiktok.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            },
            responseType: 'stream',
        });

        const videoName = `${Date.now()}.mp4`;
        const videoPath = path.resolve(__dirname, '../../public/videos', videoName);

        const writer = fs.createWriteStream(videoPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(videoPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading video:', error.message);
        throw error;
    }
}

// Función para procesar múltiples enlaces
async function scrapeVideos(links) {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const results = await Promise.all(
            links.map(link => scrapeVideo(link, browser))
        );
        return results;
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeVideos };
