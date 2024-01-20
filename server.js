const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const multer = require("multer")
const upload = multer()
const sanitizeHTML = require("sanitize-html")

let db;

const app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function passwordProtected(req, res, next) {
    res.set("WWW-Authenticate", "Basic realm='Our MERN App'")
    if (req.headers.authorization == "Basic YWRtaW46YWRtaW4=") {
        next()
    } else {
        console.log(req.headers.authorization)
        res.status(401).send("Try again")
    }
}

app.get("/", async (req, res) => {
    const allAnimals = await db.collection("animals").find().toArray()
    // res.send(`<h1>Welcome to the page</h1> ${allAnimals.map(animal => `<p>${animal.name}- ${animal.species}</p>`).join('')}`);
    res.render("home", { allAnimals })
})

app.use(passwordProtected)

app.get("/admin", (req, res) => {
    // res.send("This is the top secret admin page");
    res.render("admin")
})

app.get("/api/animals", async (req, res) => {
    const allAnimals = await db.collection("animals").find().toArray();
    res.json(allAnimals)
})

const ourCleanUp = (req, res, next) => {
    if (typeof req.body.name != "string") req.body.name = ""
    if (typeof req.body.species != "string") req.body.speciese = ""
    if (typeof req.body._id != "string") req.body._id = ""


    req.cleanData = {
        name: sanitizeHTML(req.body.name.trim(), { allowedTags: [], allowedAttributes: {} }),
        species: sanitizeHTML(req.body.species.trim(), { allowedTags: [], allowedAttributes: {} })
    }

    next()
}

app.post("/create-animal", upload.single("photo"), ourCleanUp, async (req, res) => {
    console.log(req.body)
    const info = await db.collection("animals").insertOne(req.cleanData)
    const newAnimal = await db.collection("animals").findOne({ _id: new ObjectId(info.insertedId) })
    res.send(newAnimal)
})

async function start() {
    const client = new MongoClient("mongodb://localhost:27017/AmazingMernApp?&authSource=admin")
    await client.connect()
    db = client.db()
    app.listen(3000)
}

start()
