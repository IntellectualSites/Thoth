import * as path from "path";
import {GetPasteEndpoint, GetPasteEndpointHead} from "./endpoints/get-paste.endpoint.ts";
import {CreatePasteEndpoint} from "./endpoints/create-paste.endpoint.ts";
import {setupDatabase} from "./paste/storage.ts";
import * as fs from "fs";
import {GetPasteMetadataEndpoint} from "./endpoints/get-paste-metadata.endpoint.ts";
import {
    GetPasteFileContentEndpoint,
    GetPasteFileListEndpoint
} from "./endpoints/get-paste-files.endpoint.ts";
import {newRouter} from "./router";

const PUBLIC_DIR = "public"
const PUBLIC_INDEX = Bun.file(path.join(PUBLIC_DIR, "index.html"));

const STORAGE_LOCATION = process.env.PASTE_STORAGE || "data"

// As checking if the frontend file exists on every request is hella slow, we just retrieve all existing files on startup to be used for later check
const EXISTING_FRONTEND_FILES = (() => {
    const files: string[] = []
    const getAllFiles = (dir: string) => {
        for (let file of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, file)
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath)
                continue
            }
            files.push(fullPath)
        }
    }
    const root = path.join(".", "public")
    if (!fs.existsSync(root)) {
        return []
    }
    getAllFiles(root)
    return files.map(value => value.substring("public/".length))
})();

fs.mkdirSync(STORAGE_LOCATION, {
    recursive: true
});

(async () => {
    if (EXISTING_FRONTEND_FILES.length === 0) {
        console.warn(`No compiled frontend files found - Can be ignored in dev or standalone environment`)
    }

    await setupDatabase()

    Bun.serve({
        port: 1234,
        ...newRouter({
            HEAD: [
                {path: "api/paste/:id", handler: GetPasteEndpointHead},
            ],
            GET: [
                {path: "api/paste/:id", handler: GetPasteEndpoint},
                {path: "api/paste/:id/metadata", handler: GetPasteMetadataEndpoint},
                {path: "api/paste/:id/file", handler: GetPasteFileListEndpoint},
                {path: "api/paste/:id/file/:file", handler: GetPasteFileContentEndpoint},
            ],
            POST: [
                {path: "api/paste", handler: CreatePasteEndpoint}
            ],
            PUT: [],
            DELETE: [],
            OPTIONS: []
        }, async (url: URL) => {
            const trimmedPath = url.pathname.substring(1)
            if (EXISTING_FRONTEND_FILES.includes(trimmedPath)) {
                return new Response(Bun.file(
                    path.join(PUBLIC_DIR, trimmedPath)
                ))
            }
            return new Response(PUBLIC_INDEX)
        })
    })
})();

export {
    STORAGE_LOCATION
}