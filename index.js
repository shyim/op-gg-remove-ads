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

    const assetDir = 'op-gg-unpacked/assets/react';
    const files = await fs.readdirSync(assetDir);

    for (let file of files) {
        if (file.endsWith('.js')) {
            console.log(`Patching ${file}`);

            let content = fs.readFileSync(`${assetDir}/${file}`);
            let patchedContent = content.toString().replaceAll("https://dtapp-player.op.gg/adsense.txt", "https://gist.githubusercontent.com/shyim/d3c8e3451d783f537686a4356ec6794f/raw/4c874d1fe305103848bea14736935c24ab52057a/gistfile1.txt");
            patchedContent = patchedContent.replace(/exports\.countryHasAds=\w;/gm, 'exports.countryHasAds=[];');
            patchedContent = patchedContent.replace(/exports\.countryHasAdsAdsense=\w;/gm, 'exports.countryHasAdsAdsense=[];');
            patchedContent = patchedContent.replace('window.api.send("ads","on")', 'window.api.send("ads","off")');
            patchedContent = patchedContent.replace('https://dtapp-player.op.gg/video_ads_only.html', 'chrome://version');
            patchedContent = patchedContent.replace('https://dtapp-player.op.gg/adsense_wv.html', 'chrome://version');
            await fs.writeFileSync(`${assetDir}/${file}`, patchedContent);
        }
        if (file.endsWith('.css')) {
            console.log(`Patching ${file}`);
            let content = fs.readFileSync(`${assetDir}/${file}`);

            content += ' .side-ads { display: none; } ' + "\n" + '.side-ads-content { display: none; }';

            await fs.writeFileSync(`${assetDir}/${file}`, content);
        }
    }

    console.log(`Rebuilding ${opggAsarFile}`);
    await asar.createPackage("op-gg-unpacked", opggAsarFile);

    console.log(`Deleting temp dir`);
    rimraf.sync("op-gg-unpacked")
}

main().then(() => {});
