var express=require("express");
var app=express();
const fs=require("fs");
var mysql2=require("mysql2");
app.set("view engine","ejs");

app.get("/",function(req,resp){
    resp.render("home",{
        title: "home"
    });
})

app.use(express.static("public"));
app.use(express.urlencoded(true));
app.get("/signup",function(req,resp){
    resp.render("signup",{
        title: "signup"
    });
})

// signup form submission stores user in users.json
app.post("/signupd",function(req,resp){
    let email=req.body.txtEmail;
    let pwd=req.body.txtpassword;
    let uname=req.body.txtuname;
    let city=req.body.txtcity;
    let phone=req.body.txtphone;

    const user = { username: uname, password: pwd, email, city, phone };
    const filePath = "users.json";

    fs.readFile(filePath, 'utf8', (err, data) => {
        let users = [];
        if (!err && data) {
            try {
                users = JSON.parse(data);
                if (!Array.isArray(users)) users = [];
            } catch(e) {
                users = [];
            }
        }
        users.push(user);
        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing users.json', err);
                return resp.send('Failed to save user');
            }
            resp.render("main",{
                title: "main"
            });
        });
    });
});
app.get("/signin",function(req,resp){
    resp.render("signin",{
        title: "signin"
    });
})

app.get("/destination",function(req,resp){
    resp.render("destination",{
        title: "destination"
    });
})
app.get("/booking",function(req,resp){
    resp.render("booking",{
        title: "booking"
    });
})
app.get("/feedback",function(req,resp){
    resp.render("feedback",{
        title: "feedback"
    });
})
app.get("/login",function(req,resp){
    let email=req.query.txtemail;
    let pwd=req.query.txtpassword;
    const data=fs.readFileSync("users.json");
    const users=JSON.parse(data);
    // stored object uses password property
    const user=users.find(u => u.email === email && u.password === pwd);
    if(user){
        resp.render("main",{
            title: "main"
        });
        
        }
        else
        resp.send("Invalid email or password");
        
    
    
});
app.get("/gallery",function(req,resp){
    
   
            resp.render("gallery",{
                title: "gallery"
            });
            
        }
        
    
    
)
app.get("/feed",function(req,resp){
    let email=req.query.txtemail;
    let uname=req.query.uname;
    let feedback=req.query.feedback;


    sj.query("insert into feedbackform(uname,email,feedback) values(?,?,?)",[uname,email,feedback],function(err){
        if(err==null)
        {
           
         resp.send("thnku sir");

        }
        else
            resp.send(err.message)
    })

})
app.get("/book",function(req,resp){
    let email=req.query.femail;
    let city=req.query.city;
    let phone=req.query.fphone;
    let desti=req.query.fdesti;
    let last=req.query.flast;
    let fname=req.query.ffname;



    sj.query("insert into book(fname,last,email,city,phone,desti) values(?,?,?,?,?,?)",[fname,last,email,city,phone,desti],function(err){
        if(err==null)
        {
           
         resp.send("congratulations!! Your request has been send and will be updated very soon");

        }
        else
            resp.send(err.message)
    })

})
app.get("/mainx",function(req,resp){ 
    resp.render("main",{
        title: "main"
    });
})

app.listen(805,function(){
    console.log("server started");})
    