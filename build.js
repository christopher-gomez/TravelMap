const { exec } = require('child_process');
const fs = require('fs-extra'); // Using fs-extra for easier directory handling
const path = require('path');

// Define paths
const childDirectory = path.join(__dirname, 'frontend');
const distDirectory = path.join(childDirectory, 'build');
const targetDirectory = path.join(__dirname, 'dist');

// Function to delete dist directory if it exists
function deleteDistDirectory(callback) {
    fs.pathExists(targetDirectory, (err, exists) => {
        if (err) {
            console.error(`Error checking if dist directory exists: ${err}`);
            return callback(err);
        }

        if (exists) {
            fs.remove(targetDirectory, err => {
                if (err) {
                    console.error(`Error removing dist directory: ${err}`);
                    return callback(err);
                }
                console.log('Existing dist directory removed.');
                callback();
            });
        } else {
            callback();
        }
    });
}

// Step 0: Delete existing dist folder in the parent directory if it exists
deleteDistDirectory(() => {
    // Step 1: Run npm build command in child directory
    exec('npm i && npm run build', { cwd: childDirectory }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        // Step 2: Move dist folder to parent directory upon successful build
        fs.move(distDirectory, targetDirectory, { overwrite: true }, (err) => {
            if (err) {
                return console.error(`Error moving dist directory: ${err}`);
            }
            console.log('Successfully moved dist directory to parent.');
        });
    });
});
