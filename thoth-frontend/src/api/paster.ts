import {CustomEnvironmentMetadata, Paste, PasteFile, PredefinedEnvironmentMetadata} from "./paste";

const getBackendAddress = async (path: string): Promise<URL> =>
    fetch("/config.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to get config.json")
            }
            return response
        })
        .then(value => value.json())
        .then(config => new URL(path, config.backend_address))

export const existsPaste = (id: string): Promise<boolean> => {
    return getBackendAddress(`api/paste/${id}`)
        .then(url => fetch(url, {
            method: 'HEAD'
        }))
        .then(response => response.ok)
}

export const getPaste = (id: string): Promise<Paste | null> => {
    return getBackendAddress(`api/paste/${id}`)
        .then(fetch)
        .then(value => {
            if (!value.ok) {
                if (value.status == 404) {
                    return null;
                }
                throw new Error(`Received unexpected status code ${value.status} (${value.statusText})`)
            }
            return value.json()
        }).then(value => !value ? null : value as Paste)
}

export const getPasteFiles = (id: string): Promise<PasteFile[]> => {
    return getBackendAddress(`api/paste/${id}/file`)
        .then(fetch)
        .then(response => response.json())
        .then(json => json as PasteFile[])
}

export const getPasteMetadata = (id: string): Promise<PredefinedEnvironmentMetadata & CustomEnvironmentMetadata> => {
    return getBackendAddress(`api/paste/${id}/metadata`)
        .then(fetch)
        .then(response => response.json())
        .then(json => json as (PredefinedEnvironmentMetadata & CustomEnvironmentMetadata))
}

export const getFile = (id: string, filename: string): Promise<Blob> => {
    return getBackendAddress(`api/paste/${id}/file/${filename}`)
        .then(fetch)
        .then(response => response.blob())
}