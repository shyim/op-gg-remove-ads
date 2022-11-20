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

            let content = fs.readFileSync(`${assetDir}/${file}`).toString();
            content = content.replaceAll("https://dtapp-player.op.gg/adsense.txt", "https://gist.githubusercontent.com/shyim/d3c8e3451d783f537686a4356ec6794f/raw/4c874d1fe305103848bea14736935c24ab52057a/gistfile1.txt");

            // Block Google Analytics
            content = content.replaceAll('google-analytics.com/mp/collect', 'gist.githubusercontent.com');

            content = content.replace(/exports\.countryHasAds=\w;/gm, 'exports.countryHasAds=[];');
            content = content.replace(/exports\.countryHasAdsAdsense=\w;/gm, 'exports.countryHasAdsAdsense=[];');
            content = content.replace(/exports\.adsenseAds=\w;/gm, 'exports.adsenseAds=[];');
            content = content.replace(/exports\.playwireAds=\w;/gm, 'exports.playwireAds=[];');
            content = content.replace(/exports\.nitropayAds=\w;/gm, 'exports.nitropayAds=[];');
            
            // US AND EU specific Ads
            content = content.replaceAll('["US","CA"].includes', '[].includes');
            content = content.replaceAll('["AD","AL","AT","AX","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FO","FR","GB","GG","GI","GR","HR","HU","IE","IM","IS","IT","JE","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SJ","SK","SM","UA","VA","XK"].includes', '[].includes');

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
