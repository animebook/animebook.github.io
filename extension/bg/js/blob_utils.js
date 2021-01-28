class BlobUtils {
    async blobToBase64(blob) {
        const promise = new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = function() {
                var dataUrl = reader.result;
                var base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        })

        const result = await promise;
        return result;
    };
}