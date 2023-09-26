import {existsPaste, getPaste} from "../paste/storage.ts";


// GET /api/paste/:id
export const GetPasteEndpoint = async (request: Request, params: { [key: string]: string }): Promise<Response> => {
    const paste = getPaste(params.id)
    if (!paste) {
        return Response.json({
            error: 'not_found'
        }, {status: 404})
    }

    return Response.json(paste)
}

export const GetPasteEndpointHead = async (request: Request, params: { [key: string]: string }): Promise<Response> => {
    return new Response(null, {
        status: existsPaste(params.id) ? 200 : 404
    })
}