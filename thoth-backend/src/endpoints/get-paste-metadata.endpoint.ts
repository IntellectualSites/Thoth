import {getPasteEnvironment} from "../paste/storage.ts";

// /api/paste/:id/metadata
export const GetPasteMetadataEndpoint = async (request: Request, params: {
    [key: string]: string
}): Promise<Response> => {
    const env = await getPasteEnvironment(params.id)
    if (!env) {
        return new Response(null, {status: 404})
    }
    return Response.json(env)
}