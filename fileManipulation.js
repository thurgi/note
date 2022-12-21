const fs = require('fs');

async function clearFolder(path) {
	try {
		const pathFiles = await fs.promises.readdir(path);
		//const lstatPromises = pathFiles.map(file => removePath(`${path}\\${file}`));
		const lstatPromises = pathFiles.map(file => {
			console.log(`remove: ${path}\\${file}`);
			return fs.promises.rm(`${path}\\${file}`, { recursive: true, force: true });
		});
		await Promise.all(lstatPromises);
	} catch (e) {
		console.log('error clearFolder', e);
		return;
	}
}

async function copyWsWar(source, destination) {
	try{
		await fs.promises.copyFile(source, destination);
		console.log(`copy ${source} to ${destination} success`);
	} catch (e) {
		console.log(`copy ${source} to ${destination} fail`);
	}
}
