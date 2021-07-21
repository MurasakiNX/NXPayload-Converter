const { createHash } = require('crypto');
const { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } = require('fs');
const fetch = require('node-fetch');

const LINKS_FILE = `${process.cwd()}/links.txt`;
const GENERATED_FOLDER = `${process.cwd()}/generated`;

const colors = {
    'default': (text) => { return `\x1b[38;2;44;52;121m${text}\x1b[39m` },
    'success': (text) => { return `\x1b[38;2;7;106;0m${text}\x1b[39m` },
    'warning': (text) => { return `\x1b[38;2;255;116;0m${text}\x1b[39m` },
    'error'  : (text) => { return `\x1b[38;2;118;1;1m${text}\x1b[39m` }
};

const createBootDat = async (payload) => {
    const header = Buffer.allocUnsafe(0xE0);
    header.write('\x43\x54\x43\x61\x65\x72\x20\x42\x4F\x4F\x54\x00', 0);
    header.write('\x56\x32\x2E\x35', 0xC);
    header.set(createHash('sha256').update(payload).digest(), 0x10);
    header.writeUInt32LE(0x40010000, 0x30);
    header.writeUInt32LE(payload.length, 0x34);
    header.writeUInt32LE(0, 0x38);
    header.set(Buffer.alloc(0xA4), 0x3C);
    
    const boot = Buffer.allocUnsafe(0x100 + payload.length);
    boot.set(header, 0);
    boot.set(createHash('sha256').update(header).digest(), 0xE0);
    boot.set(payload, 0x100);
    return boot;
};

(async () => {
    console.clear();
    console.log(colors.default(`     
_   _ __   ________           _                 _   _____                           _            
| \\ | |\\ \\ / /| ___ \\         | |               | | /  __ \\                         | |           
|  \\| | \\ V / | |_/ /_ _ _   _| | ___   __ _  __| | | /  \\/ ___  _ ____   _____ _ __| |_ ___ _ __ 
| . \` | /   \\ |  __/ _\` | | | | |/ _ \\ / _\` |/ _\` | | |    / _ \\| '_ \\ \\ / / _ \\ '__| __/ _ \\ '__|
| |\\  |/ /^\\ \\| | | (_| | |_| | | (_) | (_| | (_| | | \\__/\\ (_) | | | \\ V /  __/ |  | ||  __/ |   
\\_| \\_/\\/   \\/\\_|  \\__,_|\\__, |_|\\___/ \\__,_|\\__,_|  \\____/\\___/|_| |_|\\_/ \\___|_|   \\__\\___|_|   
                       __/ |                                                                   
                      |___/                                     v1.3.1 By MurasakiNX & Zoria                                                          
    `));

    if (!existsSync(GENERATED_FOLDER))
        mkdirSync(GENERATED_FOLDER);
    else if (!statSync(GENERATED_FOLDER).isDirectory()) {
        unlinkSync(GENERATED_FOLDER);
        mkdirSync(GENERATED_FOLDER);
    };

    const links = Array.from(new Set([...readdirSync(process.cwd()).filter(f => f.endsWith('.bin') && statSync(f).isFile()), ...existsSync(LINKS_FILE) && statSync(LINKS_FILE).isFile() ? readFileSync('links.txt', 'utf8').trim().split(',') : []])).filter(link => link.length);

    for (let link of links) {
        const index = links.indexOf(link) + 1;
        if (link.endsWith('.bin') && existsSync(`${process.cwd()}/${link}`) && statSync(`${process.cwd()}/${link}`).isFile()) {
            const fileSize = statSync(link).size;
            if (fileSize == 0 || fileSize > 256000)
                console.log(colors.error(`[FILE ERROR] - ${link}'s size must be between 0B and 256kB.\n`));
            else {
                console.log(colors.default(`[${index}/${links.length}] - Generating boot.dat file from ${link}...`));
                if (!existsSync(`${GENERATED_FOLDER}/file_${link}`)) 
                    mkdirSync(`${GENERATED_FOLDER}/file_${link}`);
                writeFileSync(`${GENERATED_FOLDER}/file_${link}/boot.dat`, await createBootDat(readFileSync(link)));
                console.log(colors.success(`[BOOT.DAT FILE] - ${link} has just been generated !\n`));
            };
        } else {
            const [githubFile, version = 'latest'] = link.trim().toLowerCase().split('@');
            let isCorrectLink = false;
            try {
                link = new URL(link).href;
                isCorrectLink = true;
            } catch (e) {
                link = `https://github.com/MurasakiNX/NXPayload-Converter/blob/main/binaries/${githubFile}/${githubFile}@${version}.bin?raw=true`;
            };

            const file = await fetch(link);
            if (!file.ok)
                console.log(colors.warning(`[ONLINE ERROR] - ${link} is not a good link.\n`));
            else {
                const fileName = isCorrectLink ? file.headers.get('content-disposition')?.split('filename=')[1].split(';')[0] || link.split('/').pop() : `${githubFile}@${version}.bin`;
                if (!fileName.endsWith('.bin') || file.headers.get('content-length') == 0 || file.headers.get('content-length') > 256000) 
                    console.log(colors.error(`[FILE ERROR] - ${fileName}'s size must be between 0B and 256kB and the file type must be .bin.\n`));
                else {
                    console.log(colors.default(`[${index}/${links.length}] - Generating boot.dat file from ${fileName}...`));
                    if (!existsSync(`${GENERATED_FOLDER}/online_${fileName}`)) 
                        mkdirSync(`${GENERATED_FOLDER}/online_${fileName}`);
                    writeFileSync(`${GENERATED_FOLDER}/online_${fileName}/boot.dat`, await createBootDat(await file.buffer()));
                    console.log(colors.success(`[BOOT.DAT ONLINE] - ${fileName} has just been generated !\n`));
                };
            };
        };
    };

    console.log(colors.success('[SUCCESS] - The boot.dat files have just been correctly generated !'), colors.warning('\n[EXIT] - Press any key to exit.'));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
})().catch(({stack}) => console.log(colors.error(`An error has occured: ${stack}`)));