// IMPORTS
const fsPromises = require('fs/promises')
const fs = require('fs')
const path = require('path')
const finder = require('tiny-glob')
const axios = require('axios')

// ENDPOINTS
const orderEndpoint = 'http://www.design-ink.com/so/json/soitems.php'
// NOTE: examplePath --> "/Volumes/Film Output Files-1/A-Accessory/BG-Bubba Gump/Japan versions/S-BG0012J Bubba Gump Winged Name/S-BG0012 TOKYO.pdf"
let destination;

// Arguments from BASH
const so = process.argv[4]
const sd = process.argv[2]
const processType = process.argv[3] || null

// TERM MAPPING
const regionCodeMap = { AK: "Alaska", AP: "Antelope Point", BG: "Bubba Gump", BM: "Beach Mart", C: "Custom", CAL: "California", CC: "Colorado", CF: "Cedar Fair", CON: "Concept 360", CSB: "Shirt Off My Back", DC: "Destination Custom", GF: "General Font", GI: "Gonzo Inn", H: "Hobbies", HC: "Hawaii Custom", LAN: "Landrys", LG: "Lagoon", LK: "Lake", LP: "Lake Powell", M: "Mountain", MAC: "Macs Merc", ME: "Mountain East", MW: "Midwest", N: "Nautical", P: "Patriotic", R: "Rafting", SAM: "Shelby", SB: "Snowbird", SBSN: "Snowbasin", SDC: "Silver Dollar City", SF: "Six Flags", SMB: "Smokey bear", SP: "Space", SPW: "Sportsman's Warehouse", SU: "Ski Utah", SW: "Southwest", T: "Tropical", UT: "Utah", VC: "Vail Corp", W: "Winter", WS: "Western", WY: "Wyoming", Z: "Zoo" }
const typeCodeMap = { PSTKR: 'STICKER', MPSTKR: 'STICKER', STKR: 'STICKER', MAG: 'STICKER', HPMAG: 'STICKER', HOMEC: 'COASTER', CARC: 'COASTER', MMAG: 'STICKER', SOCK: 'SOCK' }
const typeVersionMap = { PSTKR: 'REG', MPSTKR: 'MINI', MAG: 'MAG', HPMAG: 'MAG', MMAG: 'MAG/_MINI' }
const scheduleType = { PSTKR: 'STICKER', MPSTKR: 'STICKER', MAG: 'STICKER', MMAG: 'STICKER', HPMAG: 'HPMAG', HOMEC: 'COASTER', CARC: 'COASTER', SOCK: 'SOCK', SHIRT: 'SHIRT' }

// COUNTERS
let failCount = 0
let successCount = 0
let totalCount = 0

// FUNCTIONS
async function processOrder(orderNumber,schedule){
  let orderInfo = await getOrderInfo(orderNumber)
  if(processType === 'SOCK'){
    destination = `/Users/mccardell/Desktop/_SOCKS/${orderInfo.so} ${orderInfo.customer.replace(/\//g,' ')}/`
  }else {
    destination = `/Users/mccardell/Desktop/test/_${processType}/${orderInfo.so} ${orderInfo.customer.replace(/\//g,' ')}/`
  }
  await fsPromises.mkdir(destination).catch(function(err){if(err && err.errno !== -17)console.error(err)})
  let errorLogger = await fs.createWriteStream(`${destination}fail.txt`,{flags:'a'})
  await errorLogger.write(`${orderInfo.so} ${orderInfo.customer}\r -----------------------\n`)
  let scheduledWOs = orderInfo.wos.filter(wo => {
    // Check if it is scheduled
    try{
      let dateString = wo.items[0].designs[0].schedule[0];
      let scheduleDate = new Date(schedule).toUTCString()
      // console.log(scheduleDate);
      let woScheduleDate = new Date(dateString).toUTCString()
      // console.log(woScheduleDate);
      if(scheduleDate === woScheduleDate ){
        return true
      }else{
        return false
      }
    }catch{
      return false
    }

  })
  let promisedGits = []
  // console.log(scheduledWOs);
  if(scheduledWOs.length > 0){
    scheduledWOs.forEach(wo => {
      // console.log('WORK ORDER : ',wo);
      wo.items.forEach( item => {
        if(processType === getScheduleType(item.itemno) || processType === null){
          totalCount ++
          gitfile = getFile(item.designs[0],item.itemno,item.itemname)
          .then(function(res){
            console.log("\x1b[32m%s\x1b[0m",`${item.designs[0].no} | ${item.designs[0].namedrop} -- File Found`);
            successCount ++
          })
          .catch(function(err){
            let info = `
            ${item.itemno}\r
            ${item.designs[0].no}\r
            ${deconstructNameDrop(item.designs[0].namedrop).join(' ')}\r
            \n
            `
            console.log("\x1b[31m%s\x1b[0m",err);
            errorLogger.write(info,function(){})
            failCount ++
          })
          promisedGits.push(gitfile)
        }
      })
    })
  }else{
    console.log('No Work Orders Scheduled!');
  }
  Promise.allSettled(promisedGits).then(()=>{
    let counts = `
      SUCCESS COUNT: ${successCount},
      FAIL COUNT: ${failCount},
      TOTAL PROCESSED: ${totalCount}
    `
    console.log(counts);
    errorLogger.write(counts,function(){})
  })
}
async function processWorkOrder(){

}
async function getOrderInfo(orderNumber){
  let response = await axios.get(orderEndpoint+`?id=${orderNumber}`).then(json => json.data)
  // console.log(response.wos[0].items[0].designs[0].schedule[0]);
  return response
}

async function getFile(designInfo,type,itemName){
  let filePaths = await constructFilePath(designInfo.no,designInfo.namedrop,type,itemName).catch(err => {throw err})
  // console.log({FILES_TO_GET:filePaths});

  if(filePaths.length > 0){

    if(typeCodeMap[type] === 'COASTER'){

      await fsPromises.mkdir(`${destination}_assets/`).catch(function(err){if(err && err.errno !== -17)console.error(err)})
        filePaths.forEach(fp => {
          fs.copyFile(fp, `${destination}_assets/${path.basename(fp).replace('.',` _${type}.`)}`,function(err){if (err) {};})
        })

    }else if(typeCodeMap[type] === 'SOCK'){

      await fsPromises.mkdir(`${destination}_assets/`).catch(function(err){if(err && err.errno !== -17)console.error(err)})
      filePaths.forEach(fp => {
        fs.copyFile(fp, `${destination}_assets/${path.basename(fp)}`,function(err){if (err) {};})
      })

    }else{

      await fsPromises.mkdir(`${destination}_${type}/`).catch(function(err){if(err && err.errno !== -17)console.error(err)})
      filePaths.forEach(fp => {
        fs.copyFile(fp, `${destination}_${type}/${path.basename(fp)}`,function(err){if (err) {};})
      })

    }

  }else{
    throw `${designInfo.no} | ${designInfo.namedrop} -- No Files Found`
  }
}

async function constructFilePath(designName, nameDrop, type, itemName){
  let designInfo = deconstructDesignName(designName)
  let nameDropInfo = deconstructNameDrop(nameDrop)
  // console.log({
  //   DESIGN_INFO: designInfo,
  //   NAME_DROP_ARRAY: nameDropInfo
  // });

  let fileBase = `/Volumes/Film Output Files-1/A-Accessory/${designInfo.region}-${regionCodeMap[designInfo.region]}`;
  let fileGlob;
  if(typeCodeMap[type] === "STICKER"){
    fileGlob = `${fileBase}/*/*${designInfo.design_name}*/${typeCodeMap[type]}/${typeVersionMap[type]}/*.pdf`
  }else if (typeCodeMap[type] === "COASTER") {
    fileGlob = `${fileBase}/*/*${designInfo.design_name}*/${typeCodeMap[type]}/*.{pdf,ai}`
  }else if (processType === "SIGNS") {
    let signInfo = deconstructSignName(itemName)
    let firstGlob = `${fileBase}/*/*${designInfo.design_name}*/SIGN/${signInfo.shape}/`
    let sizeFolderName = await findSizeFolder(signInfo.size, firstGlob).catch(err => {throw err})
    fileGlob = sizeFolderName+'/*.pdf'
  }else if (typeCodeMap[type] === "SOCK") {
    fileGlob = `${fileBase}/*/*${designInfo.design_name}*/${typeCodeMap[type]}*/ND/*.{pdf,eps}`
  }

  let files = await finder(fileGlob).catch(err => {throw `Folder Structure Incorrect`})
  let nd = nameDropInfo.join(' ')

  let file;
  if(typeCodeMap[type] === "SOCK"){
    let frontFile = files.filter(str => str.toUpperCase().includes(nd.toUpperCase()))
    if(frontFile.length < 1) throw "No Sock Front Found"
    let backGlob = `${fileBase}/*/*${designInfo.design_name}*/${typeCodeMap[type]}*/*.{pdf,eps}`
    let backFiles = await finder(backGlob).catch(err => {throw err})
    backFile = backFiles.filter(str => str.toUpperCase().includes('BACK'))
    file = frontFile.concat(backFile)
  }else{
    file = files.filter(str => str.toUpperCase().includes(nd.toUpperCase()))
  }

  // console.log({
  //   NAME_DROP: nd,
  //   ALL_FILES: files,
  //   FILTERED_FILES: file
  // });
  if(nd !== '' || typeCodeMap[type] === "SOCK"){
    return file
  }else if (files.length > 0) {
    return [files[0]]
  }else{
    return files
  }
}

function deconstructNameDrop(nameDrop){
  try{
    let namedrops = nameDrop.replace(/\s?F[0-9]+:\s+/g,'').split('|').map(nd => {
      return nd.replace(/\s+$/,'')
      .replace(/^\s+/,'')
      .replace(/•/g,' ')
      .replace(' &','')
      .replace('&#39','')
      .replace('.','_')
      .replace(/[^0-9a-zA-Z\s_-]/g,'')
    })
    return namedrops
  }catch{
    return []
  }

}

function deconstructDesignName (designName){
  let regResult = /^([A-Za-z]+)-([A-Za-z]+)([0-9]+)/gm.exec(designName)

  try{
    const info = {
      design_name: regResult[0].replace(/[A-Za-z]-/,''),
      type: regResult[1],
      region: regResult[2],
      number: regResult[3]
    }
    return info
  }catch{
    console.error('Design Name is incorrect');
    return []
  }

}

function deconstructSignName(itemName){
  let substrate;
  if(itemName.toUpperCase().includes('FAUX')){
    substrate = 'FAUX'
  }else if (itemName.toUpperCase().includes('ALUMINUM')) {
    substrate = 'ALUM'
  }else{
    substrate = 'WOOD'
  }

  let regResult = /(?:[0-9]+)[\._]?(?:[0-9]+)?\s?[Xx]?\s?[0-9]+[\._]?(?:[0-9]+)?/.exec(itemName)
  let size = regResult[0].replace(/\s/g,'').replace('.','_').toUpperCase()

  let shape;
  switch(true){
    case itemName.toUpperCase().includes('SQUARE'):
    shape = 'SQUARE'; break;
    case itemName.toUpperCase().includes('CIRCLE'):
    shape = 'CIRCLE'; break;
    case itemName.toUpperCase().includes('RECTANGLE')&& size === '3X12':
    shape = 'TRAIL'; break;
    case itemName.toUpperCase().includes('RECTANGLE'):
    shape = 'RECTANGLE';
  }

  let info = {
    substrate: substrate,
    size: size,
    shape: shape
  }
  // console.log('SIGN INFO: ',info);
  return info
}

async function findSizeFolder(size,glob){
  let folders = await finder(glob+'*')
  // console.log(glob+' :',folders);
  let sizeFolder = folders.find(f => f.replace(/\s/g,'').replace('.','_').toUpperCase().includes(size))
  if(sizeFolder){
    return sizeFolder
  }else{
    throw "No "+size+" Folder"
  }
}

function getScheduleType(type){
  let st = scheduleType[type]
  if(!st){
    st = "SIGNS"
  }
  return st
}

//INITIATE
processOrder(so,sd)
