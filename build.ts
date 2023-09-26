import * as path from "path";
import * as fs from "fs";

(async () => {
    const frontendBuildProcess = Bun.spawn({
        cwd: path.join(process.cwd(), "thoth-frontend"),
        cmd: ["bunx", "--bun", "vite", "build"],
        stdout: "pipe",
        stderr: "pipe"
    })
    console.log("Building frontend bundle")
    const exitCode = await frontendBuildProcess.exited
    if (exitCode !== 0) {
        console.error(`Frontend-Build failed with exit code ${exitCode}`)
        process.exit(-1)
    }
    console.log("Frontend-Build finished")

    console.log("Building backend")
    const backendBuild = await Bun.build({
        target: "bun",
        entrypoints: [
            './thoth-backend/src/index.ts'
        ],
        outdir: './dist'
    })

    if (!backendBuild.success) {
        console.error("Backend-Build failed: ")
        for (let log of backendBuild.logs) {
            console.log(log.message)
        }
    }
    console.log("Backend-Build finished")

    console.log("Copying frontend bundle to backend dist")
    fs.cpSync(path.join(process.cwd(), "thoth-frontend", "dist"), path.join(process.cwd(), "dist", "public"), {
        recursive: true
    })
})();