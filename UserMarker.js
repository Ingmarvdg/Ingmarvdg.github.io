function newDot(size) {
    let width = size;
    let height = size;
    return {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),

        onAdd: function () {
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            this.context = canvas.getContext('2d');
        },

        render: function () {
            const duration = 1000;
            let t = (performance.now() % duration) / duration;

            let radius = size / 2 * 0.3;
            let outerRadius = size / 2 * 0.7 * t + radius;
            let context = this.context;

            // draw outer circle
            context.clearRect(0, 0, width, height);
            context.beginPath();
            context.arc(width / 2, height / 2, outerRadius, 0, Math.PI * 2);
            context.fillStyle = 'rgba(0, 2, 255,' + (1 - t) + ')';
            context.fill();

            // draw inner circle
            context.beginPath();
            context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            context.fillStyle = 'rgb(0,2,255)';
            context.strokeStyle = 'white';
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();

            // update this image's data with data from the canvas
            this.data = context.getImageData(0, 0, width, height).data;

            // keep the map repainting
            map.triggerRepaint();

            // return `true` to let the map know that the image was updated
            return true;
        }
    };
}