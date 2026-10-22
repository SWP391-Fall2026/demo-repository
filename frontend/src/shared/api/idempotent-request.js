import { ApiError, json, request } from "./http-client";
// Keep the logical submission key when a response is lost, so retrying cannot
// create another payment or refund reservation after the server has committed.
const pendingKeys = new Map();
export async function idempotentRequest(path, body) {
    const fingerprint = path + JSON.stringify(body);
    const key = pendingKeys.get(fingerprint) ?? crypto.randomUUID();
    pendingKeys.set(fingerprint, key);
    const options = json("POST", body);
    options.headers = { "Idempotency-Key": key };
    try {
        const result = await request(path, options);
        pendingKeys.delete(fingerprint);
        return result;
    }
    catch (error) {
        if (error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500) {
            pendingKeys.delete(fingerprint);
        }
        throw error;
    }
}
