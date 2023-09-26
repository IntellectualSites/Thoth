import zod from "zod"

const UINT32_MAX = 4_294_967_295
const INT32_MAX = 2_147_483_647
const INT32_MIN = -2_147_483_648

const MAX_ARRAY_LENGTH = 2096

export const CreatePasteSchema = zod.object({
    application: zod.object({
        name: zod.string().trim(),
        version: zod.string().trim()
    }).required(),
    environment: zod.object({
        operatingSystem: zod.object({
            name: zod.string().trim(),
            version: zod.string().trim(),
            architecture: zod.string().trim()
        }).required(),
        javaVirtualMachine: zod.object({
            name: zod.string().trim(),
            version: zod.string().trim(),
            vendor: zod.string().trim()
        }).optional(),
    }).catchall(zod.union([
        zod.boolean(), zod.number().min(INT32_MIN).max(INT32_MAX), zod.string().max(UINT32_MAX / 8),
        zod.array(zod.number().min(INT32_MIN).max(INT32_MAX)).max(MAX_ARRAY_LENGTH),
        zod.array(zod.string().max(UINT32_MAX)).max(MAX_ARRAY_LENGTH)
    ]))
})