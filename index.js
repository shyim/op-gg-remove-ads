const fs = require('fs');
const path = require('path');
const asar = require('asar');
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
let opggAsarFile = '';

if (process.platform == 'darwin') {
    opggAsarFile = '/Applications/OP.GG.app/Contents/Resources/app.asar';
} else {
    opggAsarFile = `${path.dirname(process.env.APPDATA)}/Local/Programs/OP.GG/resources/app.asar`;
}


if (!fs.existsSync(opggAsarFile)) {
    console.log(`Cannot find asar file at ${opggAsarFile}`);
    process.exit(1);
}

async function main() {
    console.log('Kill running OP.GG');

    if (process.platform == 'darwin') {
        await spawn("killall", ["-9", "OP.GG"]);
    } else {
        await spawn("taskkill", ["/im", "OP.GG.exe", '/F']);
    }

    console.log("Unpacking OP.GG asar file")
    await asar.extractAll(opggAsarFile, "op-gg-unpacked");

    const assetDir = 'op-gg-unpacked/assets/main';
    const files = await fs.readdirSync(assetDir);

    for (let file of files) {
        if (file.endsWith('.js')) {
            console.log(`Patching ${file}`);

            let content = fs.readFileSync(`${assetDir}/${file}`).toString();

            // Block Google Analytics
            content = content.replaceAll('google-analytics.com/mp/collect', 'gist.githubusercontent.com');

            // Break checking for Google Chrome installed
            content = content.replaceAll('checkIfChromeDirectoryExists("Default")', 'checkIfChromeDirectoryExists("VAZCrHPjFt73ZQ4cYuBeVAZCrHPjFt73ZQ4cYuBe")')
            content = content.replaceAll('AppData\\Local\\Google\\Chrome\\User Data', 'AppData\\Local\\Noogle\\Chrome\\User Data')

            // Disable Tracking of IP
            content = content.replaceAll('https://desktop.op.gg/api/tracking/ow', 'https://gist.githubusercontent.com');
            content = content.replaceAll('https://geo-internal.op.gg/api/current-ip', 'https://gist.githubusercontent.com');

            // Use our proxy for the Frontend to filter out ads
            content = content.replaceAll('https://opgg-desktop-data.akamaized.net', 'https://op-gg-remove-ads.shyim.workers.dev');
            content = content.replaceAll('app.labs.sydney', 'op-gg-remove-ads.shyim.workers.dev');

            await fs.writeFileSync(`${assetDir}/${file}`, content);
        }
    }

    console.log(`Rebuilding ${opggAsarFile}`);
    await asar.createPackageWithOptions("op-gg-unpacked", opggAsarFile, {
        unpackDir: '{node_modules/node-ovhook,node_modules/rust-process}'
    });

    console.log(`Deleting temp dir`);
    rimraf.sync("op-gg-unpacked")
}

main().then(() => {});
