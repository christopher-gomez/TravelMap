(async () => {
    const imagemin = await import('imagemin');
    const imageminPngquant = await import('imagemin-pngquant');

    const files = await imagemin.default(['./Assets'], {
        destination: './optimizedAssets',
        plugins: [
            imageminPngquant.default()
        ]
    });

    console.log(files);
})();