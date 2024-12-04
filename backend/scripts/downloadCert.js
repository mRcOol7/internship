const https = require('https');
const fs = require('fs');
const path = require('path');

const certUrl = 'https://letsencrypt.org/certs/isrgrootx1.pem';
const certPath = path.resolve(__dirname, '..', 'isrgrootx1.pem');

console.log('Downloading SSL certificate...');

https.get(certUrl, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to download certificate: ${response.statusCode}`);
        process.exit(1);
    }

    const file = fs.createWriteStream(certPath);
    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('SSL certificate downloaded successfully');
    });
}).on('error', (err) => {
    console.error('Error downloading certificate:', err);
    process.exit(1);
});
