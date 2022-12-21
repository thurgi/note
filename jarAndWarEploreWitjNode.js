const util = require('node:util');
const fs = require('fs');
const exec = util.promisify(require('node:child_process').exec);
const execAsync = require('node:child_process').exec;

const myArgs = process.argv;
console.log('myArgs: ', myArgs);
const libsPath = 'C:\\tmp\\tests';
// const libsPath = 'C:\\Users\\tbelutaud-ext\\Documents\\projects\\dropTruc\\lib20221107';
const className = 'XmlMapper';


console.log(`find ${className}`);

async function clearFolder(path) {
    try {
        const pathFiles = await fs.promises.readdir(path);
        const lstatPromises = pathFiles.map(file => {
            return fs.promises.rm(`${path}\\${file}`, { recursive: true, force: true });
        });
        await Promise.all(lstatPromises);
    } catch (e) {
        console.log('error clearFolder', e);
        return;
    }
}

async function findJar(path) {
    try {
        const pathFiles = await fs.promises.readdir(path);
        return pathFiles.filter(value => value.match(/(\.jar)/g))
    } catch (e) {
        console.log('error findJar', e);
        return;
    }
}

async function findWar(path) {
    try {
        const pathFiles = await fs.promises.readdir(path);
        return pathFiles.filter(value => value.match(/(\.war)/g))
    } catch (e) {
        console.log('error findJar', e);
        return;
    }
}

/**
 *
 * @param jarPath {string}
 * @returns {Promise<string[]>}
 */
function listContentOfJar(jarPath){
    return new Promise((resolve, reject) => {
        const command = `jar tf ${jarPath}`;
        childProcess = execAsync(command);

        exec(command, function (err, stdout, stderr) {
            if (err) {
                console.log(`command ${command} fail`, err);
                reject()
            } else {
                resolve(stdout.split(/\r?\n/))
            }
        })
    });
}

/**
 *
 * @param source
 * @param destination
 * @returns {Promise<{destination, source, logs: string[]}>}
 */
async function extractWar(source, destination) {
    try {
        await new Promise((resolve, reject) => {
            fs.exists(destination, exists =>
                exists ? clearFolder(destination).then(resolve) : fs.mkdir(destination, resolve))
        })
    } catch (e) {
        console.log('error clean decompress forlder for war', e)
    }

    const command = `cd ${destination} && jar -xvf ${source}`;
    console.debug(`exec command ${command}`);
    let logs = [];
    try {
        const { stdout, stderr } = await exec(command);
        logs = stdout.split(/\r?\n/);
    } catch (e) {
        console.log(`error command: ${command}`);
    }
    return {
        logs,
        destination,
        source
    };
}

/**
 *
 * @param nameClassFind String
 * @param listContent Array<String>
 * @returns {Promise<void>}
 */
function findClass(nameClassFind, listContent){
    const regex = new RegExp(`\/${nameClassFind}.class`)
    return listContent.filter(content => content.match(regex))
}

async function findClassInAllJarInFolder(folderPath, nameClassFind) {
    const result = await findJar(folderPath)
    for(let i=0;i<result.length;i++){
        const jarPath = `${folderPath}\\${result[i]}`
        await listContentOfJar(jarPath).then(result => {
            const classFind = findClass(nameClassFind, result);
            if (classFind.length > 0) {
                console.log(`find class ${nameClassFind} in ${jarPath} : ${classFind.join(',')}`)
            }
        })
    }
}

function findClassInAllWarInFolder(folderPath, nameClassFind){
    findWar(folderPath).then(warsPaths => {
        Promise.all(warsPaths.map(warpath => {
            const source = `${folderPath}\\${warpath}`;
            const destination = source.slice(0,-4);
            return extractWar(source, destination)
        })).then(dataWars => {
            Promise.all(dataWars.map(datawar => {
                const classInWar = findClass(nameClassFind, datawar.logs);
                const warLibPath = `${datawar.destination}\\WEB-INF\\lib`
                return findClassInAllJarInFolder(warLibPath, nameClassFind);
            })).then(()=> {
                dataWars.forEach(d => {
                    fs.promises.rm(d.destination, { recursive: true, force: true })
                });
            })
        })
    })
}

findClassInAllWarInFolder(libsPath, className);
