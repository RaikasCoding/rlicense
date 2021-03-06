const crypto = require('crypto');
const Enmap = require("enmap");
const database = new Enmap({name: "database"});

let cryptKey;
module.exports = function(key) {
  cryptKey = key;
  if(!key || key === "") {
    console.log("Secret key is empty")
    process.exit()
  }
  console.log("rLicense is ready to run.")
  return module;
}
module.createToken = function (product) {
  if(!product) product = "default";
  let id = makeid(15)

  let key = crypto.createCipher('aes-128-cbc', cryptKey);
  let crypted = key.update(id, 'utf8', 'hex')
  crypted += key.final('hex');

  database.set(crypted,{token:id,product:req.params.product})
  return {token:id,product:req.params.product};
}

module.validate = function (token, product) {
  if(!token) return false;
  if(!product) product = "default";
  let key = crypto.createCipher('aes-128-cbc', cryptKey);
    let crypted = key.update(token, 'utf8', 'hex')
    crypted += key.final('hex');
    if(database.has(crypted)) {
      if(database.get(crypted,"product").toLowerCase() !== product.toLowerCase()) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
}

module.revoke = function (token) {
  if(!token) return false;
  let key = crypto.createCipher('aes-128-cbc', cryptKey);
  let crypted = key.update(token, 'utf8', 'hex')
  crypted += key.final('hex');
  if(database.has(crypted)) {
    database.delete(crypted);
    return true;
  } else {
    return false;
  }
}

/*
 * Use the integrated Rest API using Express
 */
module.listen = function(port) {
  const express = require("express");

  const bodyParser = require("body-parser");
  const bearerToken = require("express-bearer-token");
  const app = express();
  app.use(bodyParser.json());
  app.use(bearerToken());
  app.get("/", (request, response) => {
    response.send("<!DOCTYPE html><html><head><title>rLicense " + version + " </title></head><body><h2>rLicense Version " + version+"</h2><br><a href='https://npmjs.com/package/rlicense'><img src='https://nodei.co/npm/rlicense.png'></a></body></html>");
  });

  app.post("/api/validate/", (req, res) => {
    /*
     * {"product":"productname","token":"token"}
     */
    let product = req.body.product;
    let token = req.body.token;
    if (!token || !product) {
      res.status(400).json({error:true});
      return;
    }
    res.json({ valid: module.validate(token, product) });
  });

  app.post("/api/new/", (req, res) => {
    /*
      {"product":"product"}
    */
    if (!req.token || !req.body.product) {
      res.status(400).json({error:true});
      return;
    }
    if (req.token !== cryptKey) {
      res.status(401).json({error:true});
      return;
    }

    res.json(module.createToken(req.body.product));
  });
  app.post("/api/revoke/", (req, res) => {
    /*
    {"token":"tokenhere"}
    */
    if (!req.token || !req.body.token) {
      res.status(400).json({error:true});
      return;
    }
    if (req.token !== cryptKey) {
      res.status(401).json({error:true});
      return;
    }

    res.json({ success: module.revoke(req.body.token) });
  });
  const listener = app.listen(port, () => {
    console.log("rLicense is now listening on port " + listener.address().port);
  });
};


function makeid(length) {
   let result           = '';
   let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   let charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
