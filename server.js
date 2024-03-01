const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const fs = require('fs');

const server = express();
const localProxy = fs.readFileSync('./config/localProxy.dat', 'utf8').trim(); // Menggunakan trim untuk menghilangkan spasi atau baris baru yang tidak diinginkan
const port = process.env.PORT || fs.readFileSync('./config/port.dat', 'utf8').trim(); // Menggunakan trim untuk menghilangkan spasi atau baris baru yang tidak diinginkan

// Fungsi untuk memeriksa ketersediaan server tujuan
function checkServerAvailability() {
    return new Promise((resolve, reject) => {
        http.get(localProxy, (res) => {
            // Server tersedia, maka resolve
            if (res.statusCode === 200) {
                resolve();
            } else {
                reject();
            }
        }).on('error', () => {
            // Terjadi error, maka reject
            reject();
        });
    });
}

// Middleware untuk menangani permintaan
server.get(async (req, res, next) => {
    try {
        // Memeriksa ketersediaan server
        await checkServerAvailability();
        // Jika server tersedia, lanjutkan ke proxy
        next();
    } catch (error) {
        // Jika server tidak tersedia, tampilkan pesan maintenance
        var html = fs.readFileSync('./view/attention.html', 'utf8');
        res.send(html);
    }
});

// Proxy middleware
server.use(createProxyMiddleware({
    target: localProxy,
    changeOrigin: true,
    pathRewrite: {
        '^/': '/'
    },
    onError: (err, req, res) => {
       // Jika server tidak tersedia, tampilkan pesan maintenance
       var html = fs.readFileSync('./view/attention.html', 'utf8');
       res.send(html);
    }
}));

server.listen(port, () => {
    console.log('Server is running on port', port);
});
