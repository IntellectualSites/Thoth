declare type Paste = {
    id: string
    createdAt: number
    application: {
        name: string
        version: string
    }
}

declare type PredefinedEnvironmentMetadata = {
    operatingSystem: {
        name: string
        version: string
        architecture: string
    },
    javaVirtualMachine?: {
        name: string
        vendor: string
        version: string
    }
}


declare type CustomEnvironmentMetadata = {
    [key: Exclude<string, keyof PredefinedEnvironmentMetadata>]: CustomMetadataValueType
}

declare type PasteFile = {
    filename: string
    size: number
    extension: string
}

declare type CustomMetadataValueType = string | number | boolean | string[] | number[]

export type {
    Paste,
    PasteFile,
    PredefinedEnvironmentMetadata,
    CustomEnvironmentMetadata,
    CustomMetadataValueType
}