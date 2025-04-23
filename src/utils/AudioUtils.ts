import {spawn} from "node:child_process";

export async function getAudioMetadata(filePath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-show_format',
            '-show_streams',
            '-print_format',
            'json',
            filePath,
        ]);

        let stdoutData = '';
        let stderrData = '';

        ffprobe.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        ffprobe.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        ffprobe.on('close', (code) => {
            if (code === 0) {
                try {
                    const metadata = JSON.parse(stdoutData);
                    resolve(metadata);
                } catch (error) {
                    reject(new Error(`Failed to parse ffprobe output: ${error.message}\nRaw output: ${stdoutData}`));
                }
            } else {
                reject(new Error(`ffprobe process exited with code ${code}: ${stderrData}`));
            }
        });

        ffprobe.on('error', (err) => {
            reject(new Error(`Failed to start ffprobe process: ${err.message}`));
        });
    });
}