// URL-safe base64 (no padding) so the encoded blueprint is hash-safe.
function base64UrlEncode(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
    let padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    if (pad) padded += "=".repeat(4 - pad);
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

function textToBytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function bytesToText(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array | null> {
    const Compressor = (window as any).CompressionStream;
    if (!Compressor) return null;
    const stream = new Blob([bytes]).stream().pipeThrough(new Compressor("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
    const Decompressor = (window as any).DecompressionStream;
    if (!Decompressor) return null;
    const stream = new Blob([bytes]).stream().pipeThrough(new Decompressor("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

// Encoded payload shape:
//   "c." + base64url(deflated bytes)  -- compressed, preferred
//   "p." + base64url(raw utf8 bytes)  -- plain, fallback when CompressionStream unavailable
export async function encodeBlueprintToHash(text: string): Promise<string> {
    const raw = textToBytes(text);
    const compressed = await deflate(raw);
    if (compressed && compressed.length < raw.length) {
        return "c." + base64UrlEncode(compressed);
    }
    return "p." + base64UrlEncode(raw);
}

// Synchronous decoding for the plain-text prefix so initial page load
// can populate the scene without async bootstrapping.
export function decodeBlueprintFromHash(encoded: string): string | null {
    if (!encoded) return null;
    try {
        if (encoded.startsWith("p.")) {
            return bytesToText(base64UrlDecode(encoded.substring(2)));
        }
        if (encoded.startsWith("c.")) {
            // Compressed payloads are decoded lazily via decodeBlueprintFromHashAsync.
            return null;
        }
        // Legacy / no-prefix: try plain base64 first.
        return bytesToText(base64UrlDecode(encoded));
    } catch (e) {
        return null;
    }
}

export async function decodeBlueprintFromHashAsync(encoded: string): Promise<string | null> {
    if (!encoded) return null;
    try {
        if (encoded.startsWith("p.")) {
            return bytesToText(base64UrlDecode(encoded.substring(2)));
        }
        if (encoded.startsWith("c.")) {
            const inflated = await inflate(base64UrlDecode(encoded.substring(2)));
            if (!inflated) return null;
            return bytesToText(inflated);
        }
        return bytesToText(base64UrlDecode(encoded));
    } catch (e) {
        return null;
    }
}
