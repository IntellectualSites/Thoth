import parseMultipartMessage from "@exact-realty/multipart-parser";
import {CreatePasteSchema} from "../paste/schema.ts";
import {CreatePasteData} from "../paste";
import {createPaste} from "../paste/storage.ts";

const TEXT_DECODER = new TextDecoder("utf-8")

const MULTIPART_RELATED_CONTENT_TYPE = /^multipart\/related;\s*boundary="?([^="]+)"?/
const MAX_BODY_SIZE_BYTES = 1000 * 1000

// List of all allowed content-types for
const DEFAULT_ALLOWED_CONTENT_TYPES = [
    // Potential configuration files
    "application/x-yaml", "application/json", "application/xml", "text/x-java-properties",
    "text/plain", "text/x-log", "text/csv"
]
const ALLOWED_CONTENT_TYPES = Bun.env.ALLOWED_CONTENT_TYPES?.split(",") ?? DEFAULT_ALLOWED_CONTENT_TYPES

export const CreatePasteEndpoint = async (request: Request, params: { [key: string]: string }): Promise<Response> => {
    const contentTypeHeader = request.headers.get("Content-Type")
    if (!contentTypeHeader) {
        return Response.json({
            error: 'missing_content_header',
        }, {status: 400})
    }
    const matcher = contentTypeHeader.match(MULTIPART_RELATED_CONTENT_TYPE)
    if (!matcher || matcher.length < 2) {
        return Response.json({
            error: 'invalid_content_type',
            details: 'this api expects a request using the Content-Type multipart/related including a valid boundary (see RFC2387)'
        }, {status: 400})
    }
    const boundary = matcher[1]
    const body = request.body?.pipeThrough(new TransformStream({
        transform: (chunk, controller) => {
            controller.enqueue(new TextEncoder().encode(
                TEXT_DECODER.decode((chunk as Uint8Array))
                    .replace(/\r(?!n)|(?<!\r)\n/g, '\r\n')
            ))
        }
    }))
    if (!body) {
        return Response.json({
            error: 'missing_request_body',
        }, {status: 400})
    }

    let position = 0
    let readBytes = 0
    let data: CreatePasteData | undefined = undefined
    try {
        const parseResult = parseMultipartMessage(body, boundary)
        for await (const part of parseResult) {
            const contentType = part.headers.get("Content-Type")?.split(";")[0]
            const partBody = part.body;
            if (!partBody) {
                return Response.json({
                    error: 'no_multipart_data',
                    details: `missing body in multipart at index ${position}`
                })
            }
            if (!contentType) {
                return Response.json({
                    error: 'no_content_type',
                    details: `missing Content-Type header in multipart at index ${position}`
                })
            }
            if (!(readBytes += partBody.byteLength) || readBytes > MAX_BODY_SIZE_BYTES) {
                return Response.json({
                    error: 'content_too_large',
                    details: `exceeded body size limit at multipart with index ${position} (${readBytes}B > ${MAX_BODY_SIZE_BYTES}B)`
                })
            }
            if (position == 0) {
                if (contentType == "application/json") {
                    let json
                    try {
                        const decoded = TEXT_DECODER.decode(partBody)
                        json = JSON.parse(decoded)
                    } catch (e) {
                        return Response.json({
                            'error': 'malformed_json'
                        })
                    }
                    const parseResult = CreatePasteSchema.safeParse(json)
                    if (!parseResult.success) {
                        return Response.json({
                            error: 'invalid_request',
                            details: 'some validations failed',
                            errors: parseResult.error.format(),
                            issues: parseResult.error.issues
                        }, {status: 400})
                    }
                    data = Object.assign(parseResult.data, {files: []})
                    position++
                    continue
                }
                return Response.json({
                    error: 'invalid_request',
                    details: 'first multipart entry must be general paste information (Content-Type application/json)'
                }, {status: 400})
            }

            // All attached files
            if (ALLOWED_CONTENT_TYPES.indexOf(contentType) === -1) {
                return Response.json({
                    error: 'invalid_request',
                    details: `unsupported content type ${contentType} for multipart at index ${position} - Supported are: ${ALLOWED_CONTENT_TYPES.join(", ")}`
                }, {status: 400})
            }

            // Content-Disposition: form-data; name="profileImage "; filename="image1.png"
            const contentDisposition = part.headers.get("Content-Disposition")?.split(";").map(s => s.trim())
            if (!contentDisposition) {
                return Response.json({
                    error: 'invalid_request',
                    details: `missing Content-Disposition header for multipart at index ${position}`
                }, {status: 400})
            }
            let filename = contentDisposition
                    .find(entry => entry.startsWith("filename"))?.substring("filename=\"".length) ??
                contentDisposition.find(entry => entry.startsWith("name"))?.substring("name=\"".length)
            if (!filename) {
                return Response.json({
                    error: 'invalid_request',
                    details: `missing 'filename' or 'name' parameter in Content-Disposition header for multipart at index ${position}`
                }, {status: 400})
            }
            filename = filename.substring(0, filename.length - 1)
            if (data?.files.find(file => file.filename == filename)) {
                return Response.json({
                    error: 'invalid_request',
                    details: `duplicate filename in attachments: ${filename}`
                }, {status: 400})
            }

            data?.files.push({
                filename: filename,
                content: partBody
            })
            position++
        }
    } catch
        (e) {
        console.error(e)
        return Response.json({
            error: 'invalid_request',
            details: 'multipart could not be parsed - is it malformed?'
        }, {status: 400})
    }

    try {
        return Response.json({
            id: await createPaste(data!) // data is definitely assigned
        })
    } catch (e) {
        console.error("Failed to insert paste", e)
    }
    return Response.json({
        error: 'server_error'
    }, {status: 500})
}