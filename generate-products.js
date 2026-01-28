import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aquí pegaremos TODOS los productos que el usuario proporcionó
const products = [
    // Los productos se añadirán aquí mediante el script
];

// Guardar el archivo JSON
const outputPath = path.join(__dirname, 'src', 'data', 'products-database.json');
const outputDir = path.dirname(outputPath);

// Crear el directorio si no existe
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Escribir el archivo
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');

console.log(`✅ Base de datos de productos generada exitosamente!`);
console.log(`📁 Ubicación: ${outputPath}`);
console.log(`📊 Total de productos: ${products.length}`);
