const { exec } = require('child_process');

// Function to execute shell commands
function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve(stdout);
        });
    });
}

// Main function to run the build and sync process
async function buildAndSync() {
    try {
        // Set the REACT_APP_ENV variable for iOS build and run the build script
        console.log("Starting React build for iOS...");
        await runCommand('npm run build', {
            env: { ...process.env, REACT_APP_ENV: 'ios' },
            cwd: process.cwd() // Set current working directory if needed
        });

        // After successful build, run npx cap sync
        console.log("Running npx cap sync...");
        await runCommand('npx cap sync', {
            cwd: process.cwd() // Adjust if your capacitor config is in a different directory
        });

        console.log("Build and sync completed successfully.");
    } catch (error) {
        console.error("An error occurred during the build and sync process:", error);
    }
}

// Run the main function
buildAndSync();
