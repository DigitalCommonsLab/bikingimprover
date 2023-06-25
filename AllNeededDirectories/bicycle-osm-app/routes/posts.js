require('dotenv').config()
const auth_config = require("../auth_config.js")
const clientId = auth_config.client_id_api
const client_secret = auth_config.client_secret
const domain = auth_config.domain
const audience = auth_config.audience
const grant_type = auth_config.grant_type
const app_url = auth_config.app_url;

const express = require('express');
const verify = require('./verifyPasswordCall');
const { Console } = require('console')

const router = express.Router();
const databaseToUse = "./databases/applicationValid.db"
const gamificationLink = process.env.GAMIFICATION_LINK

//EXAMPLE REST API
router.get('/', (req,res)=>{
    //res.send("we are on psots");
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "SELECT id,type from merged where ST_Distance(GeomFromText('POINT(11.194239 46.052415)',4326),geom,0)< 700.120 UNION ALL SELECT id,type FROM node_merged where ST_Distance(GeomFromText('POINT(11.194239 46.052415)',4326),geom,0)< 2500.120"
    db.spatialite(function(err) {
        db.each(query, function(err, row) {
        console.log(row);
        });
    });
    
    res.send("We're on post")
});

//GET ID AND TYPE OF ALL NODES AND WAYS INSIDE A CERTAIN AREA
router.post('/',(req,res)=>{
    const lat = req.body.latitude;
    const long = req.body.longitude;
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "SELECT id,type from merged where ST_Distance(GeomFromText('POINT(" + long + " " + lat + ")',4326),geom,0)< 700.120"+
                " UNION ALL SELECT id,type FROM node_merged where ST_Distance(GeomFromText('POINT(" + long + " " + lat + ")',4326),geom,0)< 2500.120"
    console.log(query)
    const my_array = []
    db.spatialite(function(err){
        db.each(query, function(err,row){
            element = row;
            my_array.push(element);
        },function(err,rows){
            //console.log(element)
            console.log(my_array);
            db.close();
            //my_json = JSON.stringify(my_array)
            //HERE I SHOULD LOOK WHEThER OR NOT MY NODES AND WAYS HAVE ALREADY AN ANSWER OR NOT
            res.status(200).send(my_array);
        })
    })
})

//GET MISSION FOR THE SINGLE NODE/WAY WITH A CERTAIN ID
//it requires the type of the object (type) and the id of the geometry (geomid)
router.get('/:geomid&:type',(req,res)=>{
    const type = req.params.type;
    const my_id = req.params.geomid;
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "SELECT * FROM 'question_table' WHERE ID IS '" + my_id +"' AND TYPE IS '" + type + "' AND NUMBEROFVALIDATIONS < " + '"1"'+";"; //TODO HERE SHOULD BE 2. JUST USING 1 TO TEST.
    console.log(query)
    const my_array = [];
    db.spatialite(function(err){
        db.each(query, function(err,row){
            //console.log(row)
            element = row;
            my_array.push(element)
        },function(err,rows){
            console.log(my_array);
            db.close();
            res.status(200).send(my_array);
        })
    }) 
})

//GET ALL INFO ABOUT WAY AND NODE WITH A CERTAIN ID AND TYPE, REQUIRES DATA WITH ID AND TYPE OF THE OBJECT (ex: "data":[{"id": 23762376, "type":"way"},{"id": 292315332, "type":"way"},{"id": 303166646,  "type":"way"}],)
router.post('/getAllWithIds', (req,res)=>{
    const data = req.body.data
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    if(data == null){
        res.status(400).send("no ids found")
    }
    my_array = []
    for(var i in data){
        my_array.push(data[i]);
    }
    var query = "SELECT * FROM 'question_table' WHERE ID IS "
    for (var i in my_array){
        query = query + my_array[i].id +" AND TYPE IS '" +my_array[i].type.toUpperCase() + "' OR ID IS "
    }
    query = query.substring(0, query.length-10);
    //console.log(query);
    my_result = []
    db.spatialite(function(err){
        db.each(query, function(err,row){
            element = row;
            my_result.push(element)
        },function(err,rows){
            console.log(my_result);
            db.close();
            res.status(200).send(my_result);
        })
    }) 
})

//GET ALL GEOJSON FILES SPECIFIED IN THE BODY
router.post('/getgeojson',(req,res)=>{
    const fs = require('fs');
    const data = req.body.data
    if(data == null){
        res.status(400).send("no ids found")
    }
    var files = []//{"myjsons":[]};//[];
    for(var i in data){
        if(data[i].type == "node"){
            try{
                file = "./my_files/singleNodesFiles/node" + data[i].id + ".geojson";
                var file_to_add = fs.readFileSync(file,'utf-8')
                JSON.parse(file_to_add)
            }catch(err){
                console.error(err)
                res.status(400).json({message:err});
            }
        }else{
            try{
                file = "./my_files/singleWaysFiles/way" + data[i].id + ".geojson";
                var file_to_add = fs.readFileSync(file,'utf-8')
                JSON.parse(file_to_add)
            }catch(err){
                console.error(err)
                res.status(400).json({message:err});
            } 
        }
        files.push(file_to_add)
        JSON.stringify(files)
    }
    res.json(files)
})

//GET ALL WAYS THAT HAVE ALL ANSWERS COMPLETED
router.get('/way/checkcompleted',(req,res)=>{
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "SELECT ID FROM 'completed_table' WHERE completed IS " + '"yes" AND type IS "way"';
    console.log(query)
    const my_array = [];
    db.spatialite(function(err){
        db.each(query, function(err,row){
            //console.log(row)
            element = row;
            my_array.push(element)
        },function(err,rows){
            console.log(my_array);
            db.close();
            res.status(200).send(my_array);
        })
    }) 
})

//GET ALL NODES THAT HAVE ALL ANSWERS COMPLETED
router.get('/node/checkcompleted',(req,res)=>{
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "SELECT ID FROM 'completed_table' WHERE completed IS " + '"yes" AND type IS "node"';
    console.log(query)
    const my_array = [];
    db.spatialite(function(err){
        db.each(query, function(err,row){
            //console.log(row)
            element = row;
            my_array.push(element)
        },function(err,rows){
            console.log(my_array);
            db.close();
            res.status(200).send(my_array);
        })
    }) 
})

//get all the ways that have the score less than the one specified
//it requires a score in the body (score)
router.get('/higherScore/:score',(req,res)=>{
    var score  = req.params.score;
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    //var query = 'SELECT id FROM "completed_table" WHERE CAST(SCORE as double) < CAST(\'' + score + '\' as double) OR completed IS "yes"'
    var query = 'SELECT id,type FROM "completed_table" WHERE CAST(SCORE as double) < CAST(\'' + score + '\' as double) OR completed IS "yes"'
    var way_array = [];
    var node_array = [];
    var array_to_return = [];
    console.log(query);
    db.spatialite(function(err){
        db.each(query, function(err,row){
            //console.log(row)
            element = row;
            if(element.type=='node'){
                node_array.push(element.id)
            }else{
                way_array.push(element.id)
            }
        },function(err,rows){
            array_to_return.push(way_array);
            array_to_return.push(node_array)
            db.close();
            if(err){
                res.status(400).send(err);
            }else{
                res.status(200).send(array_to_return);
            }
        })
    }) 
})

//GET ALL THE LAYER NAMES OF WAYS
router.get('/way/getAllLayerNames',(req,res)=>{
    const fs = require('fs');
    const contents = fs.readFileSync("./pbfFiles/LayersNames/wayLayers.txt",'utf-8');
    var arr = contents.split(/\r?\n/);
    console.log(arr)
    arr.pop();
    arr = JSON.stringify(arr);
    res.status(200).send(arr);
})

//GET ALL THE LAYER NAMES OF NODES
router.get('/node/getAllLayerNames',(req,res)=>{
    const fs = require('fs');
    const contents = fs.readFileSync("./pbfFiles/LayersNames/nodeLayers.txt",'utf-8');
    var arr = contents.split(/\r?\n/);
    console.log(arr)
    arr.pop()
    arr = JSON.stringify(arr);
    res.status(200).send(arr);
})

//UPDATE TABLE TO KNOW IF NODE/WAY HAVE ALL THEIR ANSWERS COMPLETED
router.post("/allAnswerCompleted",(req,res)=>{
    const id = req.body.id
    var type = req.body.type
    type = type.toLowerCase();
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = 'UPDATE completed_table SET completed = "yes" WHERE ID = "'+id+'" AND TYPE = "'+type+'";'; 
    console.log(query)
    db.spatialite(function(err){
        db.each(query, function(err,row){
            element = row;
        },function(err,rows){
            db.close();
            if(err){
                res.status(400).send(err);
            }else{
                console.log("working...")
                res.status(200).send();
            }
        })
    })
})

//serve solo per resettare tutto durante le prove
router.get("/resetAllCompleted",(req,res)=>{
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = 'UPDATE completed_table SET completed = "no" WHERE ID = "201175000" AND TYPE = "way";'; 
    console.log(query)
    db.spatialite(function(err){
        db.each(query, function(err,row){
            element = row;
        },function(err,rows){
            db.close();
            if(err){
                res.status(400).send(err);
            }else{
                console.log("working...")
                res.status(200).send();
            }
        })
    })
})

router.get('/node/checkIfWorking',(req,res)=>{
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    //var query = "SELECT * FROM 'question_table' WHERE ID IS '" + my_id +"' AND TYPE IS '" + type + "';";
    var query = "SELECT * FROM 'completed_table' WHERE completed IS " + '"no" AND type IS "node"';
    console.log(query)
    const my_array = [];
    db.spatialite(function(err){
        db.each(query, function(err,row){
            element = row;
            my_array.push(element)
        },function(err,rows){
            console.log(my_array);
            db.close();
            res.status(200).send(my_array);
        })
    }) 
})

/*This function is used to gain the token used to access to the auth0 api*/
router.get('/user/getTokenApi',(req,res)=>{
    var request = require("request");
    var body = '{"client_id":"' + clientId + '","client_secret":"' + client_secret + '", "audience":"' + audience + '","grant_type":"'+ grant_type + '"}';
    
    var options = { method: 'POST',
      url: app_url + 'oauth/token',
      headers: { 'content-type': 'application/json' },
      body: body}
      request(options, function (error, response, body) {
      if (error) throw new Error(error);
      res.send(body)
    });
})

/*This function lets the user change username.
it requires the user id (user_id) and the new name (new_name) in the body.*/
router.post('/user/changeUsername',(req,res)=>{
    var request = require("request");
    var user_id = req.body.user_id;
    var new_name = req.body.new_name;
    var user_acc_token = req.headers.authorization;
    console.log("Am I WORKING?")
    var my_url = app_url + 'api/v2/users/' + user_id;
    var my_body = {
        "nickname" : new_name
    }
    var options ={ method:'PATCH',
        url: my_url,
        headers: {'Content-Type': 'application/json',"Authorization": user_acc_token},
        body: JSON.stringify(my_body)
    };
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body)
        res.send(response)
    });

})

router.post('/user/changeUserNameEngine', (req,res)=>{
    var request = require('request');
    var playerId = req.body.oldName;
    var new_name = req.body.newName;

    var game_id = process.env.ID_GAME_ENGINE //
    var id_auth = process.env.ID_GAME_USER //
    var pw_auth = process.env.PW_GAME_ENGINE //
    var auth = "Basic " + Buffer.from(id_auth + ':' + pw_auth).toString('base64');
    var my_url = gamificationLink + "/gamification/gengine/execute"
    var now = new Date();
    var nowIso = now.toISOString();
    request({
        method:'POST',
        uri: my_url,
        headers:{
            "Authorization" : auth
        },
        body:{
            "actionId": "ChangeName",
            "data":{
                "gameID": game_id,
                "playerID": playerId,
                "solution":{"newName":new_name}
            },
            "executionMoment": nowIso,
            "gameId": game_id,
            "playerId": playerId
        },
        json:true

    },function(error,response,body){
        if(error){
            console.log("this is my error: " + error);
            console.log("this is my response: " + response);
        }
        const myJson = JSON.stringify(response);
        console.log("this is json: " +myJson);
        console.log("this is response: " +response);
        res.send(response)
    })
})

/*Get the data about a certain user,
it requires the user id in the body (userid)*/
router.get('/user/getUser/:userid',(req,res)=>{
    var request = require("request");
    var user_id = req.params.userid;
    var game_id = process.env.ID_GAME_ENGINE //
    var id_auth = process.env.ID_GAME_USER //
    var pw_auth = process.env.PW_GAME_ENGINE //
    var auth = "Basic " + Buffer.from(id_auth + ':' + pw_auth).toString('base64');
    //var my_url = "https://dev.smartcommunitylab.it/gamification-v3/data/game/" + game_id + "/player/"+ user_id;
    var my_url = gamificationLink + "/gamification/data/game/" + game_id + "/player/"+ user_id;
    request({
        method: 'GET',
        uri: my_url,
        headers: {
            "Authorization" : auth
        },
        json: true
    },function(error,response,body){
        if(error){
            console.log("this is my error: " + error);
            console.log("This is my response: " + response);
            res.status(404).send()
        }
        stringified_body = JSON.stringify(body);
        console.log("this is body: " +JSON.stringify(body));
        res.status(200).send(stringified_body)
    })
});

/* create a new user inside the gamification engine, if it already exists then it returns the user itself*/
//requires the username (userid) in the body 
router.post("/user/createNewUser",(req,res)=>{
    var request = require("request");
    var user_id = req.body.userid;
    var game_id = process.env.ID_GAME_ENGINE //
    var id_auth = process.env.ID_GAME_USER //
    var pw_auth = process.env.PW_GAME_ENGINE //
    var auth = "Basic " + Buffer.from(id_auth + ':' + pw_auth).toString('base64');
    //var my_url = "https://dev.smartcommunitylab.it/gamification-v3/data/game/" + game_id + "/player/"+ user_id;
    var my_url = gamificationLink + "/gamification/data/game/" + game_id + "/player/"+ user_id;
    //console.log(auth)
    console.log("CREATING NEW USER....")
    console.log(my_url);
    request({
        method: 'post',
        uri: my_url,
        headers: {
            "Authorization" : auth,
        },
        body:{
            "playerId": user_id,
            /*"customData":{
                "level_up_points": 0,
                "level": 0,
            }*/
        },
        json: true
    },function(error,response,body){
        if(error){
            console.log("this is my error: " + error);
            console.log("This is my response: " + response);
            res.status(404).send()
        }
        stringified_body = JSON.stringify(body);
        console.log("this is body: " +JSON.stringify(body));
        console.log("NOT STRINGIFIED BODY: "+body)
        res.status(200).send(body)
    })
});

//This API is used to get the classification of the users inside the game
router.get('/user/getUserClassification',(req,res)=>{
    var request = require("request");
    var game_id = process.env.ID_GAME_ENGINE //
    var id_auth = process.env.ID_GAME_USER //
    var pw_auth = process.env.PW_GAME_ENGINE //
    var auth = "Basic " + Buffer.from(id_auth + ':' + pw_auth).toString('base64');
    //var my_url = "https://dev.smartcommunitylab.it/gamification-v3/gengine/state/" + game_id + "?page=1&size=1000";
    var my_url = gamificationLink + "/gamification/gengine/state/" + game_id + "?page=1&size=1000";
    //console.log(my_url);
    request({
        method: 'GET',
        uri: my_url,
        headers: {
            "Authorization" : auth
        },
        json: true
    },function(error,response,body){
        if(error){
            console.log("this is my error: " + error);
            console.log("This is my response: " + response);
            res.status(404).send()
        }
        stringified_body = JSON.stringify(body);
        console.log("this is body: " +JSON.stringify(body));
        res.status(200).send(stringified_body)
    })
});

//deletes the answer previously given by a certain user and resets the number of validations.
//it requires the id of the way/nde (id), the type of the geometry (type) and the question that needs to be reset (question)in the body
router.post("/deleteUserAnswer", (req,res)=>{
    var id = req.body.id
    var question = req.body.question
    var type = req.body.type
    var sqlite = require('spatialite');
    var db = new sqlite.Database(databaseToUse);
    var query = "UPDATE question_table SET ANSWER = " + "\"\"" + ", USERANSWERED = "+ "\"\"" + ", NUMBEROFVALIDATIONS = 0" + ", USERSWHOVALIDATED = \"\""
               + " WHERE ID IS '" + id +"' AND TYPE IS '" + type + "'AND QUESTION IS '" + question + "'"  ;
    
    //UPDATE question_table SET ANSWER = "", USERANSWERED = "", NUMBEROFVALIDATIONS = 0, USERSWHOVALIDATED = "" WHERE ID IS 13858908 AND TYPE IS 'WAY' AND QUESTION IS 'Posso andare in bicicletta per questa strada?'
    console.log(query)
    const my_array = [];
    db.spatialite(function(err){
        db.each(query, function(err,row){
            //console.log(row)
            element = row;
            my_array.push(element)
        },function(err,rows){
            console.log(my_array);
            db.close();
            res.status(200).send(my_array);
        })
    }) 
})

//returns an array with all the points that are inside a certain geojson.
//it requires the geojson in the body.
router.post("/getAllPoints",(req,res) =>{
    var geojsonName = req.body.geojsonName;
    var idCoordinate;
    var allPoints = [];
    const fs = require('fs');
    fs.readFile("./pbfFiles/" + geojsonName,'utf-8',function readFileCallback(err,data){
        if (err){
            console.log(err);
        }else{
            var json_obj = JSON.parse(data);
            //Verifico se ci sono elementi da eliminare perchè sono presenti da troppo tempo
            var length = json_obj.features.length;
            for(var i=0; i<length;i++){
                //console.log(json_obj[i])
                //console.log(json_obj.features[i].geometry.coordinates);
                idCoordinate = {
                    "id" : json_obj.features[i].properties.id,
                    "coordinates": json_obj.features[i].geometry.coordinates
                }
                allPoints.push(idCoordinate);
            }
        }
        console.log(allPoints);
        res.status(200).send(allPoints);
    });
    
})

router.post("/get-osm-token",(req,res) => {
    var request = require("request");
    const token = req.get("token");
    var user_id = req.body.user_id;

    //console.log(token)
    try {
        // Make a request to the OSM API to obtain the access token
        const osmAuthTokenUrl = "https://" + domain + "/api/v2/users/" + user_id;
        //console.log(osmAuthTokenUrl)

        const options = {
            method: 'GET',
            uri: osmAuthTokenUrl,
            headers: { "Authorization" : token},
            json: true
        };
        
        request(options, (error, response, body) => {
            if (error) {
              console.error('Error retrieving OSM access token:', error);
              res.status(500).json({ error: 'Failed to retrieve OSM access token' });
            } else {
              // Extract the OSM access token from the response
              console.log("this is body: ")
              console.log(body);
              var osmToken = ""
              for(var i=0; i<body.identities.length; i++){
                  if(body.identities[i].connection == "OpenStreetMap"){
                      console.log("connected via OSM")
                      osmToken = body.identities[i].access_token;
                  }
              }
              if(osmToken == ""){
                  console.log("OSM Token not found");
                  res.status(404).json({error: "OSM token not found in this user"})
              }else{
                res.status(200).json({ osmToken });
              }
              //const osmToken = body.identities[0].access_token;
              //res.status(200).json({ osmToken });
            }
        });
    } catch (error) {
        console.error('Error retrieving OSM access token:', error);
        throw new Error('Failed to retrieve OSM access token');
    }
})

router.get('/checkTokenValidity', (req, res) => {
    try {
      // Invoke the middleware
      verify(req, res, (err) => {
        if (err) {
          // Middleware returned an error
          res.status(403).send({ error: 'Invalid token' });
        } else {
          // Middleware succeeded
          res.status(200).send({ valid: true });
        }
      });
    } catch (error) {
      // Error occurred while invoking the middleware
      res.status(500).send({ error: 'Internal server error' });
    }
});

router.get("/getOSMElement/:type&:id", (req,res)=>{
    const id = req.params.id;
    const type = req.params.type;
    const request = require("request");
    //GET OSM ELEMENT
    try{   
        //var osmUrlApi = "https://api.openstreetmap.org/api/0.6/";
        var osmUrlApi = "https://master.apis.dev.openstreetmap.org/api/0.6/";
        osmUrlApi = osmUrlApi + type + "/" + id;
        //console.log(osmUrlApi)

        const options = {
            method: 'GET',
            uri: osmUrlApi,
            headers: { "Content-Type":"application/json"},
        };
        
        request(options, function(error, response, body){
            if (error) {
                console.error('Error retrieving OSM element:', error);
                res.status(500).json({ error: 'Failed to retrieve OSM element' });
            } else if(response.statusCode!=200){
                res.status(500).send("Error retrieving OSM element");
            } else {
                //console.log("was able to retrieve OSM element")
                //console.log(body);
                res.status(200).send(body)
            }
        });

    } catch (error) {
        console.error('Error getting element:', error);
        throw new Error('Failed to retrieve OSM element');
    }
})

router.post("/sendOSM", (req,res)=>{
    const data = req.body.data;
    const token = req.get("osm_token");
    const id = data[0].id
    const type = data[0].type.toLowerCase();
    const request = require("request");
    
    const fullUrl = req.protocol + '://' + req.get('host') + "/posts/";
    console.log(fullUrl);

    console.log(req.body);
    console.log(token);

    //GET OSM ELEMENT
    try{   
        //const osmUrlApi = "https://api.openstreetmap.org/api/0.6/" + type + "/" + id;
        const osmUrlApi = fullUrl + "getOSMElement" + "/" + type + "&" + id;
        //console.log(osmUrlApi);

        const options = {
            method: 'GET',
            uri: osmUrlApi,
            headers: { "Content-Type":"application/json"},
            json: true
        };
        
        request(options, function(error, response, body){
            if (error) {
                console.error('Error retrieving OSM element:', error);
                res.status(500).json({ error: 'Failed to retrieve OSM element' });
            } else if(response.statusCode!=200){
                res.status(500).send("Error retrieving OSM ELEMENT");
            } else {
                console.log("was able to retrieve OSM element")
                console.log(body);
                const old_element = body;

                //CREATE CHANGESETS AND UPDATE ELEMENT IN OSM
                const importUrl = fullUrl + "importOSM";   
                console.log(importUrl);
                const my_body = {
                    "new_element": data,
                    "old_element": old_element
                }
                const importOptions = {
                    method: 'POST',
                    uri: importUrl,
                    headers: { "Content-Type":"application/json", "osm_token": token},
                    body: my_body,
                    json: true
                };

                request(importOptions, function(error,response,body){
                    if (error) {
                        console.error('Error importing OSM element:', error);
                        res.status(500).json({ error: 'Failed to retrieve OSM element' });
                    } else {

                        if(response.statusCode!=200){
                            console.log("THERE WAS INDEED AN ERROR!")
                            res.status(500).send(response)
                        }else{
                            console.log("seems everything went ok")
                            console.log(body)
                            res.status(200).send("OSM Element updated");
                        }
                    }
                })
                
                //res.status(200).json({ok: "ok"});
            }
        });

    } catch (error) {
        console.error('Error retrieving OSM access token:', error);
        throw new Error('Failed to retrieve OSM access token');
    }

});

router.post("/importOSM",async (req,res) =>{
    const fetch = require("node-fetch");
    const token = req.get("osm_token");
    try {
        const oldElement = req.body.old_element;
        const newElement = req.body.new_element;
        const osmPw = "Bearer " + token;

        //Get all the tags needed from the newElement.
        const id = newElement[0].id;
        const type = newElement[0].type.toLowerCase();
        var tagsKeys = [];
        var tagsAnswers = [];
        var newTagsXML = "";

        for(var i = 0; i < newElement.length; i++){
            tagsKeys.push(newElement[i].tagAnswer)
            tagsAnswers.push(newElement[i].openAnswer)
        }
        
        //Now get the tags from the osm element (that we are going to update)
        const { DOMParser } = require('xmldom');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(oldElement, 'application/xml');

        const oldTags = xmlDoc.getElementsByTagName('tag');
        const oldTagKeys = Array.from(oldTags).map((oldTags) => oldTags.getAttribute("k"));
        const oldTagElements = Array.from(oldTags).map((tag) => `<tag k="${tag.getAttribute("k")}" v="${tag.getAttribute("v")}" />`).join('');
        
        //CHECK NO DUPLICATE TAGS. If I find a key in the osm element that is inside my updated one, I have to remove it to avoid duplicates.
        const filteredArrayKeys = [];
        const filteredArrayAnswers = [];

        tagsKeys.forEach((element, index) => {
            if (!oldTagKeys.includes(element)) {
                filteredArrayKeys.push(element);
                filteredArrayAnswers.push(tagsAnswers[index]);
            }
        });

        for(var i = 0; i < filteredArrayKeys.length; i++){
            newTagsXML = newTagsXML + '<tag k="' + filteredArrayKeys[i] + '" v="' + filteredArrayAnswers[i].toLowerCase() + '" />' +'\n'
        }

        if(filteredArrayKeys.length == 0){
            //res.status(500).send("There was nothing to update, no new tags.")
            throw new Error('There was nothing to update, no new tags.');
        }

        const stringFilteredArrayKeys = filteredArrayKeys.join(", ");
        const stringFilteredArrayAnswers = filteredArrayAnswers.join(", ");
        //console.log(newTagsXML)
        //console.log(oldTagElements)
        
        /**
         * STEP 1: Create a Changeset
         * */ 
        const wayOrNodeElement = xmlDoc.getElementsByTagName(type)[0];
        const wayOrNodeVersion = wayOrNodeElement.getAttribute("version");
        let lat = ""
        let lon = ""

        //Get the lat and lon if it is a node
        if(type == "node"){
            lat = wayOrNodeElement.getAttribute("lat")
            lon = wayOrNodeElement.getAttribute("lon")
        }
    
        //const createChangesetUrl = "http://localhost:3000/api/0.6/changeset/create" //'https://api.openstreetmap.org/api/0.6/changeset/create';
        const createChangesetUrl = " https://master.apis.dev.openstreetmap.org/api/0.6/changeset/create"
        //const createChangesetBody = `<osm><changeset><tag k="source" v="BikingImprover" /><tag k="bot" v="yes" /></changeset></osm>`;
        const createChangesetBody = 
        `<osm>
    <changeset>
    <tag k="source" v="TESTING" />
    <tag k="bot" v="yes" />
    <tag k="comment" v="Adding tags to some OSM elements. Tags are about cyclability and were validated by users using Biking-Improver." />
    </changeset>
</osm>`;

        //SHOULD SAVE MY CHANGES SOMEWHERE SO THAT I CAN REVERT THEM HERE

        //
        const createChangesetResponse = await fetch(createChangesetUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/xml',
            Authorization: osmPw,
          },
          body: createChangesetBody,
        });
    
        if (!createChangesetResponse.ok) {
          throw new Error("Failed to create changeset");
        }
    
        const changesetId = await createChangesetResponse.text();
        console.log("this is my changeset id: " + changesetId);

        // Step 2: Update the Element
        const updateElementUrl = "https://master.apis.dev.openstreetmap.org/api/0.6/" + type + "/" + id;
        //const updateElementUrl = "https://api.openstreetmap.org/api/0.6/" + type + "/" + id;
        //const updateElementUrl = "http://localhost:3000/api/0.6/" + type + "/" + id;
        const updateElementBody = `<osm version="0.6">
                                    <changeset>
                                        <tag k="source" v="BikingImprover"/>
                                        <tag k="comment" v="Testing the update of a way, adding tags ${stringFilteredArrayKeys} with values ${stringFilteredArrayAnswers}"/>
                                    </changeset>
                                        <${type} id="${id}" changeset="${changesetId}" version="${wayOrNodeVersion}" ${type === 'node' ? ` lat="${lat}" lon="${lon}"` : ''}>
                                            ${oldTagElements}
                                            ${newTagsXML}
                                        </${type}>
                                    </osm>`;

        //console.log(updateElementBody);
        //console.log(updateElementUrl);
        
        const updateElementResponse = await fetch(updateElementUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/xml',
            Authorization: osmPw,
          },
          body: updateElementBody,
        });
    
        if (!updateElementResponse.ok) {
            console.log(updateElementResponse);
          throw new Error('Failed to update Element');
        }
    
        // Step 3: Close the Changeset
        //const closeChangesetUrl = "http://localhost:3000/api/0.6/changeset/" + changesetId + "/close"//`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`;
        const closeChangesetUrl = `https://master.apis.dev.openstreetmap.org/api/0.6/changeset/${changesetId}/close`

        const closeChangesetResponse = await fetch(closeChangesetUrl, {
          method: 'PUT',
          headers: {
            Authorization: osmPw,
          },
        });
    
        if (!closeChangesetResponse.ok) {
          console.log(closeChangesetResponse);
          throw new Error('Failed to close Changeset');
        }
    
        res.status(200).send('Success');
      } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
      }
});

router.post("/validated/sendToOsm"/*,verify*/, (req,res) =>{
    const io = req.app.get('io');
    const elements = req.body.completed;

    console.log("VALIDATED WORKING NOW SENDING THE ITEM TO OSM. THE ITEM IS:")
    console.log(elements);

    //Separate the answers based on the userAnswered variable.
    const lists = [];

    elements.forEach(item =>{
        const userAnswered = item.userAnswered;
        console.log(userAnswered)

        //Check if the list for that user already exists, if it does not then create it
        if(!lists[userAnswered]){
            lists[userAnswered] = [];
        }
        
        //push the item in the user list
        lists[userAnswered].push(item);
    })
    
    const validated = 2; // Replace with your logic
    //console.log(lists);
  
    let userFound = false;
    let userListFound = [];
    //let userListNotFound = [];
            
    //Get the lists elements.
    const listArray = Object.values(lists);
    //console.log(listArray.length)
  
    console.log(io.sockets.sockets);
    // Iterate through all connected sockets
    io.sockets.sockets.forEach((socket, socketId) => {
      // Get the authenticated user name from the socket request
      console.log("FORLOOP");
      const authenticatedUserName = socket.userSignedUpName;
      console.log(authenticatedUserName);

      //cycle through my elements based on the users, and then emit to the socket of the user the action. The value to pass is listArray[i].The user is listArray[i][0].userAnswered
      for(var i=0; i<listArray.length;i++){
          console.log("cycling user lists of elements")
          console.log(listArray[i][0].userAnswered);
          if(authenticatedUserName == listArray[i][0].userAnswered){
            socket.emit('validated', { value: listArray[i] }); //Send the data to the user so that he can send it via OSM Token
            userFound = true;
            userListFound.push(i); //so that I know which elements have the user online. So this elements will be sent by that user
          }else{
            //userListNotFound.push(i)
            console.log("Different user");
          }
      }
    });

    let sendToOSMList = [];

    if(userListFound.length !=0){
        for(var i=0; i<listArray.length; i++){
            for(var j=0; j<userListFound.length; j++){
                if(i == userListFound[j]){
                    //DO NOTHING
                }else{
                    //SEND DATA VIA MY OWN ACCOUNT SINCE THE USER IS NOT ONLINE AND I CANNOT SEND THE DATA WITH THEIR ACCOUNT
                    sendToOSMList.push(listArray[i]);
                }
            }
        }
    }else{
        sendToOSMList = listArray;
    }


    console.log("SHOULD SEND THIS WITH MY OSM ACCOUNT");
    console.log(sendToOSMList);

    //CALL FUNCTION TO SEND THESE DATA WITH MY ACCOUNT

    //if some users weren't found then send the data via our account, //Combine all missing user osm answers to a single one to send with our account
    /*if(userListNotFound.length != 0){

        console.log("Missing user");
        const sendToOSMList = [];
        for(var i=0; i<userListNotFound.length; i++){
            sendToOSMList.push(listArray[i]);
        }
        console.log("SHOULD SEND THIS WITH MY OSM ACCOUNT");
        console.log(sendToOSMList);
    }*/
  
    /*if (!userFound) {
      // Perform the desired action when no user with a matching name is found
      // Replace the following code with your actual implementation
      console.log('No connected user with the matching name found. Perform the desired action.');
    }*/
  
    res.status(200).json({ message: 'Value updated successfully' });
  
});

module.exports = router;