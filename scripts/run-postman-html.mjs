import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const COLLECTION_PATH = path.join(
    rootDir,
    "postman",
    "storage_rental_e2e_all_tests.postman_collection.json"
);
const DEFAULT_PRIVATE_ENV_PATH = path.join(
    rootDir,
    "var",
    "postman",
    "supabase.env.json"
);
const REPORT_DIR = path.join(rootDir, "var", "postman-report");
const REPORT_FILE = path.join(REPORT_DIR, "index.html");

function parseArgs(argv) {
    const options = {
        envPath: process.env.POSTMAN_ENV || "",
        port: Number(process.env.POSTMAN_REPORT_PORT || 5500),
        serve: true,
        serveOnly: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--no-serve") {
            options.serve = false;
        } else if (arg === "--serve-only") {
            options.serveOnly = true;
        } else if (arg === "--env" && argv[i + 1]) {
            options.envPath = argv[i + 1];
            i += 1;
        } else if (arg === "--port" && argv[i + 1]) {
            options.port = Number(argv[i + 1]);
            i += 1;
        }
    }

    if (!options.envPath && fs.existsSync(DEFAULT_PRIVATE_ENV_PATH)) {
        options.envPath = DEFAULT_PRIVATE_ENV_PATH;
    }

    return options;
}

function runNewman(envPath) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });

    const args = [
        "--yes",
        "-p",
        "newman",
        "-p",
        "newman-reporter-htmlextra",
        "newman",
        "run",
        COLLECTION_PATH,
        "-r",
        "cli,htmlextra",
        "--reporter-htmlextra-darkTheme",
        "--reporter-htmlextra-title",
        "Storage Rental API - Postman E2E Report",
        "--reporter-htmlextra-browserTitle",
        "Storage Rental API - Postman Report",
        "--reporter-htmlextra-showEnvironmentData",
        "--reporter-htmlextra-export",
        REPORT_FILE,
    ];

    if (envPath) {
        const resolvedEnv = path.isAbsolute(envPath)
            ? envPath
            : path.resolve(rootDir, envPath);
        if (!fs.existsSync(resolvedEnv)) {
            console.error(`Environment file not found: ${resolvedEnv}`);
            process.exit(1);
        }
        console.log(`Using Postman environment: ${resolvedEnv}`);
        args.push("-e", resolvedEnv);
    } else {
        console.log(
            "No private Postman environment file found at var/postman/supabase.env.json; running with collection default variables."
        );
    }

    const result = spawnSync("npx", args, {
        cwd: rootDir,
        stdio: "inherit",
        shell: process.platform === "win32",
    });

    if (result.error) {
        console.error("Failed to launch Newman via npx:", result.error.message);
        process.exit(1);
    }

    return typeof result.status === "number" ? result.status : 1;
}

function serveReport(port, exitCodeAfterStart) {
    if (!fs.existsSync(REPORT_FILE)) {
        console.error(`HTML report was not generated at ${REPORT_FILE}`);
        process.exit(exitCodeAfterStart || 1);
    }

    const server = http.createServer((req, res) => {
        if (req.url && req.url !== "/" && req.url !== "/index.html") {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
            return;
        }
        const html = fs.readFileSync(REPORT_FILE, "utf8");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
    });

    server.listen(port, "127.0.0.1", () => {
        console.log(
            `\nPostman Dark HTML Report is live at: http://localhost:${port}/ (and http://127.0.0.1:${port}/)`
        );
        console.log(`Newman exit code: ${exitCodeAfterStart}`);
        console.log("Press Ctrl+C to stop the report server.");
    });
}

const options = parseArgs(process.argv.slice(2));
const exitCode = options.serveOnly ? 0 : runNewman(options.envPath);

if (options.serve) {
    serveReport(options.port, exitCode);
} else {
    process.exit(exitCode);
}

