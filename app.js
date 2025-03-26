const express = require("express");
const path = require("path");
const { condition, getCondition } = require("./component/exController");


const app = express()

app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());

app.get("/",function (req,res) {
    console.log("Home");
    res.redirect("./diff")
})

app.get('/diff',function (req,res) {
    let cond = Object.assign( {
        date: new Date().toLocaleString()
    }, getCondition())
    console.log("app.cond", getCondition(), cond);
    return res.render("diff", cond)
})

app.get('*',(req,res)=>{
    res.status(404).send('<h1 align ="center" style="color:red">404 Not Found</h1>');
    console.log(req.method)
    console.log(req.url)
})

console.log("app is running");
module.exports = {
    app,
//  sessionParser
};