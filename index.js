const { readdirSync, writeFileSync, readFileSync, existsSync, mkdirSync, statSync } = require('fs');
const { createHash } = require('crypto');
const process = require('process');

async function createBootDat(payload) {
    let header = Buffer.allocUnsafe(0xE0);
    header.write('\x43\x54\x43\x61\x65\x72\x20\x42\x4F\x4F\x54\x00', 0);
    header.write('\x56\x32\x2E\x35', 0xC);
    header.set(createHash('sha256').update(payload).digest(), 0x10);
    header.writeUInt32LE(0x40010000, 0x30);
    header.writeUInt32LE(payload.length, 0x34);
    header.writeUInt32LE(0, 0x38);
    header.set(Buffer.alloc(0xA4), 0x3C);
    let boot = Buffer.allocUnsafe(0x100 + payload.length);
    boot.set(header, 0);
    boot.set(createHash('sha256').update(header).digest(), 0xE0);
    boot.set(payload, 0x100);
    return boot;
}; // Original CTCaer script (https://github.com/CTCaer) converted to JavaScript by Pharuxtan (https://github.com/Pharuxtan)

const colors = {
    'default': (text) => { return `\x1b[38;2;44;52;121m${text}\x1b[39m` },
    'success': (text) => { return `\x1b[38;2;7;106;0m${text}\x1b[39m` },
    'warning': (text) => { return `\x1b[38;2;255;116;0m${text}\x1b[39m` },
    'error'  : (text) => { return `\x1b[38;2;118;1;1m${text}\x1b[39m` }
};

function exit() {
    console.log(colors.default('\n[EXIT] - Press any key to exit'));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
};

(async () => {
    try {
        console.clear();
        console.log(colors.default(`     
  _   _ __   ________           _                 _   _____                           _            
 | \\ | |\\ \\ / /| ___ \\         | |               | | /  __ \\                         | |           
 |  \\| | \\ V / | |_/ /_ _ _   _| | ___   __ _  __| | | /  \\/ ___  _ ____   _____ _ __| |_ ___ _ __ 
 | . \` | /   \\ |  __/ _\` | | | | |/ _ \\ / _\` |/ _\` | | |    / _ \\| '_ \\ \\ / / _ \\ '__| __/ _ \\ '__|
 | |\\  |/ /^\\ \\| | | (_| | |_| | | (_) | (_| | (_| | | \\__/\\ (_) | | | \\ V /  __/ |  | ||  __/ |   
 \\_| \\_/\\/   \\/\\_|  \\__,_|\\__, |_|\\___/ \\__,_|\\__,_|  \\____/\\___/|_| |_|\\_/ \\___|_|   \\__\\___|_|   
                           __/ |                                                                   
                          |___/                                             v1.0.2 By MurasakiNX                                                            
        `));

        const bins = readdirSync('./').filter(f => f.endsWith('.bin'));

        if (bins.length == 0) {
            console.log(colors.warning('[WARNING] - Please make sure that your Nintendo Switch payload files (.bin) are in the same folder as the executable'));
            return exit();
        };

        if (!existsSync('./generated')) {
            mkdirSync('./generated');
            console.log(colors.default('[INFO] - The generated folder has just been created\n'));
        };

        let i = 0;

        for (bin of bins) {
            let fileSize = statSync(bin).size;

            if (fileSize == 0) {
                console.log(colors.error(`[ERROR] - ${bin} is an empty file\n`));
                continue;
            } else if (fileSize > 256000) {
                console.log(colors.error(`[ERROR] - ${bin} is a file larger than 256kB\n`));
                continue;
            };

            console.log(colors.default(`[${++i}/${bins.length}] - Creating boot.dat file from ${bin}`));
            if (!existsSync(`./generated/${bin}`)) mkdirSync(`./generated/${bin}`);
            writeFileSync(`./generated/${bin}/boot.dat`, await createBootDat(readFileSync(bin)));
            console.log(colors.success(`[BOOT.DAT] - ${bin} has just been generated!\n`));
        };

        console.log(colors.success('[SUCCESS] - All Nintendo Switch payload files that did not display an error (.bin) have been converted to boot.dat in the generated folder'));
    } catch (e) {
        console.log(colors.error(`[ERROR] - An error has occured: ${e.stack}`));
    };
    exit();
})();