function* iterateBits(bytes: Uint8Array, totalBits: number) {
    for (let i = 0; i < totalBits; i++) {
        const byte = bytes[i >> 3];
        yield (byte >> (7 - (i % 8))) & 1;
    }
}

function canvasTo1Bit(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const totalPixels = width * height;
    const output = new Uint8Array(Math.ceil(totalPixels / 8));

    for (let i = 0; i < totalPixels; i++) {
        const p = i * 4;

        const bit = ((data[p] + data[p + 1] + data[p + 2]) / 3) > 127 ? 1 : 0;

        const byteIndex = i >> 3;
        const bitIndex = i % 8;

        output[byteIndex] |= bit << (7 - bitIndex);
    }


    return output;
}

// first bit is value, next 7 bits is number of times to repeat
function rleEncode1Bit(
    bits: Uint8Array,
    totalBits: number
): Uint8Array {
    const result: number[] = [];

    const iter = iterateBits(bits, totalBits);
    const first = iter.next();
    if (first.done) return new Uint8Array();

    let currentValue = first.value;
    let count = 1;

    for (const bit of iter) {
        if (bit === currentValue && count < 127) {
            count++;
        } else {
            result.push((currentValue << 7) | count);
            currentValue = bit;
            count = 1;
        }
    }

    result.push((currentValue << 7) | count);

    return new Uint8Array(result);
}

function rleDecode1Bit(
    encoded: Uint8Array,
    totalBits: number
): Uint8Array {
    const output = new Uint8Array(Math.ceil(totalBits / 8));

    let bitPos = 0;

    for (const byte of encoded) {
        const value = (byte >> 7) & 1;
        const count = byte & 0x7F;

        if (bitPos + count > totalBits) {
            throw new Error("RLE overflow");
        }

        for (let i = 0; i < count; i++) {
            if (bitPos >= totalBits) break;

            const byteIndex = bitPos >> 3;
            const bitIndex = bitPos % 8;

            output[byteIndex] |= value << (7 - bitIndex);
            bitPos++;
        }
    }

    return output;
}

function draw1BitToCanvas(
    bits: Uint8Array,
    width: number,
    height: number,
    canvas: HTMLCanvasElement
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        const byte = bits[i >> 3];
        const bit = (byte >> (7 - (i % 8))) & 1;

        const color = bit ? 255 : 0;

        const p = i * 4;
        data[p] = color;
        data[p + 1] = color;
        data[p + 2] = color;
        data[p + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
}

function encodeCanvas(canvas: HTMLCanvasElement): Uint8Array {
    const bits = canvasTo1Bit(canvas);
    const totalBits = canvas.width * canvas.height;
    return rleEncode1Bit(bits, totalBits);
}

function decodeCanvas(
    encoded: Uint8Array,
    width: number,
    height: number,
    canvas: HTMLCanvasElement
) {
    const totalBits = width * height;
    const bits = rleDecode1Bit(encoded, totalBits);
    draw1BitToCanvas(bits, width, height, canvas);
}

function encodeWithHeader(canvas: HTMLCanvasElement): Uint8Array {
    const encoded = encodeCanvas(canvas);

    const header = new Uint16Array([canvas.width, canvas.height]);
    const result = new Uint8Array(header.byteLength + encoded.length);

    result.set(new Uint8Array(header.buffer), 0);
    result.set(encoded, header.byteLength);

    return result;
}



function decodeToDataURL(
    data: Uint8Array,
): string | null {
    const header = new Uint16Array(data.buffer, data.byteOffset, 2);

    const width = header[0];
    const height = header[1];

    const MAX_PIXELS = 1_000_000;

    if (width * height > MAX_PIXELS) {
        throw new Error("Image too large");
    }

    const aspectRatio = width / height;

    if (aspectRatio < 2) {
        throw new Error("Invalid image dimensions");
    }

    const canvas = document.createElement("canvas");

    const encoded = data.slice(4);

    decodeCanvas(encoded, width, height, canvas);

    return canvas.toDataURL("image/png");
}


function uint8ToBase64(bytes: Uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
}

function base64ToUint8(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}


export { decodeToDataURL, encodeWithHeader, uint8ToBase64, base64ToUint8 }