const { readdirSync, } = require("node:fs");
const { join, } = require("node:path");
const { exec, } = require("node:child_process");
const { chdir, } = require("node:process");
const dotenv = require("dotenv");

const run = async () => {
    const parseEnvFile = dotenv.config({
        path: join(__dirname, ".env"),
    });

    if (parseEnvFile.error) {
        throw parseEnvFile.error;
    }

    let ignoreProjects = process.env.IGNORE_PROJECTS;
    if (!ignoreProjects) {
        envError("IGNORE_PROJECTS");
    }
    ignoreProjects = ignoreProjects.split(",");

    const projectsPath = process.env.PROJECTS_PATH;
    if (!projectsPath) {
        envError("PROJECTS_PATH");
    }
    const dirContents = readdirSync(projectsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    let shouldIgnoreDirContent = false;

    for (const dirContent of dirContents) {
        for (const ignoreProject of ignoreProjects) {
            if (dirContent === ignoreProject) {
                shouldIgnoreDirContent = true;
            }
        }
        if (shouldIgnoreDirContent) {
            shouldIgnoreDirContent = false;
            continue;
        }
        // go in and remove remote
        chdir(join(projectsPath, dirContent));
        try {
            await new Promise((resolve, reject) => {
                exec(
                "git remote remove bb", 
                (err, stdout, stderr) => {
                    if (err) return reject(err)
                    resolve()
                },
                )
            });
        } catch (err) {}
    }
};

const envError = name => {
    throw new Error(`${name} environment variable is not defined.`);
};

run();