import * as path from "path";
import * as fs from "fs";
import Database, {SQLQueryBindings} from "bun:sqlite";
import {
    CreatePasteData, CustomEnvironmentMetadata,
    CustomMetadataValueType,
    CustomMetadataValueTypeNamed,
    Paste,
    PasteFile, PredefinedEnvironmentMetadata
} from "./index";
import {STORAGE_LOCATION} from "../index.ts";
import {BunFile} from "bun";

type PasteJoinQueryResponseType = {
    id: string,
    createdAt: string;

    applicationIdentifier: string;
    applicationVersion: string;

    osName: string,
    osVersion: string,
    osArchitecture: string,

    javaName?: string,
    javaVendor?: string,
    javaVersion?: string,

    customMetadataName?: string,
    customMetadataType?: CustomMetadataValueTypeNamed,
    customMetadataValue?: Uint8Array

    fileName?: string,
    fileSize?: number,
}

type PasteFilesDatabaseRow = {
    pasteId: string
    fileName: string
    size: number
}
type PasteMetadataDatabaseRow = {
    osName: string
    osVersion: string
    osArchitecture: string

    jvmName?: string
    jvmVersion?: string
    jvmVendor?: string

    cmName?: string
    cmType?: CustomMetadataValueTypeNamed
    cmData?: Uint8Array
}

const ID_CHARSET = "abcdef0123456789".split("")
const ID_LENGTH = 32

const INT_32_BYTES = 4
const INT_8_BYTES = 1

const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

const DATA_CONVERTERS: {
    [K in CustomMetadataValueTypeNamed]: {
        encode: (data: any) => Buffer,
        decode: (data: Buffer) => any
    }
} = {
    "string": {
        encode: (data: string) => Buffer.from(TEXT_ENCODER.encode(data)),
        decode: (data: Buffer) => TEXT_DECODER.decode(data)
    },
    "string[]": {
        encode: (data: string[]) => {
            if (data.length == 0) {
                return Buffer.alloc(0)
            }
            const encodedStrings = data.map(value => TEXT_ENCODER.encode(value))
            const totalStringLengths = encodedStrings.map(uint8 => uint8.length).reduce((a, b) => a + b)
            const buffer = Buffer.alloc((totalStringLengths * INT_8_BYTES) + ((data.length) * INT_32_BYTES))

            let offset = 0
            for (let encodedString of encodedStrings) {
                offset = buffer.writeUint32BE(encodedString.length, offset)
                for (let encodedStringElement of encodedString) {
                    offset = buffer.writeUint8(encodedStringElement, offset)
                }
            }
            return buffer
        },
        decode: (data: Buffer) => {
            const result: string[] = []
            let offset = 0;
            do {
                const length = data.readUInt32BE(offset)
                offset += INT_32_BYTES
                if (data.length - length < offset) {
                    throw new Error(`Expected string length is ${length} - but buffer only has ${data.length - offset} entries left`)
                }
                const stringBuffer = data.subarray(offset, offset + length * INT_8_BYTES)
                result.push(TEXT_DECODER.decode(stringBuffer))
                offset += length * INT_8_BYTES
            } while (data.length > offset)
            return result
        }
    },
    "number": {
        encode: (data: number) => {
            const buffer = Buffer.alloc(INT_32_BYTES)
            buffer.writeInt32BE(data)
            return buffer
        },
        decode: (data: Buffer) => data.readInt32BE()
    },
    "number[]": {
        encode: (data: number[]) => {
            const buffer = Buffer.alloc(INT_32_BYTES * (data.length + 1))
            buffer.writeUint32BE(data.length)

            for (let i = 0; i < data.length; i++) {
                buffer.writeInt32BE(data[i], INT_32_BYTES + (INT_32_BYTES * i))
            }

            return buffer
        },
        decode: (data: Buffer) => Array.from(
            {length: data.readUInt32BE()},
            (_, i) => data.readInt32BE(INT_32_BYTES + (INT_32_BYTES * i))
        )
    },
    "boolean": {
        encode: (data: boolean) => Buffer.from([data ? 1 : 0]),
        decode: (data: Buffer) => data[0] == 1
    }
}

let database: Database

export const setupDatabase = async () => {
    if (!!database) {
        console.error("Don't call setupDatabase more than once!")
        return
    }
    database = new Database(path.join(STORAGE_LOCATION, "data.db"), {create: true})
    database.run("CREATE TABLE IF NOT EXISTS pastes (id VARCHAR(32) NOT NULL, createdAt TIMESTAMP default CURRENT_TIMESTAMP NOT NULL, applicationIdentifier VARCHAR(100) NOT NULL, applicationVersion VARCHAR(25) NOT NULL, PRIMARY KEY(id))")
    database.run("CREATE TABLE IF NOT EXISTS paste_files (pasteId VARCHAR(32) NOT NULL, size INTEGER NOT NULL, fileName VARCHAR(128) NOT NULL, PRIMARY KEY (pasteId, fileName), FOREIGN KEY (pasteId) REFERENCES pastes(id) ON DELETE CASCADE)")
    database.run("CREATE TABLE IF NOT EXISTS paste_environments_operatingsystem (pasteId VARCHAR(32) NOT NULL, name VARCHAR(64) NOT NULL, version VARCHAR(32) NOT NULL, architecture VARCHAR(12) NOT NULL, PRIMARY KEY(pasteId), FOREIGN KEY (pasteId) REFERENCES pastes(id) ON DELETE CASCADE)")
    database.run("CREATE TABLE IF NOT EXISTS paste_environments_jvm (pasteId VARCHAR(32) NOT NULL, name VARCHAR(64) NOT NULL, version VARCHAR(32) NOT NULL, vendor VARCHAR(32) NOT NULL, PRIMARY KEY(pasteId), FOREIGN KEY (pasteId) REFERENCES pastes(id) ON DELETE CASCADE)")
    database.run("CREATE TABLE IF NOT EXISTS paste_environments_custom_metadata (pasteId VARCHAR(32) NOT NULL, name VARCHAR(64) NOT NULL, data BLOB NOT NULL, type VARCHAR(32) CHECK (type in ('string', 'number', 'boolean', 'string[]', 'number[]')), PRIMARY KEY(pasteId, name), FOREIGN KEY (pasteId) REFERENCES pastes(id) ON DELETE CASCADE)")
}

export const existsPaste = (id: string): boolean => {
    const row = database.query<{ count: number }, SQLQueryBindings>("SELECT COUNT(id) as count FROM pastes WHERE id = ?")
        .get(id)
    return !!row && row.count > 0
}

export const getPaste = (id: string): Paste | null => {
    const data: PasteJoinQueryResponseType[] = database.query<PasteJoinQueryResponseType, any>("SELECT pastes.id, pastes.createdAt, pastes.applicationIdentifier, pastes.applicationVersion, pf.fileName, pf.size as fileSize FROM pastes LEFT JOIN main.paste_files pf on pastes.id = pf.pasteId WHERE pastes.id = ?").all(id)
    if (data.length == 0) {
        return null
    }

    return {
        id: data[0].id,
        application: {name: data[0].applicationIdentifier, version: data[0].applicationVersion},
        createdAt: Date.parse(data[0].createdAt),
    }
}

export const getPasteFiles = async (id: string): Promise<PasteFile[]> => {
    const rows = database.query<PasteFilesDatabaseRow, SQLQueryBindings>("SELECT fileName, size FROM paste_files WHERE pasteId = ?")
        .all(id)
    if (rows.length == 0) {
        return []
    }
    return rows.map(row => ({
        filename: row.fileName,
        size: row.size,
        extension: path.extname(row.fileName),
    }) as PasteFile)
}

export const getPasteFile = (pasteId: string, filename: string): BunFile => {
    return Bun.file(path.join(STORAGE_LOCATION, "pastes", pasteId, filename))
}

export const getPasteEnvironment = async (id: string): Promise<PredefinedEnvironmentMetadata & CustomEnvironmentMetadata | null> => {
    const rows = database.query<PasteMetadataDatabaseRow, SQLQueryBindings>("SELECT os.architecture as osArchitecture, os.version as osVersion, os.name as osName, jvm.name as jvmName, jvm.version as jvmVersion, jvm.vendor as jvmVendor, cm.name as cmName, cm.type as cmType, cm.data as cmData FROM paste_environments_operatingsystem as os LEFT JOIN main.paste_environments_jvm jvm on os.pasteId = jvm.pasteId LEFT JOIN main.paste_environments_custom_metadata cm on cm.pasteId = os.pasteId WHERE os.pasteId = ?")
        .all(id)
    if (rows.length == 0) {
        return null
    }

    const predefinedEnvironmentMetadata: PredefinedEnvironmentMetadata = {
        operatingSystem: {
            architecture: rows[0].osArchitecture,
            name: rows[0].osName,
            version: rows[0].osVersion
        },
    };

    if (!!rows[0].jvmName && !!rows[0].jvmVendor && !!rows[0].jvmVersion) {
        predefinedEnvironmentMetadata.javaVirtualMachine = {
            name: rows[0].jvmName,
            version: rows[0].jvmVersion,
            vendor: rows[0].jvmVersion
        }
    }

    const customMetadata = rows
        // if this paste does not contain additional custom metadata, those columns will be empty due to the left join - throw 'em out
        .filter(row => !!row.cmName && !!row.cmType && !!row.cmData && !!DATA_CONVERTERS[row.cmType])
        // now we map each row to a CustomEnvironmentMetadata containing a single key
        .map(row => {
            const converter = DATA_CONVERTERS[row.cmType!];
            return {
                [row.cmName!!]: converter.decode(Buffer.from(row.cmData!!))
            } as CustomEnvironmentMetadata
        })
        // and finally reduce all those CustomEnvironmentMetadata with just one key to one CustomEnvironmentMetadata containing all keys from the previous map
        .reduce((rowLeft, rowRight) => ({...rowLeft, ...rowRight}), {})

    // @ts-ignore - TypeScript and their Union-Types are quite limited
    return {...predefinedEnvironmentMetadata, ...customMetadata}
}

export const createPaste = async (data: CreatePasteData): Promise<string> => {
    const id = getFreePasteId()

    database.transaction(() => {
        database.run(
            "INSERT INTO pastes (id, applicationIdentifier, applicationVersion) VALUES (?, ?, ?)",
            [id, data.application.name, data.application.version]
        )
        database.run(
            "INSERT INTO paste_environments_operatingsystem (pasteId, name, version, architecture) VALUES (?, ?, ?, ?)",
            [id, data.environment.operatingSystem.name, data.environment.operatingSystem.version, data.environment.operatingSystem.architecture]
        )
        if (data.environment.javaVirtualMachine) {
            database.run(
                "INSERT INTO paste_environments_jvm (pasteId, name, version, vendor) VALUES (?, ?, ?, ?)",
                [id, data.environment.javaVirtualMachine.name, data.environment.javaVirtualMachine.version, data.environment.javaVirtualMachine.vendor]
            )
        }
        // if we have any additional keys (= data), apart from jvm and os
        const customMetadataKeys = Object.keys(data.environment).filter(k => k != 'operatingSystem' && k != 'javaVirtualMachine');
        if (customMetadataKeys.length > 0) {
            const statement = database.prepare(
                "INSERT INTO paste_environments_custom_metadata (pasteId, name, data, type) VALUES (?, ?, ?, ?)"
            )
            for (let key of customMetadataKeys) {
                const value = data.environment[key]
                statement.run(id, key, convertTypeScriptDataToBlob(value), metadataValueToNamed(value))
            }
        }

        // And insert all the gorgeous files
        if (data.files && data.files.length > 0) {
            const statement = database.prepare(
                "INSERT INTO paste_files (pasteId, size, fileName) VALUES (?, ?, ?)"
            )
            for (let file of data.files) {
                statement.run(id, file.content.byteLength, file.filename)
            }
        }
    })();

    const pasteFilesFolder = path.join(process.cwd(), STORAGE_LOCATION, 'pastes', id)
    fs.mkdirSync(pasteFilesFolder, {recursive: true})
    for (let file of data.files) {
        await Bun.write(path.join(pasteFilesFolder, file.filename), file.content)
    }
    return id;
}

const getFreePasteId = (): string => {
    let id: string;
    do {
        id = Array.from(
            {length: ID_LENGTH},
            () => ID_CHARSET[Math.floor(Math.random() * ID_CHARSET.length)]
        ).join("")
    } while ((database.query("SELECT COUNT(id) as count FROM pastes WHERE id = ?").get(id) as {
        count: number
    } | null)?.count != 0)
    return id;
}

const convertTypeScriptDataToBlob = (data: CustomMetadataValueType): Buffer => {
    const named = metadataValueToNamed(data)
    if (!named) {
        throw new Error(`Unsupported datatype of ${data} (${typeof data})`)
    }
    return DATA_CONVERTERS[named]?.encode(data) ?? (() => {
        throw new Error(`No data converter for ${named}`);
    })()
}

const metadataValueToNamed = (data: CustomMetadataValueType): CustomMetadataValueTypeNamed | null => {
    if (Array.isArray(data)) {
        const rawArray = data as any[]
        if (rawArray.every(entry => typeof entry == "string")) {
            return "string[]"
        }
        if (rawArray.every(entry => typeof entry == "number")) {
            return "number[]"
        }
        return null
    }
    if (typeof data == "boolean") {
        return "boolean"
    }
    if (typeof data == "number") {
        return "number"
    }
    return "string"
}