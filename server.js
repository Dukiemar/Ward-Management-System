const express = require('express');
const mysql = require('mysql');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
//var inside = require('point-in-polygon');
//const routes = require('./routes/route');
//create database connection
const db = mysql.createConnection({
    host    : 'localhost',
    user    : 'root',
    password: 'wosm2020',
    database: 'wosm',
    multipleStatements: true
});
//connect to database
db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('MySQL Connection successful')
});

//start app(view in browser @ localhost:3000)
const app = express();
const server = http.createServer(app);//added************
const io = socketIo(server);

const locationMap = new Map();
const historyMap = new Map();

io.on('connection', socket => {
    socket.on('updateLocation', pos => {
      locationMap.set(socket.id, pos)
      /////load to DB
    })

    socket.on('watchLocation',(pos,userid)=> {
    historyMap.set(socket.id,pos)
    console.log(historyMap);
    console.log(Array.from(historyMap)[0][1].lat,Array.from(historyMap)[0][1].lng);
    let insertCoords = "Insert into coordinates (wardid,lat,lng)VALUES(?,?,?);"
    db.query(insertCoords,[userid,Array.from(historyMap)[0][1].lat,Array.from(historyMap)[0][1].lng], function (error, results, fields) {
      if (error){
      console.log(error);
      } 
      else  
      {
         console.log('success');
      }
      });

    })
  
    socket.on('requestLocations', () => {
      socket.emit('locationsUpdate', Array.from(locationMap))
    })
  
    socket.on('disconnect', () => {
      locationMap.delete(socket.id)
    })
//out of bound violation
    socket.on('sendAlert', () => {
        
        /////
        const Nexmo = require('nexmo');

        const nexmo = new Nexmo({
        apiKey: 'af4e56c4',
        apiSecret: '8c0VK8T6qv56XOGe',
        });

        const from = 'ACK ALERT';
        const to = '18764522250';
        const text = 'Whereabouts Violation!';

        nexmo.message.sendSms(from, to, text, (err, responseData) => {
            if (err) {
                console.log(err);
            } else {
                if(responseData.messages[0]['status'] === "0") {
                    console.log("Message sent successfully.");
                } else {
                    console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                }
            }
        })
        /////
      })

  })

//*************************
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

app.set('views', path.join(__dirname, '/views/'));
app.engine('hbs', exphbs({extname: 'hbs', defaultLayout: 'mainLayout', layoutsDir: __dirname + '/views/layouts/' }));

server.listen('3000',() => {
    console.log('Server started on port : 3000')
});//*****word server replaced app */

//app.use(express.static('images'));//need this for external thngs to work like css and images

//app.use('/', routes);

app.get('/createRecord', (req,res) => {
   res.render('index.hbs',{
      viewTitle: "NEW CASE FILE"
  });
});

app.post('/createRecord', function(req,res) {
    console.log(req.body);
   let insertRecord = "INSERT INTO WARDS(firstname,middlename,lastname,gender,dateofbirth,address,parish,customfile,sicklecell,diabetes,heartdisease,cancer,epilepsy,blooddisorder,disability,disability1,disability2,attendschool,schoollevel,schoolname,schooladdress,schoolparish,latitude,longitude,homelatitude,homelongitude)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
   db.query(insertRecord,[req.body.firstname,req.body.middlename,req.body.lastname,req.body.gender,req.body.dateOfBirth,req.body.address,req.body.parish,req.body.customfile,req.body.sicklecell,req.body.diabetes,req.body.heartdisease,req.body.cancer,req.body.epilepsy,req.body.blooddisorder,req.body.disability,req.body.disability1,req.body.disability2,req.body.attendschool,req.body.schoollevel,req.body.schoolname,req.body.schooladdress,req.body.schoolparish,req.body.lat,req.body.lon,req.body.lat1,req.body.lon1], function (error, results, fields) {
       if (error){
       console.log(error);
       } 
       else
       {
          res.redirect('/')
       }
   });;
});

app.get('/' , function(req, res){
    let getall="SELECT * from wards;SELECT count (distinct(wardid)) as 'wardcount' from wards join medicalnotes on id=wardid where physicalabuse='yes' or sexualabuse='yes' or distress='yes';SELECT count(distinct(wardid)) as 'wardcounthome' from wards join homenotes on id=wardid where homeabuse='yes' or homepsycho='yes' or homeattitude<2;SELECT count(distinct(wardid)) as 'wardcountschool' from wards join schoolnotes on id=wardid where avg<'50' or 'behaviour'<'10';"
    db.query(getall, function (error, results, fields) { //console.log(results[1][0].wardcount)
        if (error){
        console.log(error);
        }
        else 
        {
            res.render('wardList.hbs', {
                list : results[0],
                wardcount : results[1][0].wardcount,
                wardcounthome : results[2][0].wardcounthome,
                wardcountschool : results[3][0].wardcountschool,
            });
        }
      });
});

app.get('/update/:id' , function(req, res){
    let updateQuery ='SELECT * from wards where id = ?';
    //console.log(req.params);
      db.query(updateQuery,req.params.id, function (error, results, fields) {
          if (error){
          console.log(error);
          } 
          else 
          { 
           //let rows = JSON.stringify(results));
           //console.log(results[0]);
            res.render('updateRecord.hbs', {
             viewTitle : "Update Record", 
             id : results[0].id,
             firstname : results[0].firstname,
             middlename : results[0].middlename,
             lastname : results[0].lastname,
             gender : results[0].gender,
             dateofbirth: results[0].dateofbirth,
             address: results[0].address,
             parish: results[0].parish,
             customfile: results[0].customfile,
             sicklecell: results[0].sicklecell,
             diabetes: results[0].diabetes,
             heartdisease: results[0].heartdisease,
             cancer: results[0].cancer,
             epilepsy: results[0].epilepsy,
             blooddisorder: results[0].blooddisorder,
             disability: results[0].disability,
             disability1: results[0].disability1,
             disability2: results[0].disability2,
             attendschool: results[0].attendschool,
             schoollevel: results[0].schoollevel,
             schoolname: results[0].schoolname,
             schooladdress: results[0].schooladdress,
             schoolparish: results[0].schoolparish
            });  
          }
        });
});

app.post('/updates/:id' , function(req, res){
    let updateQuery ='UPDATE wards SET firstname=?,middlename=?,lastname=?,gender=?,dateofbirth=?,address=?,parish=?,customfile=?,sicklecell=?,diabetes=?,heartdisease=?,cancer=?,epilepsy=?,blooddisorder=?,disability=?,disability1=?,disability2=?,attendschool=?,schoollevel=?,schoolname=?,schooladdress=?,schoolparish=?,latitude=?,longitude=?,homelatitude=?,homelongitude=? where id =?';
    //let IdtoUpdate=res.body.memberid;
      db.query(updateQuery,[req.body.firstname,req.body.middlename,req.body.lastname,req.body.gender,req.body.dateOfBirth,req.body.address,req.body.parish,req.body.customfile,req.body.sicklecell,req.body.diabetes,req.body.heartdisease,req.body.cancer,req.body.epilepsy,req.body.blooddisorder,req.body.disability,req.body.disability1,req.body.disability2,req.body.attendschool,req.body.schoollevel,req.body.schoolname,req.body.schooladdress,req.body.schoolparish,req.body.lat,req.body.lon,req.body.lat1,req.body.lon1,req.params.id], function (error, results, fields) {
          if (error){
          console.log(error);
          } 
          else
          {     
           res.redirect('/');
              console.log(req.body);
          }
        });
  }); 


app.get('/view/:id' , function(req, res){
        let updateQuery ="SELECT * from wards where id = ?;Select homes.homename,homes.homeaddress,homes.homeparish,disabilityhome,round(sqrt((((wards.longitude*0.0174533-(homes.longitude*0.0174533/(wards.longitude/wards.longitude))) * cos((homes.latitude*0.0174533+wards.latitude*0.0174533)/2)) * ((wards.longitude*0.0174533-homes.longitude*0.0174533) * cos((homes.latitude*0.0174533+wards.latitude*0.0174533)/2))) + ((wards.latitude*0.0174533-homes.latitude*0.0174533)*(wards.latitude*0.0174533-homes.latitude*0.0174533)))*6371,2) as 'dist',round(sqrt((((wards.homelongitude*0.0174533-homes.longitude*0.0174533) * cos((homes.latitude*0.0174533+wards.homelatitude*0.0174533)/2)) * ((wards.homelongitude*0.0174533-homes.longitude*0.0174533) * cos((homes.latitude*0.0174533+wards.homelatitude*0.0174533)/2))) + ((wards.homelatitude*0.0174533-homes.latitude*0.0174533)*(wards.homelatitude*0.0174533-homes.latitude*0.0174533)))*6371,2) as 'disthome' from homes join wards on wards.disability=homes.disabilityhome where (homegender=(select gender from wards where id=?) or homegender=('mixed')) and id=? order by dist,disthome limit 1;SELECT*from homes;SELECT homename FROM homes join placement on homes.homeid=placement.homeid where placement.wardid=?;Select notes from wardnotes where wardid=?";
        //console.log(req.params);    
        db.query(updateQuery,[req.params.id,req.params.id,req.params.id,req.params.id,req.params.id], function (error, results, fields) {
            if (error){
                console.log(error);
                } 
            else 
                { let notetext = '';
                    if (results[4][0]==undefined){notetext=''}else{notetext=results[4]}

                   let placement1 = '';
                   if(results[3][0]==undefined){placement1=''}else{placement1=results[3][0].homename}
                //let row = JSON.parse(JSON.stringify(results[0]));
                console.log(results[0][0]);
                console.log(results[1]);
                res.render('viewprofile.hbs', {
                 viewTitle : "Profile Overview", 
                 list: results[2],
                 id : results[0][0].id,
                 firstname : results[0][0].firstname,
                 middlename : results[0][0].middlename,
                 lastname : results[0][0].lastname,
                 gender : results[0][0].gender,
                 dateofbirth: results[0][0].dateofbirth,
                 address: results[0][0].address,
                 parish: results[0][0].parish,
                 customfile: results[0][0].customfile,
                 sicklecell: results[0][0].sicklecell,
                 diabetes: results[0][0].diabetes,
                 heartdisease: results[0][0].heartdisease,
                 cancer: results[0][0].cancer,
                 epilepsy: results[0][0].epilepsy,
                 blooddisorder: results[0][0].blooddisorder,
                 disability : results[0][0].disability,
                 disability1: results[0][0].disability1,
                 disability2: results[0][0].disability2,
                 attendschool: results[0][0].attendschool,
                 schoollevel: results[0][0].schoollevel,
                 schoolname: results[0][0].schoolname,
                 schooladdress: results[0][0].schooladdress,
                 schoolparish: results[0][0].schoolparish,
                 reco : results[1][0].homename,
                 reco1 : results[1][0].homeaddress,
                 reco2 : results[1][0].homeparish,
                 reco3 : results[1][0].dist,
                 reco4 : results[1][0].disthome,
                 //the query to get the picklist is Results[3]
                 placement : placement1,
                 notes : notetext,//'notes' must have the same name as whats in the database for it to display on HBS screen
                });   
           }
        });      
    });

    app.post('/view/:id' , function(req, res){
        let insertQuery1 ="INSERT INTO wardnotes(wardid,notes)VALUES(?,?)";
        //let IdtoUpdate=res.body.memberid;
          console.log(req.body);
          db.query(insertQuery1,[req.body.id,req.body.notes], function (error, results, fields) {
              if (error){
              console.log(error);
              } 
           else{res.redirect('/view/'+req.body.id);}
            });
      });

      app.post('/place/:id' , function(req, res){
        let insertQuery1 ="INSERT INTO placement(homeid,wardid)VALUES(?,?) ON DUPLICATE KEY UPDATE homeid=?";
          console.log(req.body);
          db.query(insertQuery1,[req.body.placement,req.body.id,req.body.placement], function (error, results, fields) {
              if (error){
              console.log(error);
              } 
           else{res.redirect('/view/'+req.body.id);}
            });
      });

    app.get('/medical/:id', (req,res) => {
        let getquery = "SELECT mednotes,dateofvisit from medicalnotes where wardid = ?;"
        db.query(getquery,[req.params.id], function(error, results, fields){
            if (error){
                console.log(error);
                } 
             else{ console.log(results);
                let notes1 = '';
                if (results[0]==undefined){notes1=''}else{notes1=results}
                //console.log(notes1);
                res.render('medicalnotes.hbs',{
                viewTitle: "MEDICAL RECORD",
                id : req.params.id,
                mednotes : notes1 //'mednotes' must have the same name a whats in the database else this wont work on HBS
                 });
                }
              });
    });      

    app.post('/medical/:id', function(req,res) {
        //console.log(req.params);
        console.log(req.body);
       let insertRecord = "INSERT INTO medicalnotes(wardid,dateofvisit,physicalabuse,sexualabuse,distress,mednotes)VALUES(?,?,?,?,?,?)";
       db.query(insertRecord,[req.params.id,req.body.dateofvisit,req.body.physicalabuse,req.body.sexualabuse,req.body.distress,req.body.mednotes], function (error, results, fields) {
           if (error){
           console.log(error);
           } 
           else  
           {
              res.redirect('/medical/'+req.params.id)
           }
       });
    });
   

    app.get('/school/:id', (req,res) => {
        let getquery = "SELECT snotes,dateofreport from schoolnotes where wardid = ?;"
        db.query(getquery,[req.params.id], function(error, results, fields){
            if (error){
                console.log(error);
                } 
             else{ //console.log(results);
                let notes1 = '';
                if (results[0]==undefined){notes1=''}else{notes1=results}
                console.log(notes1);
                res.render('schoolnotes.hbs',{
                viewTitle: "ACADEMIC RECORD",
                id : req.params.id,
                snotes : notes1,
                //'snotes' must have the same name a whats in the database else this wont work on HBS    
            });
                }
              });
    });   


    app.post('/school/:id', function(req,res) {
        console.log(req.params);
       let insertRecord = "INSERT INTO schoolnotes(wardid,dateofreport,avg,aptitude,workattitude,peerattitude,deportment,socialinteractions,snotes)VALUES(?,?,?,?,?,?,?,?,?)";
       db.query(insertRecord,[req.params.id,req.body.dateofreport,req.body.avg,req.body.aptitude,req.body.workattitude,req.body.peerattitude,req.body.deportment,req.body.socialinteractions,req.body.snotes], function (error, results, fields) {
           if (error){
           console.log(error);
           } 
           else  
           {
              res.redirect('/school/'+req.params.id)
           }
       });;
    });
    

    app.get('/urgent' , function(req, res){
        let geturgent="SELECT distinct wardid,firstname,middlename,lastname,gender,max(dateofvisit) from wards join medicalnotes on id=wardid where physicalabuse='yes' or sexualabuse='yes' or distress='yes' group by wardid;"
        db.query(geturgent, function (error, results, fields) { console.log(results);
            if (error){
            console.log(error);
            }
            else 
            {
                res.render('medurgentcases.hbs', {
                    list : results
                });
            }
          });
    });

    app.get('/urgent/:id' , function(req, res){
        let geturgent="SELECT distinct(wardid),firstname,middlename,lastname,gender,dateofvisit,physicalabuse,sexualabuse,distress from wards join medicalnotes on id=wardid where physicalabuse='yes' or sexualabuse='yes' or distress='yes' and wardid=? order by dateofvisit desc limit 1;SELECT mednotes,dateofvisit from medicalnotes where wardid = ?;"
        db.query(geturgent,[req.params.id,req.params.id], function (error, results, fields) { console.log(results);
            if (error){
            console.log(error);
            }
            else 
            {
                let notes1 = '';
                if (results[1][0]==undefined){notes1=''}else{notes1=results[1]}
                res.render('investigateurgent.hbs', {
                    firstname : results[0][0].firstname,
                    middlename : results[0][0].middlename,
                    lastname : results[0][0].lastname,
                    gender : results[0][0].gender,
                    physicalabuse: results[0][0].physicalabuse,
                    sexualabuse: results[0][0].sexualabuse,
                    distress: results[0][0].distress,
                    mednotes : notes1
                });
            }
          });
    });

    app.get('/urgenthome' , function(req, res){
        let geturgent="SELECT distinct wardid,firstname,middlename,lastname,gender,max(dateofreport) from wards join homenotes on id=wardid where homeabuse='yes' or homepsycho='yes' or homeattitude<2 group by wardid;"
        db.query(geturgent, function (error, results, fields) { console.log(results);
            if (error){
            console.log(error);
            }
            else 
            {
                res.render('homeurgentcases.hbs', {
                    list : results
                });
            }
          });
    });

    app.get('/urgenthome/:id' , function(req, res){
        let geturgent="SELECT distinct(wardid),firstname,middlename,lastname,gender,dateofreport,homeabuse,homepsycho,homeattitude from wards join homenotes on id=wardid where homeabuse='yes' or homepsycho='yes' or homeattitude<2 and wardid=? order by dateofreport desc limit 1;SELECT hnotes,dateofreport from homenotes where wardid = ?;"
        db.query(geturgent,[req.params.id,req.params.id], function (error, results, fields) { console.log(results);
            if (error){
            console.log(error);
            }
            else 
            {
                let notes1 = '';
                if (results[1][0]==undefined){notes1=''}else{notes1=results[1]}
                res.render('investigateurgenthome.hbs', {
                    firstname : results[0][0].firstname,
                    middlename : results[0][0].middlename,
                    lastname : results[0][0].lastname,
                    gender : results[0][0].gender,
                    homeabuse: results[0][0].homeabuse,
                    homepsycho: results[0][0].homepsycho,
                    homeattitude: results[0][0].homeattitude,
                    hnotes : notes1
                });
            }
          });
    });

    app.get('/urgentschool' , function(req, res){
        let geturgent="SELECT distinct wardid,firstname,middlename,lastname,gender,max(dateofreport),avg,(aptitude+workattitude+peerattitude+deportment+socialinteractions) as 'behaviour' from wards join schoolnotes on id=wardid where avg<'50' or 'behaviour'<'10' group by wardid;"
        db.query(geturgent, function (error, results, fields) { console.log(results);
            if (error){ console.log(results)
            console.log(error);
            }
            else 
            {
                res.render('schoolurgentcases.hbs', {
                    list : results
                });
            }
          });
    });

    app.get('/urgentschool/:id' , function(req, res){
        let geturgent="SELECT distinct(wardid),firstname,middlename,lastname,gender,dateofreport,avg,(aptitude+workattitude+peerattitude+deportment+socialinteractions) as 'behaviour' from wards join schoolnotes on id=wardid where avg<'50' or 'behaviour'<'10' and wardid=? order by dateofreport desc limit 1;SELECT snotes,dateofreport from schoolnotes where wardid = ?;"
        db.query(geturgent,[req.params.id,req.params.id], function (error, results, fields) { console.log(results);
            if (error){
            console.log(error);
            }
            else 
            {
                let notes1 = '';
                if (results[1][0]==undefined){notes1=''}else{notes1=results[1]}
                res.render('investigateurgentschool.hbs', {
                    firstname : results[0][0].firstname,
                    middlename : results[0][0].middlename,
                    lastname : results[0][0].lastname,
                    gender : results[0][0].gender,
                    avg: results[0][0].avg,
                    behaviour: results[0][0].behaviour,
                    snotes : notes1
                });
            }
          });
    });

    app.get('/home/:id', (req,res) => {
        let getquery = "SELECT hnotes,dateofreport from homenotes where wardid = ?;"
        db.query(getquery,[req.params.id], function(error, results, fields){
            if (error){
                console.log(error);
                } 
             else{ //console.log(results);
                let notes1 = '';
                if (results[0]==undefined){notes1=''}else{notes1=results}
                console.log(notes1);
                res.render('homenotes.hbs',{
                viewTitle: "HOME MANAGER'S REPORT",
                id : req.params.id,
                hnotes : notes1,
                //'snotes' must have the same name a whats in the database else this wont work on HBS    
            });
                }
              });
    }); 

    app.post('/home/:id', function(req,res) {
        console.log(req.params);
       let insertRecord = "INSERT INTO homenotes(wardid,dateofreport,homeabuse,homepsycho,homeattitude,homeinteraction,hnotes)VALUES(?,?,?,?,?,?,?)";
       db.query(insertRecord,[req.params.id,req.body.dateofreport,req.body.homeabuse,req.body.homepsycho,req.body.homeattitude,req.body.homeinteraction,req.body.hnotes], function (error, results, fields) {
           if (error){
           console.log(error);
           } 
           else  
           {
              res.redirect('/home/'+req.params.id)
           }
       });;
    });


     app.get('/map/:id' , function(req, res){
        let getall="SELECT latitude,longitude from homes join placement on homes.homeid=placement.homeid where placement.wardid=?;Select latitude,longitude from wards where id=?;Select distinct lat,lng,lastUpdated from coordinates where wardid=? group by lat,lng";
        db.query(getall,[req.params.id,req.params.id,req.params.id], function (error, results, fields) { console.log(results[2]);
            if (error){
            console.log(error);
            }
            else 
            {
                let latitude1 = '';
                let longitude1= '';
                if (results[0][0]==undefined){latitude1=''}else{latitude1=results[0][0].latitude}
                if (results[0][0]==undefined){longitude1=''}else{longitude1=results[0][0].longitude}
                res.render('map.hbs', {
                    viewTitle: "Ward's Location Tracker",
                    latitude : latitude1,
                    longitude : longitude1,
                    schoollat : results[1][0].latitude,
                    schoollng : results[1][0].longitude,
                    list : results[2]
                });
            }
          });
    });

    app.get('/track/:id', (req, res) => {console.log(req.params.id)
        res.render('tracker.hbs',{
            userid : req.params.id
            })
      })

      app.get('/viewtrack', (req, res) => {
        res.render('viewer.hbs')
      })

      