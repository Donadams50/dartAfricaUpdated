const express = require('express');
const app = express();
const bodyparser = require('body-parser');
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(bodyparser.json());


const cors = require("cors");

app.use(cors()); 
const path = require('path')

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

  require('./app/mongoose')
  require('./app/members/members.routes')(app)
  require('./app/notifications/notifications.routes')(app)
  require('./app/ratecalculator/ratecalculator.routes')(app)
  require('./app/adminconfig/adminconfig.routes')(app)
  require('./app/trades/trades.routes')(app)
  require('./app/transactions/transactions.routes')(app)
  require('./app/files/files.routes')(app)
  require('./app/withdrawrequest/withdrawrequest.routes')(app)

  
 app.get('/',  (req,res)=>{
    res.status(200).send({message:"Welcome to Dart Africa"})
         
     })

     
// Connect to port 
const port = process.env.PORT || 8000     

app.listen(port, ()=> console.log(`listening on port ${port}...`)); 