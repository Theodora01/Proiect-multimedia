class ImageEditor{
    #visibleCanvas
    #visibleCanvasContext

    #offscreenCanvas
    #offscreenCanvasContext

    #effect
    #selection =false;

    #isCropping = false;
    #cropRegion = { startX: 0, startY: 0, endX: 0, endY: 0 };

    #isMovingSelection = false;
    #prevMousePosition = { x: 0, y: 0 };

    /**
     * Creates a new ImageEditor
     * @param {HTMLCanvasElement} visibleCanvas 
     */
    constructor(visibleCanvas){
        this.#visibleCanvas = visibleCanvas;
        this.#visibleCanvasContext = visibleCanvas.getContext('2d');
        this.#visibleCanvasContext.imageSmoothingEnabled = false; 

        this.#offscreenCanvas = document.createElement('canvas');
        this.#offscreenCanvasContext = this.#offscreenCanvas.getContext('2d',{ willReadFrequently: true });
        this.#offscreenCanvasContext.imageSmoothingEnabled = false;  
        this.#offscreenCanvasContext.willReadFrequently = true; 

        this.#effect = null;
       // this.#selection = null;

    }

    /**
     * Changes the loaded image
     * @param {HTMLImageElement} image
     */
    changeImage(image){
        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
            this.#offscreenCanvas.width = this.#visibleCanvas.width = image.naturalWidth;
            this.#offscreenCanvas.height = this.#visibleCanvas.height = image.naturalHeight;

            this.#offscreenCanvasContext.drawImage(image, 0, 0);

            this.#effect = 'normal';
            this.#drawImage();
        }else{
            console.error('Dimensiunile imaginii sunt zero sau nedefinite');
        }
    }

    saveImage(){
        const a = document.createElement('a');
        a.href = this.#visibleCanvas.toDataURL();
        a.download = 'download.png';
        a.click();
    }
    
    /**
     * Changes the effect
     * @param {string} effect 
     */
    changeEffect(effect){
        console.log('S-a aplicat efectul:', effect);
        if (this.#effect !== effect) {
            this.#effect = effect;
            this.#drawImage();
        }
    }

    #drawImage(){
        switch(this.#effect){
            case 'normal':
                this.#normal();
                break;
            case 'greyscale':
                this.#greyscale();
                break;
            case 'blue':
                this.#blue();
                break;
            case 'invert':
                this.#invert();
                break;
            case 'sepia':
                this.#sepia();
                break;
            case 'threshold':
                this.#threshold();
                break;
            case 'pixelate':
                this.#pixelate();
                break;
            case 'yellowlines':
                this.#yellowlines();
                break;
            default:
                console.error('Unknown effect:', this.#effect);
        }
    }
    #normal(){
        this.#visibleCanvasContext.drawImage(this.#offscreenCanvas, 0, 0);
    }
    #greyscale(){
            const imageData = this.#offscreenCanvasContext.getImageData(0, 0, this.#offscreenCanvas.width, this.#offscreenCanvas.height);
            const data = imageData.data; // r g b a r g b a
            for(let i = 0; i < data.length; i+=4){
                const avg = Math.round((data[i] + data[i+1] + data[i+2])/3);
                data[i] = data[i+1] = data[i+2] = avg;
            }
            this.#visibleCanvasContext.putImageData(imageData, 0, 0);
    }
    #blue(){
        const imageData = this.#offscreenCanvasContext.getImageData(0, 0, this.#offscreenCanvas.width, this.#offscreenCanvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4){
            data[i] = 0; // red
            data[i+1] = 0; // green
            data[i+2] //blue
        }
        this.#visibleCanvasContext.putImageData(imageData, 0, 0);
    }
    #invert(){
        const imageData = this.#offscreenCanvasContext.getImageData(0, 0, this.#offscreenCanvas.width, this.#offscreenCanvas.height);
        const data = imageData.data;
        for(let i=0; i<data.length; i+=4){
            data[i] = 255 - data[i]; //red
            data[i+1] = 255 - data[i+1]; //green
            data[i+2] = 255 - data[i+2]; //blue
        }
        this.#visibleCanvasContext.putImageData(imageData, 0, 0);
    }
    #sepia(){
        const imageData = this.#offscreenCanvasContext.getImageData(0, 0, this.#offscreenCanvas.width, this.#offscreenCanvas.height);
        const data = imageData.data;
        for(let i=0; i<data.length; i+=4){
            data[i] = (data[i] * .393) + (data[i+1] *.769) + (data[i+2] * .189)
            data[i+1] = (data[i] * .349) + (data[i+1] *.686) + (data[i+2] * .168)
            data[i+2] = (data[i] * .272) + (data[i+1] *.534) + (data[i+2] * .131)
        }
        this.#visibleCanvasContext.putImageData(imageData, 0, 0); 
    }
    #threshold(){
        const level = 66;

        const imageData = this.#offscreenCanvasContext.getImageData(0, 0, this.#offscreenCanvas.width, this.#offscreenCanvas.height);
        const data = imageData.data;
        for(let i=0; i< data.length; i+=4){
            if(0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2] >= level){
                data[i] = data[i+1] = data[i+2] = 255;
            }
            else {
                data[i] = data[i+1] = data[i+2] = 0;
            }
        }
        this.#visibleCanvasContext.putImageData(imageData, 0, 0);
    }
    #pixelate(){
        const blocksize = 10;

        for(let x = 0; x < this.#offscreenCanvas.width; x += blocksize){
            for(let y = 0; y < this.#offscreenCanvas.height; y+=blocksize){
                const imageData = this.#offscreenCanvasContext.getImageData(x, y, blocksize, blocksize);
                const data = imageData.data;
                let totalR = 0, totalG = 0, totalB = 0;
                for (let i = 0; i < data.length; i += 4) {
                    totalR += data[i];
                    totalG += data[i + 1];
                    totalB += data[i + 2];
                }
                const avgR = Math.round(totalR / (data.length / 4));
                const avgG = Math.round(totalG / (data.length / 4));
                const avgB = Math.round(totalB / (data.length / 4));
    
                this.#visibleCanvasContext.fillStyle = `rgb(${avgR},${avgG},${avgB})`;
                this.#visibleCanvasContext.fillRect(x, y, blocksize, blocksize);
            }
        }
    }
    #yellowlines(){
        const imageData = this.#offscreenCanvasContext.getImageData(0,0,this.#offscreenCanvas.width, this.#offscreenCanvas.height);
        const data = imageData.data;

        for(let x = 0; x < this.#offscreenCanvas.width; x += 1){
            for(let y = 0; y < this.#offscreenCanvas.height; y+=2){
                const index = (y * this.#offscreenCanvas.width + x) * 4;
                data[index] = 255; //red
                data[index + 1] = 255; //green
                data[index + 2] = 0; //blue
            }
        }

        this.#visibleCanvasContext.putImageData(imageData, 0, 0);
    }

    //Adaugare text
    addText(text, fontSize, color, x, y) {
        if (this.#visibleCanvasContext) {
            this.#visibleCanvasContext.fillStyle = color;
            this.#visibleCanvasContext.font = `${fontSize}px Arial`;
            this.#visibleCanvasContext.fillText(text, x, y);
        }
    }

    /**
     
     * @param {number} x 
     * @param {number} y 
     */

    startSelection(x, y) {
        this.#selection = { startX: x, startY: y, endX: x, endY: y };
        this.drawSelection();
    }
    /**
     * Metodă pentru a actualiza selecția pe măsură ce mouse-ul este mutat.
     * @param {number} x - Coordonata X a poziției mouse-ului.
     * @param {number} y - Coordonata Y a poziției mouse-ului.
     */

    updateSelection(x, y) {
        if (this.#selection) {
            this.#selection.endX = x;
            this.#selection.endY = y;
            this.drawSelection();
            this.updateColorHistogram(this.#selection);
        }
    }

    /**
         * @param {number} x - Coordonata X a poziției mouse-ului.
         * @param {number} y - Coordonata Y a poziției mouse-ului.
         */

    endSelection(x, y, isForDeletion = false) {
        this.updateSelection(x, y);

        if(isForDeletion){
            const { startX, startY, endX, endY } = this.#selection;
            this.#visibleCanvasContext.clearRect(startX, startY, endX - startX, endY - startY);
            
        }
        this.#selection = null;
        this.drawSelection();
       
    }

    drawSelection() {
        if (this.#selection) {
            this.clearCanvas();
            const startX = this.#selection.startX;
            const startY = this.#selection.startY;
            const width = this.#selection.endX - startX;
            const height = this.#selection.endY - startY;

            this.#visibleCanvasContext.clearRect(0, 0, this.#visibleCanvas.width, this.#visibleCanvas.height);

            this.#drawImage();

            this.#visibleCanvasContext.strokeStyle = 'red';
            this.#visibleCanvasContext.lineWidth = 2;
            this.#visibleCanvasContext.strokeRect(startX, startY, width, height);
        }
    }

    clearCanvas() {
        this.#visibleCanvasContext.clearRect(0, 0, this.#visibleCanvas.width, this.#visibleCanvas.height);
    }
    
    clearSelection() {
       // this.selection = null;
        this.#drawImage();
    }

    //CROP
    /**
         * Starts the interactive cropping process.
         * @param {number} x - Coordonata x a poziției mouse-ului.
         * @param {number} y - Coordonata Y a poziției mouse-ului.
         */
    startCrop(x, y) {
        if (!this.#isCropping) {
            this.#isCropping = true;
            this.#cropRegion = { startX: x, startY: y, endX: x, endY: y };
            this.drawCropRegion();
        }
    }
    /**
     * Updates the crop region as the mouse is moved.
     * @param {number} x - Coordonata x a poziției mouse-ului.
     * @param {number} y - Coordonata Y a poziției mouse-ului.
     */
    updateCrop(x, y) {
        if (this.#isCropping) {
            this.#cropRegion.endX = x;
            this.#cropRegion.endY = y;
            this.drawCropRegion();
        }
    }
    /**
     * Terminarea procesului de crop
     * @param {number} x - coordonata X a pozitiei mouse ului
     * @param {number} y - coordonata Y a pozitiei mouse ului
     */
    endCrop(x, y) {
        if (this.#isCropping) {
            this.updateCrop(x, y);
            this.crop();
    
            //this.applyCurrentEffectToCroppedImage();
            this.#drawImage();

            this.#isCropping = false;
            this.#cropRegion = { startX: 0, startY: 0, endX: 0, endY: 0 };
        }
    }
   
    drawCropRegion() {
        if (this.#isCropping) {
            const startX = this.#cropRegion.startX;
            const startY = this.#cropRegion.startY;
            const width = this.#cropRegion.endX - startX;
            const height = this.#cropRegion.endY - startY;

            this.#visibleCanvasContext.clearRect(0, 0, this.#visibleCanvas.width, this.#visibleCanvas.height);
            this.#drawImage();

            this.#visibleCanvasContext.strokeStyle = 'red';
            this.#visibleCanvasContext.lineWidth = 2;
            this.#visibleCanvasContext.strokeRect(startX, startY, width, height);
        }
    }
    
    crop() {
        if (this.#isCropping) {
            const startX = Math.min(this.#cropRegion.startX, this.#cropRegion.endX);
            const startY = Math.min(this.#cropRegion.startY, this.#cropRegion.endY);
            const width = Math.abs(this.#cropRegion.endX - this.#cropRegion.startX);
            const height = Math.abs(this.#cropRegion.endY - this.#cropRegion.startY);

            if (startX >= 0 && startY >= 0 && width > 0 && height > 0) {
                const imageData = this.#offscreenCanvasContext.getImageData(startX, startY, width, height);
    
                this.#visibleCanvas.width = this.#offscreenCanvas.width = width;
                this.#visibleCanvas.height = this.#offscreenCanvas.height = height;
    
                this.#visibleCanvasContext.putImageData(imageData, 0, 0);
                this.#visibleCanvasContext.drawImage(this.#offscreenCanvas, 0, 0);
            
                this.applyCurrentEffectToCroppedImage(); 
                this.#isCropping = false;
                this.#cropRegion = { startX: 0, startY: 0, endX: 0, endY: 0 };

            } else {
                console.error('Coordonate invalide pentru crop.');
            }
        }
    }
    applyCurrentEffectToCroppedImage() {
        const { startX, startY, endX, endY } = this.#cropRegion;
    
        if (startX >= 0 && startY >= 0 && endX > startX && endY > startY) {
            const croppedImageData = this.#visibleCanvasContext.getImageData(startX, startY, endX - startX, endY - startY);
    
            this.applyEffect(croppedImageData, this.#effect);
    
            this.#visibleCanvasContext.clearRect(0, 0, this.#visibleCanvas.width, this.#visibleCanvas.height);
            this.#drawImage();
            this.#visibleCanvasContext.putImageData(croppedImageData, startX, startY);
        } else {
            console.error('Coordonate invalide pentru crop.');
        }
    }
   
    //Aplicare efect selectie
    applyEffectToSelection(effect) {
        if (this.#selection) {
            const { startX, startY, endX, endY } = this.#selection;
            const selectedImageData = this.#offscreenCanvasContext.getImageData(startX, startY, endX - startX, endY - startY);
    
            this.greyscale(selectedImageData);
            this.#drawImage();
        }
    }
    applyEffect(imageData, effect) {
        switch (effect) {
            case 'normal':
                this.#normal(imageData);
                break;
            case 'greyscale':
                this.#greyscale(imageData);
                break;
            case 'blue':
                this.#blue(imageData);
                break;
            // Add cases for other effects here
            default:
                console.error('Unknown effect:', effect);
        }
    }
    greyscale(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            data[i] = data[i + 1] = data[i + 2] = avg;
        }
    }


    //HISTOGRAMA
    getSelectionImageData(rectangle) {
        if (
            this.#offscreenCanvasContext &&
            rectangle.endX > rectangle.startX &&
            rectangle.endY > rectangle.startY &&
            (rectangle.endX - rectangle.startX) > 0 &&
            (rectangle.endY - rectangle.startY) > 0
        ) {
            return this.#offscreenCanvasContext.getImageData(
                rectangle.startX, rectangle.startY,
                rectangle.endX - rectangle.startX, rectangle.endY - rectangle.startY
            );
        }
        return null;
    }


    updateColorHistogram(rectangle) {
        const selectionImageData = this.getSelectionImageData(rectangle);

        if (selectionImageData) {
            const colorHistogram = this.calculateColorHistogram(selectionImageData);
            this.drawColorHistogram(colorHistogram);
        } else {
            console.error('Date invalide pentru histrograma de culoare.');
        }
    }

    calculateColorHistogram(imageData) {
        if (imageData && imageData.data) {
            const histogram = new Array(256).fill(0);
    
            for (let i = 0; i < imageData.data.length; i += 4) {
                const red = imageData.data[i];
                const green = imageData.data[i + 1];
                const blue = imageData.data[i + 2];
                const lum = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    
                histogram[lum]++;
            }
    
            return histogram;
        } else {
            console.error('Date invalide pentru histrograma de culoare.');
            return null;
        }
    }

    drawColorHistogram(histogram) {

        const colorHistogramCanvas = document.getElementById('colorHistogramCanvas');
        const colorHistogramContext = colorHistogramCanvas.getContext('2d');
        if (colorHistogramContext) {
            const canvasWidth = colorHistogramCanvas.width;
            const canvasHeight = colorHistogramCanvas.height;
            const barWidth = canvasWidth / histogram.length;

            colorHistogramContext.clearRect(0, 0, canvasWidth, canvasHeight);

            for (let i = 0; i < histogram.length; i++) {
                const barHeight = (histogram[i] / canvasHeight) * 100; 
                const intensity = i;
                colorHistogramContext.fillStyle = `hsl(${intensity}, 100%, 50%)`;
                colorHistogramContext.fillRect(i * barWidth, canvasHeight - barHeight, barWidth, barHeight);
            }
        }
    }

    //Scalare
    scaleImage(newWidth, newHeight) {
        const currentWidth = this.#visibleCanvas.width;
        const currentHeight = this.#visibleCanvas.height;

        if (newWidth && !newHeight) {
            newHeight = (newWidth / currentWidth) * currentHeight;
        } else if (!newWidth && newHeight) {
            newWidth = (newHeight / currentHeight) * currentWidth;
        }

        const imageData = this.#visibleCanvasContext.getImageData(0, 0, currentWidth, currentHeight);
        this.#visibleCanvas.width = this.#offscreenCanvas.width = newWidth;
        this.#visibleCanvas.height = this.#offscreenCanvas.height = newHeight;
        this.#offscreenCanvasContext.putImageData(imageData, 0, 0);
        this.#drawImage();
   }


   //MOVE
   /**
     * Move the current selection based on the provided coordinates.
     * @param {number} x 
     * @param {number} y 
     */
    moveSelection(x, y) {
        if (this.#selection) {
            const deltaX = x - this.#selection.endX;
            const deltaY = y - this.#selection.endY;

            this.#selection.startX += deltaX;
            this.#selection.startY += deltaY;
            this.#selection.endX += deltaX;
            this.#selection.endY += deltaY;

            this.drawSelection();
        }
    }

    /**
     * End the movement of the current selection based on the provided coordinates.
     * @param {number} x 
     * @param {number} y 
     */
    moveSelectionEnd(x, y) {
        this.moveSelection(x, y);

        this.updateColorHistogram(this.#selection);
    }
    getSelection() {
        return this.#selection;
    }
    
}
