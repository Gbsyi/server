const mysql = require('mysql2');
const express = require("express");
const bodyParser = require("body-parser");
const { urlencoded } = require('express');
const cookieParser = require("cookie-parser");
const e = require('express');
const { signedCookie } = require('cookie-parser');
const app = express();
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser('secret'));

const urlencodedParser = bodyParser.urlencoded({extended:false});
const pool = mysql.createPool({
    connectionLimit: 5,
    host: "localhost",
    user: "mysql",
    database: "Lager",
    password: "mysql"
});

const connection = mysql.createConnection({
    host: "localhost",
    user: "mysql",
    database: "Lager",
    password: "mysql"
});

connection.connect(function(err) {
    if(err){
        return console.error("Error" + err.message);
    }
    else{
        console.log("MySql подключен");
    }
});


app.set("view engine", "hbs");

app.get("/", function(req, res){
    res.render("index.hbs")
});

app.get("/search", function(req,res) {
   res.render("search.hbs"); 
});
app.post("/search", urlencodedParser, function(req,res) {
    if(!req.body) return res.sendStatus(400);
    const camp = req.body.camp;
    pool.query("SELECT * FROM camps WHERE name=?",[camp], function(err,data) {
        if(err) return console.log(err.message);
        res.render("search.hbs", {
            result: data
        });
     });
});
app.get("/about", function(req,res){
    res.render("about.hbs");
});
app.get("/choose-camp", function(req,res){
    pool.query("SELECT * FROM camps", function(err, data) {
        if(err) return console.log(err);
        res.render("choose-camp.hbs", {
            camps: data
        });
      });
});
app.get("/contacts", function(req,res){
    res.render("contacts.hbs");
   
});
app.post("/camp-page", urlencodedParser, function(req,res) {
   if(!req.body) return res.sendStatus(400);
   const camp_id = req.body.camp_id;        
   pool.query("SELECT * FROM camps WHERE id=?",[camp_id], function(err,data){
       if(err) return console.log(err.message);
       res.render("camp-page.hbs",{
           result: data
       });
   });
});
app.get("/camp-page", function(req,res) {
   res.render("camp-page.hbs");
});


//ADMIN
app.get("/administratorLogin", function(req,res){
    res.render("adminPanel/administratorLogin.hbs");
});
app.get("/administrator", function(req,res){
    userId = req.signedCookies['userId'];
    userLogin = req.signedCookies['login'];
    userPassword = req.signedCookies['password'];
    if(userId != undefined){
        pool.query("select * from users where id=?",[userId],function(err,data){
            if(userLogin == data[0].user_login && userPassword == data[0].user_password){
                res.render("adminPanel/administratorMenu.hbs",{
                    user_id: userId,
                    user_login: userLogin,
                    user_password: userPassword
                });
                
            }
        });
    }
    else
    {
        res.redirect("/administratorLogin");
    }

});

app.post("/administratorLogin", urlencodedParser, function(req,res){
    if(!req.body) return res.sendStatus(400);
    let login = req.body.login;
    let password = req.body.password;
    let userId;
    console.log("\n\nАвторизация:");
    console.log("Введённый логин:", login, "\nВведённый пароль", password);
    pool.query("SELECT * FROM users", function(err,data){
        console.log("Считал данные из бд")
        if(err){
            console.log("Error: " + err.message);
        }
        data.forEach(element => {
            console.log(login, "?", element.user_login,"    ",password,"?", element.user_password);
            if(element.user_password == password && element.user_login == login){
                userId = element.id; 
                founded = true;
            }             
        });
        if(founded){
            res.cookie('login',login, {
                secure: true,
                signed: true
            });
            res.cookie('password', password,{
                secure:true,
                signed: true
            });
            res.cookie('userId',userId,{
                secure:true,
                signed:true
            })            
            res.redirect("/administrator");
        }
        else{
            res.redirect("/administratorLogin",{
                error: true
            });
        }
    });
    
});

//USERS
app.get("/administrator/users", function(req,res){
    userId = req.signedCookies['userId'];
    userLogin = req.signedCookies['login'];
    userPassword = req.signedCookies['password'];
    if(userId != undefined){
        pool.query("select * from users where id=?",[userId],function(err,data){
            if(userLogin == data[0].user_login && userPassword == data[0].user_password){
                pool.query("select * from users", function(err,selectData){
                    if(err) throw err;
                    res.render("adminPanel/users.hbs",{
                        users:selectData,
                        user_id: userId,
                        user_login: userLogin,
                        user_password: userPassword
                    });
                });
            }
        });
    }
    else
    {
        res.redirect("/administratorLogin");
    }
});
app.post('/administrator/users', urlencodedParser, function(req,res){
    if(!req.body)   return res.sendStatus(400);
    let login = req.body.newUserLogin;
    let password = req.body.newUserPassword;
    let userId;
    pool.query("INSERT INTO `users`( `user_login`, `user_password`) VALUES ('"+login+"','"+password+"')", function(err,result){
        if(err) throw err;
        res.redirect('/administrator/users');
    })
});

//CAMPS
app.get('/administrator/camps',function(req,res){
    userId = req.signedCookies['userId'];
    userLogin = req.signedCookies['login'];
    userPassword = req.signedCookies['password'];
    if(userId != undefined){
        pool.query("select * from users where id=?",[userId],function(err,data){
            if(userLogin == data[0].user_login && userPassword == data[0].user_password){
                //Загрузка страницы 
                pool.query('select * from camps',function(err,campsData){
                    if(err) throw err;
                    res.render("adminPanel/camps.hbs",{
                        camps: campsData,
                        user_id: userId,
                        user_login: userLogin,
                        user_password: userPassword
                    });
                })
                
            }
        });
    }
    else
    {
        res.redirect("/administratorLogin");
    }
});
//LISTEN
app.listen(8080, function() {
    console.log("Сервер запущен.");
});

