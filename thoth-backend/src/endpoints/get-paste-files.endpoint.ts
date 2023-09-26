import {getPasteFile, getPasteFiles} from "../paste/storage.ts";


// GET /api/paste/:id/file
export const GetPasteFileListEndpoint = async (request: Request, params: { [key: string]: string }): Promise<Response> => {
    const files = await getPasteFiles(params.id)
    // I really don't want to send another query just to see if the paste id is valid
    // Therefor just return an empty array, either if the paste has no file or the paste simply does not exist
    return Response.json(files)
}

// GET /api/paste/:id/file/:filename
export const GetPasteFileContentEndpoint = async (request: Request, params: { [key: string]: string }): Promise<Response> => {
    const file = getPasteFile(params.id, params.file);
    if (!(await file.exists())) {
        return new Response(null, {status: 404})
    }
    return new Response(file)
}