const finder = require('tiny-glob')
async function testTiny(){
  let res = await finder("/Volumes/Film Output Files-1/A-Accessory/CC-Colorado/*/*CC0415*/SIGN/RECTANGLE/*")
  console.log(res);
}
testTiny()
